
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
import { Loader2, CheckCircle, Tag, X, FileText, Zap, Phone, Truck, Info, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { createPaymentLink } from '@/lib/payment';
import Link from 'next/link';
import type { OrderItem, Product, SiteSettings } from "@/lib/types";
import { BLUR_DATA_URL } from '@/lib/constants';

// Define type locally since we removed the import
interface WhatsAppCheckoutInput {
  productName: string;
  sku?: string;
  productDescription?: string;
  originalPrice?: number;
  productPrice: number;
  shippingCost: number;
  totalCost: number;
  quantity: number;
  productUrls?: string[];
  products?: OrderItem[];
  discountPercentage?: number;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutInput: Omit<WhatsAppCheckoutInput, 'customerName' | 'customerPhoneNumber' | 'customerAddress' | 'extraNote'> & { productImages?: string[]; sku?: string, products?: OrderItem[], uploadProductIds?: string[]; discountPercentage?: number } | null;
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
  advancePercent,
  mode,
}: {
  checkoutInput: CheckoutModalProps['checkoutInput'];
  couponCode: string;
  setCouponCode: (value: string) => void;
  handleApplyCoupon: () => void;
  handleRemoveCoupon: () => void;
  couponDiscount: number;
  finalTotal: number;
  advanceAmount: number;
  advancePercent: number;
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
        
        <div className="flex justify-between font-bold text-foreground pt-2 border-t"><span>Total <span className="text-sm font-normal text-muted-foreground">(incl. GST)</span>:</span> <span>₹{finalTotal.toFixed(2)}</span></div>

         {mode === 'payment' && (
          <div className="flex justify-between font-bold text-primary pt-2 border-t">
            <span>Amount Payable (Full):</span>
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
       <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 mt-3">
          <Truck className="h-6 w-6" />
          <div>
              <p className="font-semibold text-sm">Estimated Delivery: 7-15 days</p>
              {supportPhoneNumber && <p className="text-xs">For details, call <a href={`tel:${supportPhoneNumber}`} className="font-bold">{supportPhoneNumber}</a>.</p>}
          </div>
      </div>
      <div className="text-center text-[11px] text-muted-foreground pt-2 space-x-3">
        <Link href="/pricing" target="_blank" className="hover:underline">Pricing Policy</Link>
        <Link href="/shipping" target="_blank" className="hover:underline">Shipping</Link>
        <Link href="/returns-and-refunds" target="_blank" className="hover:underline">Returns & Refunds</Link>
      </div>
    </div>
  );
};


const CheckoutModal = ({ isOpen, onOpenChange, checkoutInput, checkoutMode }: CheckoutModalProps) => {
  const [step, setStep] = useState<'form' | 'loading' | 'confirmation'>('form');
  const [customerName, setCustomerName] = useState('');
  const [customerPhoneNumber, setCustomerPhoneNumber] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [extraNote, setExtraNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [siteSettings, setSiteSettings] = useState<Partial<SiteSettings>>({});
  
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  const baseTotal = checkoutInput?.totalCost ?? 0;
  const finalTotal = useMemo(() => {
    const total = baseTotal - couponDiscount;
    return total < 0 ? 0 : total;
  }, [baseTotal, couponDiscount]);

  const advancePercent = 0;

  const advanceAmount = useMemo(() => {
    const amount = checkoutMode === 'payment' ? finalTotal : 0;
    return Math.max(1, parseFloat(amount.toFixed(2)));
  }, [finalTotal, checkoutMode]);

  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setStep('form');
        setCustomerName('');
        setCustomerPhoneNumber('');
        setCustomerAddress('');
        setPincode('');
        setCustomerEmail('');
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
        const res = await fetch('/api/site-settings');
        if (!res.ok) return;
        const data = await res.json();
        if (data) setSiteSettings(data as SiteSettings);
      } catch {}
    })();
  }, []);

  const handleApplyCoupon = useCallback(async () => {
    const code = couponCode.trim().toUpperCase();
    if (!code) {
      toast({
        variant: "destructive",
        title: "Invalid Coupon",
        description: "Please enter a valid coupon code.",
      });
      return;
    }
    try {
      // Use Supabase Edge Function instead of local API
      const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/coupons-admin`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'validate',
          code: code,
          subtotal: checkoutInput?.productPrice || 0 
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data?.error) {
        toast({
          variant: "destructive",
          title: "Invalid Coupon",
          description: data?.error || "The coupon code you entered is not valid.",
        });
        return;
      }
      const discountAmount = Number(data.discountAmount || 0);
      if (!Number.isFinite(discountAmount) || discountAmount <= 0) {
        toast({
          variant: "destructive",
          title: "Invalid Coupon",
          description: "The coupon could not be applied.",
        });
        return;
      }
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
        description: data.message || `You've received a discount of ₹${discountAmount.toFixed(2)}!`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Invalid Coupon",
        description: error?.message || "Failed to validate coupon. Please try again.",
      });
    }
  }, [couponCode, checkoutInput, toast]);

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
    
    const email = customerEmail || `${customerPhoneNumber}@nemaone.com`;

    const orderDetails = {
        sku: checkoutInput.sku,
        productName: checkoutInput.productName,
        totalCost: finalTotal,
        customerName,
        customerEmail: email,
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
        
        try {
          localStorage.setItem(`order_${res.orderId}`, JSON.stringify({ ...orderDetails, orderId: res.orderId, amount: advanceAmount }));
        } catch {}
        
        const origin = (process.env.NEXT_PUBLIC_BASE_URL || '').trim() || (typeof window !== 'undefined' ? window.location.origin : '');
        const composeReturnUrl = (orderIdParam: string) => {
          return `${origin}/order-confirmation?order_id=${orderIdParam}`;
        };

        const getPaymentsUrl = async (orderIdParam: string) => {
          try {
            const resStatus = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderIdParam)}`);
            if (!resStatus.ok) return null;
            const sdata = await resStatus.json();
            return (sdata as any)?.payments?.url || (sdata as any)?.payments_url || null;
          } catch {}
          return null;
        };

        if ((window as any).Cashfree) {
            const cfModeEnv = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX').toUpperCase();
            const cashfree = (window as any).Cashfree({
                mode: cfModeEnv === 'PRODUCTION' ? 'production' : 'sandbox'
            });

            cashfree.checkout({
                paymentSessionId: res.payment_session_id,
                returnUrl: `${origin}/order-confirmation?order_id={order_id}`
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
            
            setTimeout(async () => {
              if (document.hidden) return;
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
        // For WhatsApp checkout, create order without payment
        const orderInput = {
          orderId: `WA-${Date.now()}`,
          amount: 0, // No payment for WhatsApp orders
          customerName,
          customerPhone: `91${customerPhoneNumber}`,
          customerEmail: email,
          returnUrl: `${typeof window !== 'undefined' ? window.location.origin : ''}/order-confirmation`,
          items: checkoutInput.products || [],
        };
        
        await fetch('/api/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            external_order_id: orderInput.orderId,
            customer_name: orderInput.customerName,
            customer_phone: orderInput.customerPhone,
            customer_email: orderInput.customerEmail,
            status: 'PENDING',
            total_amount: 0,
          }),
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
                      advancePercent={advancePercent}
                      mode={checkoutMode}
                    />
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
                    <Label htmlFor="email">Email Address (Optional)</Label>
                    <Input
                      id="email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="e.g., priya@example.com"
                    />
                    <p className="text-xs text-muted-foreground">If left blank, an email like '1234567890@nemaone.com' will be used.</p>
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
                 <Button type="submit" className="w-full bg-gradient-to-r from-green-700 to-green-900 hover:from-green-800 hover:to-green-900 text-white">
                    <FileText className="mr-2 h-4 w-4" />
                    Proceed to Pay ₹{advanceAmount.toFixed(2)}
                 </Button>
               ) : (
                 <Button type="submit" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    Confirm on WhatsApp
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
      case 'confirmation':
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
    return checkoutMode === 'payment' ? 'Pay at Checkout' : 'Confirm Order via WhatsApp';
  }
  
  const getDescription = () => {
    if (step === 'loading') return 'Please wait while we process your request.';
    if (step === 'confirmation') return 'Thank you for your order!';
    if (checkoutMode === 'payment') return advancePercent > 0 ? `Confirm your order by paying a ${advancePercent}% advance. The remaining balance will be settled before dispatch.` : 'Confirm your order by paying the full amount at checkout.';
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

export default CheckoutModal;

    
