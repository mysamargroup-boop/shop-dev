
"use client";

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, CheckCircle, Tag, X, FileText, Zap, Phone } from 'lucide-react';
import { generateWhatsAppCheckoutMessage, WhatsAppCheckoutInput } from '@/ai/flows/whatsapp-checkout-message';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { createPaymentLink } from '@/lib/payment';
import ImageUploadHandler from '@/components/checkout/ImageUploadHandler';
import Link from 'next/link';
import type { Coupon, OrderItem, Product } from '@/lib/types';
import { BLUR_DATA_URL } from '@/lib/constants';

interface WhatsAppCheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutInput: Omit<WhatsAppCheckoutInput, 'customerName' | 'customerPhoneNumber' | 'customerAddress' | 'extraNote'> & { productImages?: string[]; sku?: string, products?: OrderItem[], uploadProductIds?: string[] } | null;
  checkoutMode: 'whatsapp' | 'payment';
}

const OrderSummary = ({
  checkoutInput,
  couponCode,
  setCouponCode,
  handleApplyCoupon,
  handleRemoveCoupon,
  couponDiscount,
  finalTotal,
  advanceAmount,
  mode,
}: {
  checkoutInput: WhatsAppCheckoutModalProps['checkoutInput'];
  couponCode: string;
  setCouponCode: (value: string) => void;
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
  couponDiscount: number;
  finalTotal: number;
  advanceAmount: number;
  mode: 'whatsapp' | 'payment';
}) => {
  if (!checkoutInput) return null;
  
  const supportPhoneNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER;

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
      <h4 className="font-semibold text-lg flex items-center gap-2">
        Order Summary
      </h4>
      {checkoutInput.productImages && checkoutInput.productImages.length > 0 && (
        <div className="flex gap-2">
          {checkoutInput.productImages.slice(0, 3).map((img, i) => (
            <Image key={i} src={img} alt={checkoutInput.productName} width={64} height={64} className="rounded-md object-cover"/>
          ))}
          {checkoutInput.productImages.length > 3 && <div className="w-16 h-16 rounded-md bg-muted flex items-center justify-center text-xs text-muted-foreground">+{checkoutInput.productImages.length - 3} more</div>}
        </div>
      )}
      <p className="font-semibold">{checkoutInput.productName}</p>
      <div className="text-sm space-y-1 text-muted-foreground">
        <div className="flex justify-between"><span>Subtotal:</span> <span>₹{checkoutInput.productPrice.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Shipping:</span> <span>{checkoutInput.shippingCost > 0 ? `₹${checkoutInput.shippingCost.toFixed(2)}` : 'Free'}</span></div>

        {couponDiscount > 0 && (
          <div className="flex justify-between text-green-600">
            <span>Coupon Discount:</span>
            <span>-₹{couponDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-foreground pt-2 border-t"><span>Total:</span> <span>₹{finalTotal.toFixed(2)}</span></div>

         {mode === 'payment' && (
          <div className="flex justify-between font-bold text-primary pt-2 border-t">
            <span>Advance Payable (5%):</span>
            <span>₹{advanceAmount.toFixed(2)}</span>
          </div>
        )}
      </div>
      <div className="space-y-2 pt-4">
        <Label htmlFor="coupon">Coupon Code</Label>
        <div className="flex space-x-2">
          <Input 
            id="coupon" 
            placeholder="Enter coupon" 
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            disabled={couponDiscount > 0}
            maxLength={20}
          />
          {couponDiscount > 0 ? (
            <Button type="button" variant="destructive" onClick={handleRemoveCoupon}>
                <X className="mr-2 h-4 w-4" /> Remove
            </Button>
          ) : (
            <Button type="button" onClick={handleApplyCoupon} disabled={!couponCode}>
                <Tag className="mr-2 h-4 w-4" /> Apply
            </Button>
          )}
        </div>
      </div>
       <div className="text-xs text-muted-foreground pt-3 border-t">
        <p>Estimated Delivery: 7-15 days, depending on quantity.</p>
        {supportPhoneNumber && <p>For details, call <a href={`tel:${supportPhoneNumber}`} className="font-semibold text-primary">{supportPhoneNumber}</a>.</p>}
      </div>
    </div>
  );
};


const WhatsAppCheckoutModal = ({ isOpen, onOpenChange, checkoutInput, checkoutMode }: WhatsAppCheckoutModalProps) => {
  const [step, setStep] = useState<'form' | 'loading' | 'confirmation'>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);
  const imageUploader = useMemo(() => ImageUploadHandler({ onImagesChange: setSelectedUploadFiles, maxImages: 3 }), []);

  const baseTotal = useMemo(() => checkoutInput?.totalCost || 0, [checkoutInput?.totalCost]);
  const finalTotal = useMemo(() => {
    const total = baseTotal - couponDiscount;
    return total < 0 ? 0 : total;
  }, [baseTotal, couponDiscount]);

   const advanceAmount = useMemo(() => {
    const amount = checkoutMode === 'payment' ? finalTotal * 0.05 : 0;
    return Math.max(1, parseFloat(amount.toFixed(2))); // Ensure minimum is 1
  }, [finalTotal, checkoutMode]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep('form');
        setCustomerName('');
        setCustomerPhoneNumber('');
        setCustomerAddress('');
        setPincode('');
        setExtraNote('');
        setCouponCode('');
        setCouponDiscount(0);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/coupons', { cache: 'no-store' });
        const data = await res.json();
        if (res.ok && Array.isArray(data.coupons)) {
          setAvailableCoupons(data.coupons.filter((c: Coupon) => c.active));
        }
      } catch {}
    })();
  }, []);

  const handleApplyCoupon = useCallback(() => {
    const code = couponCode.trim().toUpperCase();
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === code && c.active);
    if (!coupon) {
      toast({
        variant: "destructive",
        title: "Invalid Coupon",
        description: "The coupon code you entered is not valid.",
      });
      return;
    }
    const subtotal = checkoutInput?.productPrice || 0;
    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = subtotal * (coupon.value / 100);
    } else {
      discountAmount = coupon.value;
    }
    discountAmount = Math.min(discountAmount, subtotal);
    setCouponDiscount(discountAmount);
    
    confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        zIndex: 10000,
        colors: ['#ffd700', '#ffeb3b', '#fff59d']
    });

    toast({
      title: "Coupon Applied!",
      description: coupon.type === 'percent' ? `You've received ${coupon.value}% off!` : `You've received ₹${coupon.value.toFixed(2)} off!`,
    });
  }, [couponCode, checkoutInput, availableCoupons, toast]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponDiscount(0);
    setCouponCode('');
    toast({
        title: "Coupon Removed",
        description: "The coupon has been removed from your order."
    })
  }, [toast]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutInput) return;

    setStep('loading');
    
    const fullAddress = `${customerAddress}, ${pincode}`;
    
    const orderDetails = {
        sku: checkoutInput.sku,
        productName: checkoutInput.productName,
        totalCost: finalTotal,
        customerName,
        customerPhoneNumber: `91${customerPhoneNumber}`,
        customerAddress: fullAddress,
        extraNote,
        quantity: checkoutInput.quantity,
        advanceAmount,
        items: checkoutInput.products || [],
    };
    
    try {
      if (checkoutMode === 'payment') {
        const paymentInput = { 
          ...orderDetails,
          subtotal: checkoutInput.productPrice,
          shippingCost: checkoutInput.shippingCost,
          productUrls: checkoutInput.productUrls || [],
          productDescription: checkoutInput.productDescription,
          originalPrice: checkoutInput.originalPrice,
          productPrice: checkoutInput.productPrice,
          couponDiscount,
        };
        const res = await createPaymentLink(paymentInput);
        
        // Store order details locally for the confirmation page
        try {
          localStorage.setItem(`order_${res.orderId}`, JSON.stringify({ ...orderDetails, orderId: res.orderId, amount: advanceAmount }));
        } catch {}

        // Upload any selected images to the first matching order_item
        try {
          if (selectedUploadFiles.length > 0 && Array.isArray(res.order_items) && res.order_items.length > 0) {
            const uploadableIds = checkoutInput.uploadProductIds || [];
            const targetItem = res.order_items.find((it: any) => uploadableIds.includes(it.product_id));
            if (targetItem) {
              const urls = await imageUploader.uploadImages(targetItem.id);
              if (urls && urls.length > 0) {
                try {
                  localStorage.setItem(`order_uploads_${res.orderId}`, JSON.stringify(urls));
                } catch {}
              }
            }
          }
        } catch {}
        
        const composeReturnUrl = (orderIdParam: string) => {
          return `${window.location.origin}/order-confirmation?order_id=${orderIdParam}`;
        };

        const getPaymentsUrl = async (orderIdParam: string) => {
          try {
            const sres = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderIdParam)}`, { cache: 'no-store' });
            const sdata = await sres.json();
            if (sres.ok) {
              return sdata.payments?.url || sdata.payments_url || null;
            }
          } catch {}
          return null;
        };

        // Use Cashfree SDK for payment
        if ((window as any).Cashfree) {
            const cfModeEnv = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX').toUpperCase();
            const cashfree = (window as any).Cashfree({
                mode: cfModeEnv === 'PRODUCTION' ? 'production' : 'sandbox'
            });

            cashfree.checkout({
                paymentSessionId: res.payment_session_id,
                returnUrl: `${window.location.origin}/order-confirmation?order_id={order_id}`
            })
            .catch(async (err: any) => {
              console.error('Cashfree SDK checkout failed:', err);
              const returnUrl = composeReturnUrl(res.orderId);
              let hostedUrl = res.payment_url;
              if (!hostedUrl) hostedUrl = await getPaymentsUrl(res.orderId);
              if (hostedUrl) {
                const joiner = hostedUrl.includes('?') ? '&' : '?';
                const redirectUrl = `${hostedUrl}${joiner}return_url=${encodeURIComponent(returnUrl)}`;
                window.location.href = redirectUrl;
              } else {
                toast({
                  variant: "destructive",
                  title: "Payment Failed",
                  description: "Could not start checkout. Please try again.",
                });
                setStep('form');
              }
            });
            
            // Safety net: if still loading after 8s, fallback to hosted redirect
            setTimeout(async () => {
              if (document.hidden) return; // avoid double redirect if user switched tabs
              if (typeof window !== 'undefined') {
                const returnUrl = composeReturnUrl(res.orderId);
                let hostedUrl = res.payment_url;
                if (!hostedUrl) hostedUrl = await getPaymentsUrl(res.orderId);
                if (hostedUrl) {
                  const joiner = hostedUrl.includes('?') ? '&' : '?';
                  const redirectUrl = `${hostedUrl}${joiner}return_url=${encodeURIComponent(returnUrl)}`;
                  window.location.href = redirectUrl;
                }
              }
            }, 8000);
        } else {
             // Fallback for redirect if SDK fails
            const returnUrl = composeReturnUrl(res.orderId);
            let hostedUrl = res.payment_url;
            if (!hostedUrl) hostedUrl = await getPaymentsUrl(res.orderId);
            if (hostedUrl) {
              const joiner = hostedUrl.includes('?') ? '&' : '?';
              const redirectUrl = `${hostedUrl}${joiner}return_url=${encodeURIComponent(returnUrl)}`;
              window.location.href = redirectUrl;
            } else {
              toast({
                variant: "destructive",
                title: "Payment Failed",
                description: "Could not start checkout. Please try again.",
              });
              setStep('form');
            }
        }

      } else {
        await generateWhatsAppCheckoutMessage({
          productName: checkoutInput.productName,
          sku: checkoutInput.sku,
          productDescription: checkoutInput.productDescription,
          originalPrice: checkoutInput.originalPrice,
          productPrice: checkoutInput.productPrice,
          discountPercentage: 0,
          shippingCost: checkoutInput.shippingCost,
          totalCost: finalTotal,
          quantity: checkoutInput.quantity,
          customerName,
          customerPhoneNumber: `91${customerPhoneNumber}`,
          customerAddress: fullAddress,
          extraNote,
          productUrls: checkoutInput.productUrls || [],
        });
        audioRef.current?.play();
        confetti({
            particleCount: 150,
            spread: 70,
            origin: { y: 0.6 },
            zIndex: 10000,
        });
        setStep('confirmation');
      }

    } catch (error: any) {
      console.error('Order submission failed:', error);
      toast({
        variant: "destructive",
        title: "Order Failed",
        description: error.message || "Something went wrong. Please try again.",
      });
      setStep('form');
    }
  };

  const handleClose = (open: boolean) => {
    onOpenChange(open);
  };
  
  const renderContent = () => {
    switch (step) {
      case 'form':
        return (
          <form onSubmit={handleOrderSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6">
                <div className="mb-4 md:mb-0">
                    <OrderSummary 
                      checkoutInput={checkoutInput}
                      couponCode={couponCode}
                      setCouponCode={setCouponCode}
                      handleApplyCoupon={handleApplyCoupon}
                      handleRemoveCoupon={handleRemoveCoupon}
                      couponDiscount={couponDiscount}
                      finalTotal={finalTotal}
                      advanceAmount={advanceAmount}
                      mode={checkoutMode}
                    />
                    {checkoutMode === 'payment' && checkoutInput && (checkoutInput.uploadProductIds || []).length > 0 && (
                      <div className="mt-4">
                        {imageUploader.render}
                      </div>
                    )}
                </div>
                <div className="grid gap-4 py-4 md:py-0">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="e.g. Priya Sharma"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">WhatsApp Number</Label>
                    <div className="flex items-center">
                        <span className="inline-flex self-stretch items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm">+91</span>
                        <Input
                        id="phone"
                        type="tel"
                        value={customerPhoneNumber}
                        onChange={(e) => {
                            const numericValue = e.target.value.replace(/[^0-9]/g, '');
                            if (numericValue.length <= 10) {
                            setCustomerPhoneNumber(numericValue);
                            }
                        }}
                        placeholder="e.g. 9876543210"
                        required
                        pattern="[0-9]{10}"
                        title="Please enter a 10-digit phone number"
                        className="rounded-l-none"
                        />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Shipping Address</Label>
                    <Textarea
                      id="address"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="e.g. 123, Rose Villa, MG Road..."
                      required
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      type="text"
                      value={pincode}
                      onChange={(e) => {
                        const numericValue = e.target.value.replace(/[^0-9]/g, '');
                        if (numericValue.length <= 6) {
                          setPincode(numericValue);
                        }
                      }}
                      placeholder="e.g. 400001"
                      required
                      pattern="[0-9]{6}"
                      title="Please enter a 6-digit pincode"
                    />
                  </div>
                   <div className="space-y-2">
                    <Label htmlFor="extra-note">Extra Note (Optional)</Label>
                    <Textarea
                      id="extra-note"
                      value={extraNote}
                      onChange={(e) => setExtraNote(e.target.value)}
                      placeholder="e.g. Leave package at the front door."
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
            </div>
            <DialogFooter className="mt-6">
               {checkoutMode === 'payment' ? (
                 <Button type="submit" className="w-full">
                    <FileText className="mr-2 h-4 w-4" />
                    Proceed to Pay ₹{advanceAmount.toFixed(2)}
                 </Button>
               ) : (
                 <Button type="submit" className="w-full">
                    <Zap className="mr-2 h-4 w-4" />
                    Confirm Order
                 </Button>
               )}
            </DialogFooter>
          </form>
        );
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center p-8 min-h-[300px]">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-lg">Processing your order...</p>
          </div>
        );
      case 'confirmation': // This case is now only for non-payment flows
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
                <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                <h3 className="text-2xl font-bold font-headline mb-2">Order Placed Successfully!</h3>
                <p className="text-muted-foreground mb-6">
                    Thank you for your purchase. You will receive a confirmation on WhatsApp shortly.
                </p>
                <Button onClick={() => onOpenChange(false)} asChild>
                   <Link href="/">Continue Shopping</Link>
                </Button>
            </div>
        );
    }
  };

  const getTitle = () => {
    if (step === 'confirmation') return 'Order Confirmed!';
    return checkoutMode === 'payment' ? 'Pay an Advance' : 'Confirm Order via WhatsApp';
  }
  
  const getDescription = () => {
    if (step === 'loading') return 'Please wait while we process your request.';
    if (step === 'confirmation') return 'Thank you for your order!';
    if (checkoutMode === 'payment') return 'Confirm your bulk order by paying a 5% advance. The remaining balance will be settled before dispatch.';
    return 'Enter your details to confirm your order. You will receive a confirmation message on WhatsApp.';
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle className='font-headline'>{getTitle()}</DialogTitle>
          <DialogDescription>{getDescription()}</DialogDescription>
        </DialogHeader>
        {renderContent()}
        <audio ref={audioRef} src="https://cdn.freesound.org/previews/270/270319_5122242-lq.mp3" preload="auto" />
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppCheckoutModal;
