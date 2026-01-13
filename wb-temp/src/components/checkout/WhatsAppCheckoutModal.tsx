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
import { Loader2, CheckCircle, Tag, X, FileText, Zap } from 'lucide-react';
import { generateWhatsAppCheckoutMessage, WhatsAppCheckoutInput } from '@/ai/flows/whatsapp-checkout-message';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import type { Coupon, OrderItem, SiteSettings } from '@/lib/types';
import { supabase } from '@/lib/supabase-client';

// Helper: Convert File to Base64 for local storage
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

// Load Cashfree SDK dynamically
const loadCashfreeSDK = () => {
  if (document.getElementById('cashfree-sdk')) return;
  const script = document.createElement('script');
  script.id = 'cashfree-sdk';
  script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
  document.head.appendChild(script);
};

interface WhatsAppCheckoutModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  checkoutInput: Omit<WhatsAppCheckoutInput, 'customerName' | 'customerPhoneNumber' | 'customerAddress' | 'extraNote'> & { sku?: string, products?: OrderItem[], customImageFiles?: File[] } | null;
  checkoutMode: 'whatsapp' | 'payment';
}

const OrderSummary = ({ checkoutInput, couponCode, setCouponCode, handleApplyCoupon, handleRemoveCoupon, couponDiscount, finalTotal, advanceAmount, mode }: any) => {
  if (!checkoutInput) return null;
  const supportPhoneNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER;
  const customImages = checkoutInput.customImageFiles || [];

  return (
    <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
      <h4 className="font-semibold text-lg">Order Summary</h4>
      {customImages.length > 0 && (
        <div>
          <h5 className="text-sm font-semibold mb-2">Your Custom Images:</h5>
          <div className="flex gap-2">{customImages.map((file: File, i: number) => <Image key={i} src={URL.createObjectURL(file)} alt={`Custom upload ${i+1}`} width={64} height={64} className="rounded-md object-cover"/>)}</div>
        </div>
      )}
      <p className="font-semibold">{checkoutInput.productName}</p>
      <div className="text-sm space-y-1 text-muted-foreground">
        <div className="flex justify-between"><span>Subtotal:</span> <span>₹{checkoutInput.productPrice.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>Shipping:</span> <span>{checkoutInput.shippingCost > 0 ? `₹${checkoutInput.shippingCost.toFixed(2)}` : 'Free'}</span></div>
        {couponDiscount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount:</span> <span>-₹{couponDiscount.toFixed(2)}</span></div>}
        <div className="flex justify-between font-bold text-foreground pt-2 border-t"><span>Total:</span> <span>₹{finalTotal.toFixed(2)}</span></div>
        {mode === 'payment' && <div className="flex justify-between font-bold text-primary pt-2 border-t"><span>Advance Payable (5%):</span> <span>₹{advanceAmount.toFixed(2)}</span></div>}
      </div>
      <div className="space-y-2 pt-4">
        <Label htmlFor="coupon">Coupon Code</Label>
        <div className="flex space-x-2">
          <Input id="coupon" placeholder="Enter coupon" value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())} disabled={couponDiscount > 0} maxLength={20} />
          {couponDiscount > 0 ? <Button type="button" variant="destructive" onClick={handleRemoveCoupon}><X className="mr-2 h-4 w-4" /> Remove</Button> : <Button type="button" onClick={handleApplyCoupon} disabled={!couponCode}><Tag className="mr-2 h-4 w-4" /> Apply</Button>}
        </div>
      </div>
      <div className="text-xs text-muted-foreground pt-3 border-t">
        <p>Estimated Delivery: 7-15 days. For details, call <a href={`tel:${supportPhoneNumber}`} className="font-semibold text-primary">{supportPhoneNumber}</a>.</p>
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
  const [customerEmail, setCustomerEmail] = useState(''); // ✅ Added Email Field
  const [extraNote, setExtraNote] = useState('');
  const [couponCode, setCouponCode] = useState('');
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<Coupon[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const { toast } = useToast();
  const audioRef = useRef<HTMLAudioElement>(null);

  const subtotal = useMemo(() => checkoutInput?.productPrice || 0, [checkoutInput?.productPrice]);
  const shippingCost = useMemo(() => checkoutInput?.shippingCost || 0, [checkoutInput?.shippingCost]);
  const finalTotal = useMemo(() => Math.max(0, subtotal - couponDiscount) + shippingCost, [subtotal, couponDiscount, shippingCost]);
  const advanceAmount = useMemo(() => Math.max(1, parseFloat((finalTotal * 0.05).toFixed(2))), [finalTotal]);

  useEffect(() => { loadCashfreeSDK(); }, []);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setStep('form');
        [setCustomerName, setCustomerPhoneNumber, setCustomerAddress, setPincode, setCustomerEmail, setExtraNote, setCouponCode].forEach(f => f(''));
        setCouponDiscount(0);
      }, 300);
    }
  }, [isOpen]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/coupons', { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setAvailableCoupons(data.coupons.filter((c: Coupon) => c.active));
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        if (res.ok) {
          const data: SiteSettings = await res.json();
          setSettings(data);
        }
      } catch {}
    })();
  }, []);

  const effectiveMode: 'whatsapp' | 'payment' = settings?.whatsapp_only_checkout_enabled ? 'whatsapp' : checkoutMode;

  const buildPrefilledWhatsAppMessage = (): string => {
    if (!checkoutInput) return '';
    const parts: string[] = [];
    const tpl = (settings?.whatsapp_message_template || '').trim();
    if (tpl) parts.push(tpl);
    parts.push(
      `Name: ${customerName}`,
      `Phone: +91${customerPhoneNumber}`,
      `Address: ${customerAddress}${pincode ? `, ${pincode}` : ''}`
    );
    const products = checkoutInput.products && checkoutInput.products.length > 0
      ? checkoutInput.products.map(p => `• ${p.name} x ${p.quantity} @ ₹${p.price.toFixed(2)}`).join('\n')
      : `${checkoutInput.productName} x ${checkoutInput.quantity}`;
    parts.push('Items:', products);
    parts.push(
      `Subtotal: ₹${subtotal.toFixed(2)}`,
      `Shipping: ₹${shippingCost.toFixed(2)}`,
      `Total: ₹${finalTotal.toFixed(2)}`
    );
    if (couponDiscount > 0) parts.push(`Coupon: ${couponCode} (-₹${couponDiscount.toFixed(2)})`);
    if (extraNote.trim()) parts.push(`Note: ${extraNote.trim()}`);
    if (checkoutInput.productUrls && checkoutInput.productUrls.length > 0) {
      parts.push('Links:', checkoutInput.productUrls.join('\n'));
    }
    return parts.join('\n');
  };

  const handleApplyCoupon = useCallback(() => {
    const coupon = availableCoupons.find(c => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.active);
    if (!coupon) { return toast({ variant: "destructive", title: "Invalid Coupon" }); }
    
    const discount = coupon.type === 'percent' ? subtotal * (coupon.value / 100) : coupon.value;
    setCouponDiscount(Math.min(discount, subtotal));
    
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
    toast({ title: "Coupon Applied!" });
  }, [couponCode, subtotal, availableCoupons, toast]);

  const handleRemoveCoupon = useCallback(() => {
    setCouponDiscount(0);
    setCouponCode('');
    toast({ title: "Coupon Removed" });
  }, [toast]);

  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutInput) return;

    setStep('loading');

    const returnUrlBase = (process.env.NODE_ENV === 'production' || process.env.NEXT_PUBLIC_VERCEL_ENV === 'production')
        ? 'https://business.woody.co.in'
        : window.location.origin;

    // ✅ Dynamic email: if empty, default to phone@woody.co.in
    const emailToSend = customerEmail.trim() || `${customerPhoneNumber}@woody.co.in`;

    const payload = {
        subtotal,
        shippingCost,
        totalCost: finalTotal,
        advanceAmount,
        customerName,
        customerPhone: `91${customerPhoneNumber}`,
        customerAddress,
        pincode,
        customerEmail: emailToSend, // ✅ send email to Edge Function
        items: checkoutInput.products || [],
        customImageUrls: [],
        couponCode: couponDiscount > 0 ? couponCode : undefined,
        couponDiscount,
        returnUrl: `${returnUrlBase}/order-confirmation`
    };

    try {
      if (effectiveMode === 'payment') {
          const { data, error } = await supabase.functions.invoke('create-cashfree-order', { body: payload });

          if (error) throw new Error(error.message || "Function invocation failed.");
          if (!data.payment_session_id || !data.order_id) throw new Error('Could not create a payment session.');

          // Save images to localStorage and attempt background upload immediately
          if (checkoutInput.customImageFiles?.length) {
              const base64Files = await Promise.all(checkoutInput.customImageFiles.map(fileToBase64));
              localStorage.setItem(`images_for_${data.order_id}`, JSON.stringify(base64Files));
              try {
                // Fire-and-forget upload so images attach even if payment flow is interrupted
                supabase.functions
                  .invoke('upload-images', { body: { orderId: data.order_id, base64Files } })
                  .then((res: any) => {
                    const { error } = res || {};
                    if (!error) localStorage.removeItem(`images_for_${data.order_id}`);
                  })
                  .catch(() => {});
              } catch {}
          }

          localStorage.setItem(`order_${data.order_id}`, JSON.stringify({ ...payload, orderId: data.order_id }));

          if ((window as any).Cashfree) {
            const cashfreeEnv = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX').toLowerCase();
            const cashfree = (window as any).Cashfree({ mode: cashfreeEnv });
            cashfree.checkout({
              paymentSessionId: data.payment_session_id,
              returnUrl: `${returnUrlBase}/order-confirmation?order_id={order_id}`,
            }).catch((err: any) => {
              console.error('Cashfree SDK checkout failed:', err);
              toast({
                variant: "destructive",
                title: "Payment Error",
                description: "Could not open the payment gateway. Please try again.",
              });
              setStep('form');
            });
          } else throw new Error("Payment gateway (Cashfree SDK) is not available.");

      } else {
          // WhatsApp-only flow
          const fullAddress = `${customerAddress}, ${pincode}`;
          const businessNumber = (settings?.whatsapp_business_number || '').replace(/[^0-9]/g, '');
          if (settings?.whatsapp_only_checkout_enabled && businessNumber) {
            const message = buildPrefilledWhatsAppMessage();
            const encoded = encodeURIComponent(message);
            const waUrl = `https://wa.me/${businessNumber}?text=${encoded}`;
            window.open(waUrl, '_blank');
          } else {
            await generateWhatsAppCheckoutMessage({
                ...checkoutInput,
                productName: checkoutInput.productName,
                totalCost: finalTotal,
                customerName,
                customerPhoneNumber: `91${customerPhoneNumber}`,
                customerAddress: fullAddress,
                customImageUrls: [],
            });
          }
          audioRef.current?.play();
          confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
          setStep('confirmation');
      }
    } catch (error: any) {
      console.error('Order submission failed:', error);
      toast({ variant: "destructive", title: "Order Failed", description: error.message || 'An unknown error occurred.' });
      setStep('form');
    }
  };

  const renderContent = () => {
    if (step === 'loading') return <div className="flex flex-col items-center justify-center p-8 min-h-[300px]"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="mt-4 text-lg">Processing your order...</p></div>;
    if (step === 'confirmation') return <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]"><CheckCircle className="h-16 w-16 text-green-500 mb-4" /><h3 className="text-2xl font-bold">Order Placed!</h3><p className="text-muted-foreground mb-6">You will receive a confirmation on WhatsApp.</p><Button onClick={() => onOpenChange(false)} asChild><Link href="/">Continue Shopping</Link></Button></div>;

    return (
      <form onSubmit={handleOrderSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 md:gap-6">
          <div className="mb-4 md:mb-0"><OrderSummary {...{ checkoutInput, couponCode, setCouponCode, handleApplyCoupon, handleRemoveCoupon, couponDiscount, finalTotal, advanceAmount, mode: checkoutMode }} /></div>
          <div className="grid gap-4 py-4 md:py-0">
            <div className="space-y-2"><Label htmlFor="name">Full Name</Label><Input id="name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Priya Sharma" required autoComplete="name" /></div>
            <div className="space-y-2">
              <Label htmlFor="phone">WhatsApp Number</Label>
              <div className="flex items-center"><span className="inline-flex self-stretch items-center px-3 rounded-l-md border border-r-0 bg-muted text-sm">+91</span><Input id="phone" type="tel" value={customerPhoneNumber} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); if (v.length <= 10) setCustomerPhoneNumber(v); }} placeholder="e.g. 9876543210" required pattern="[0-9]{10}" className="rounded-l-none" autoComplete="tel" /></div>
            </div>

            {/* ✅ NEW EMAIL FIELD */}
            <div className="space-y-2">
              <Label htmlFor="email">Email (Optional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="e.g. priya@example.com"
                value={customerEmail}
                onChange={(e) => setCustomerEmail(e.target.value)}
                autoComplete="email"
              />
              <p className="text-xs text-muted-foreground">If left empty, we'll use your WhatsApp number as email (@woody.co.in).</p>
            </div>

            <div className="space-y-2"><Label htmlFor="address">Shipping Address</Label><Textarea id="address" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} placeholder="e.g. 123, Rose Villa, MG Road..." required className="min-h-[60px]" autoComplete="street-address" /></div>
            <div className="space-y-2"><Label htmlFor="pincode">Pincode</Label><Input id="pincode" type="text" value={pincode} onChange={(e) => { const v = e.target.value.replace(/[^0-9]/g, ''); if (v.length <= 6) setPincode(v); }} placeholder="e.g. 400001" required pattern="[0-9]{6}" autoComplete="postal-code" /></div>
            <div className="space-y-2"><Label htmlFor="extra-note">Extra Note (Optional)</Label><Textarea id="extra-note" value={extraNote} onChange={(e) => setExtraNote(e.target.value)} placeholder="e.g. Leave package at the front door." className="min-h-[60px]" /></div>
          </div>
        </div>
        <DialogFooter className="mt-6">
          {effectiveMode === 'payment' ? <Button type="submit" className="w-full"><FileText className="mr-2 h-4 w-4" /> Proceed to Pay ₹{advanceAmount.toFixed(2)}</Button> : <Button type="submit" className="w-full"><Zap className="mr-2 h-4 w-4" /> Confirm on WhatsApp</Button>}
        </DialogFooter>
      </form>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-3xl max-h-[90vh] overflow-y-auto rounded-lg">
        <DialogHeader>
          <DialogTitle>{step === 'confirmation' ? 'Order Confirmed!' : (effectiveMode === 'payment' ? 'Pay an Advance' : 'Confirm Order via WhatsApp')}</DialogTitle>
          <DialogDescription>{step === 'loading' ? 'Please wait...' : (effectiveMode === 'payment' ? 'Confirm your order by paying a 5% advance.' : 'Enter details to confirm your order on WhatsApp.')}</DialogDescription>
        </DialogHeader>
        {renderContent()}
        <audio ref={audioRef} src="https://cdn.freesound.org/previews/270/270319_5122242-lq.mp3" preload="auto" />
      </DialogContent>
    </Dialog>
  );
};

export default WhatsAppCheckoutModal;
