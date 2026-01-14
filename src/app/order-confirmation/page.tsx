
'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, Download, ArrowLeft, CalendarClock, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import useCart from '@/hooks/use-cart';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { getSiteSettings } from '@/lib/data-async';
import type { SiteSettings } from '@/lib/types';

type OrderData = {
  sku?: string;
  orderId: string;
  customerName: string;
  customerPhoneNumber: string;
  customerAddress: string;
  productName: string;
  quantity: number;
  totalCost: number;
  advanceAmount: number;
};

const OrderConfirmationContent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { clearCart } = useCart();
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'failed'>('loading');
  
  const hasFired = useRef(false);
  const hasFiredConfetti = useRef(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  const fetchOrderDetailsFromServer = async (orderId: string): Promise<OrderData | null> => {
      try {
        const res = await fetch(`/api/orders/by-external/${orderId}`);
        if (!res.ok) return null;
        const serverOrder = await res.json();
        
        if (serverOrder) {
          return {
            orderId: serverOrder.external_order_id,
            customerName: serverOrder.customer_name,
            customerPhoneNumber: serverOrder.customer_phone,
            customerAddress: serverOrder.shipping_address || 'Address not available',
            productName: serverOrder.order_items?.[0]?.product_name || 'Product',
            quantity: serverOrder.order_items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 1,
            totalCost: serverOrder.total_amount,
            advanceAmount: serverOrder.total_amount,
          };
        }
      } catch (e) {
        console.error("Failed to fetch order details from server", e);
      }
      return null;
  }

  const fetchAndProcessOrder = useCallback(async (orderId: string) => {
    let localData: OrderData | null = null;
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`order_${orderId}`) : null;
      if (stored) {
        localData = JSON.parse(stored);
      } else {
        localData = await fetchOrderDetailsFromServer(orderId);
      }
      
      if (localData) {
        setOrderData(localData);
      } else {
         throw new Error(`No details found for order ${orderId}`);
      }

      const res = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
      const statusData = await res.json();
      if (!res.ok) throw new Error(statusData.error || 'Status fetch failed');
      
      const orderStatus = (statusData.order_status || '').toUpperCase();
      const orderAmount = Number(statusData.order_amount || 0);

      if (orderStatus === 'PAID' || orderStatus === 'SUCCESS' || orderStatus === 'COMPLETED') {
        setStatus('success');
        clearCart();
        audioRef.current?.play().catch(e => console.warn("Audio autoplay blocked by browser."));
        if (!hasFiredConfetti.current) {
            hasFiredConfetti.current = true;
            confetti({ particleCount: 200, spread: 90, origin: { y: 0.6 }, zIndex: 10000 });
        }

        const toPhone = (localData.customerPhoneNumber || '').replace(/\D/g, '');
        if (toPhone && !hasFired.current) {
            hasFired.current = true;
            await fetch('/api/whatsapp/send-template', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: toPhone,
                bodyParameters: [
                  localData.customerName,
                  orderId,
                  localData.productName,
                  `${localData.quantity}x`,
                  localData.customerAddress,
                  `₹${(localData.totalCost || orderAmount).toFixed(2)}`,
                ],
              }),
            });
        }
      } else if (orderStatus === 'FAILED' || orderStatus === 'CANCELLED') {
        setStatus('failed');
        toast({
          variant: 'destructive',
          title: 'Payment Failed',
          description: 'Your payment could not be processed. Please try again.',
        });
      } else {
        setStatus('error');
        toast({
          variant: 'destructive',
          title: 'Payment Not Confirmed',
          description: 'We could not confirm your payment. If money was debited, please contact support.',
        });
      }
    } catch (err: any) {
      console.error('Order confirmation process failed:', err.message || err);
      setStatus('error');
      if (err.message.includes('No details found')) {
           toast({
            variant: 'destructive',
            title: 'Order Not Found',
            description: 'Could not retrieve details for this order. Please contact support.',
          });
      } else {
           toast({
            variant: 'destructive',
            title: 'Verification Failed',
            description: 'Could not verify payment status due to a network error.',
          });
      }
    }
  }, [clearCart, toast]);

  useEffect(() => {
    async function runConfirmation() {
        if (hasFired.current) return;
        
        const fetchedSettings = await getSiteSettings();
        setSettings(fetchedSettings);
        
        const orderId = searchParams.get('order_id') || searchParams.get('orderId');
        if (!orderId) {
            setStatus('error');
            return;
        }
        
        fetchAndProcessOrder(orderId);
    }
    runConfirmation();
  }, [searchParams, fetchAndProcessOrder]);

  const generateInvoice = async () => {
    if (!orderData) return;

    const doc = new jsPDF();
    const businessName = settings?.invoice_business_name || 'Woody Business';
    const businessAddress = settings?.invoice_business_address || 'Sagar, Madhya Pradesh';
    const logoUrl = settings?.invoice_logo_url || '';
    const taxPercent = settings?.invoice_tax_percent ?? 18;
    const currencySymbol = settings?.invoice_currency_symbol || '₹';
    const gstNumber = settings?.invoice_gst_number || '';
    
    const netAmount = orderData.totalCost / (1 + taxPercent / 100);
    const taxAmount = orderData.totalCost - netAmount;
    const balanceDue = orderData.totalCost - orderData.advanceAmount;
    const pdfCurrency = currencySymbol === '₹' ? 'INR ' : currencySymbol;

    doc.setFont("helvetica");
    doc.setFontSize(16);
    doc.text(businessName, 14, 18);
    doc.setFontSize(12);
    doc.text(businessAddress, 14, 24);
    doc.text('Invoice', 160, 18);
    doc.text(`Order ID: ${orderData.orderId}`, 14, 32);
    doc.text(`Date & Time: ${new Date().toLocaleString('en-GB')}`, 14, 38);
    if (gstNumber) {
        doc.text(`GSTIN: ${gstNumber}`, 14, 44);
    }
    
    doc.text('Bill To:', 14, 50);
    doc.text(orderData.customerName, 14, 56);
    doc.text(orderData.customerAddress, 14, 62);

    autoTable(doc, {
      startY: 75,
      head: [['SKU', 'Description', 'Qty', 'Unit Price', 'Total']],
      body: [
        [
          orderData.sku || '-', 
          orderData.productName, 
          String(orderData.quantity), 
          `${pdfCurrency} ${(orderData.totalCost / orderData.quantity).toFixed(2)}`, 
          `${pdfCurrency} ${orderData.totalCost.toFixed(2)}`
        ],
      ],
      headStyles: { fillColor: [40, 40, 40], fontStyle: 'bold' },
      columnStyles: {
          3: { halign: 'right', fontStyle: 'bold' },
          4: { halign: 'right', fontStyle: 'bold' }
      }
    });

    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 10,
      theme: 'plain',
      body: [
        ['Subtotal (before tax):', `${pdfCurrency} ${netAmount.toFixed(2)}`],
        [`GST @ ${taxPercent}% (included):`, `${pdfCurrency} ${taxAmount.toFixed(2)}`],
        ['Total (incl. taxes):', `${pdfCurrency} ${orderData.totalCost.toFixed(2)}`],
        ['Advance Paid:', `${pdfCurrency} ${orderData.advanceAmount.toFixed(2)}`],
        ['Balance Due:', `${pdfCurrency} ${balanceDue.toFixed(2)}`],
      ],
      styles: { fontSize: 11 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right', fontStyle: 'bold' } },
    });

    doc.setFontSize(10);
    doc.text('Note: All prices are inclusive of taxes. Tax component shown for reference.', 14, (doc as any).lastAutoTable.finalY + 10);

    doc.save(`Invoice_${orderData.orderId}.pdf`);
  };
  
  const getExpectedDeliveryDate = () => {
    const minDays = settings?.expected_delivery_min_days ?? 7;
    const maxDays = settings?.expected_delivery_max_days ?? 15;
    const today = new Date();
    const minDeliveryDate = new Date(today);
    minDeliveryDate.setDate(today.getDate() + minDays);
    const maxDeliveryDate = new Date(today);
    maxDeliveryDate.setDate(today.getDate() + maxDays);

    const formatDate = (date: Date) => date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

    return `${formatDate(minDeliveryDate)} - ${formatDate(maxDeliveryDate)}`;
  }
  
  const supportPhoneNumber = settings?.contact_phone;

  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl">Confirming your order...</p>
      </div>
    );
  }

  if (status === 'failed' && orderData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg border-destructive">
          <CardHeader className="text-center">
            <div className="mx-auto bg-red-100 dark:bg-red-900/30 rounded-full p-3 w-fit">
              <XCircle className="h-12 w-12 text-destructive" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-headline mt-4">Payment Failed</CardTitle>
            <p className="text-muted-foreground">We were unable to process your payment.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono font-semibold">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount:</span>
                <span className="font-semibold">₹{orderData.totalCost.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              Please try again or contact support if the problem persists.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="w-full" onClick={() => router.push(`/cart`)}>
                Retry Payment
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Go to Homepage</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'error' && orderData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-yellow-100 dark:bg-yellow-900/30 rounded-full p-3 w-fit">
              <AlertCircle className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-headline mt-4">Order Received</CardTitle>
            <p className="text-muted-foreground">Payment verification is pending due to network issues.</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="border rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID:</span>
                <span className="font-mono font-semibold">{orderData.orderId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Product:</span>
                <span className="font-semibold text-right">{orderData.productName} (x{orderData.quantity})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Total Amount:</span>
                <span className="font-semibold">₹{orderData.totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold text-primary">
                <span className="text-muted-foreground">Advance Paid:</span>
                <span className="font-semibold text-primary">₹{orderData.advanceAmount.toFixed(2)}</span>
              </div>
            </div>
            <p className="text-xs text-center text-muted-foreground">
              If you have completed payment, your order is safe. We will confirm on WhatsApp shortly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="w-full" onClick={generateInvoice}>
                <Download className="mr-2 h-4 w-4" /> Download Invoice
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  if (status === 'error' && !orderData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <XCircle className="h-16 w-16 text-destructive" />
        <h2 className="text-2xl font-bold">Order Confirmation Failed</h2>
        <p className="text-muted-foreground max-w-md">We couldn't retrieve your order details or the payment was not confirmed. Please contact support.</p>
        {supportPhoneNumber && (
            <Button asChild>
                <a href={`tel:${supportPhoneNumber}`}>Contact Support</a>
            </Button>
        )}
      </div>
    );
  }

  if (status === 'success' && orderData) {
    return (
      <div className="max-w-2xl mx-auto">
          <audio ref={audioRef} src="https://cdn.freesound.org/previews/270/270319_5122242-lq.mp3" preload="auto" />
          <Card className="shadow-lg">
              <CardHeader className="text-center">
                  <div className="mx-auto bg-green-100 dark:bg-green-900/30 rounded-full p-3 w-fit">
                      <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-2xl md:text-3xl font-headline mt-4">Order Confirmed!</CardTitle>
                  <p className="text-muted-foreground">Thank you for your purchase, {orderData.customerName}!</p>
              </CardHeader>
              <CardContent className="space-y-6">
                   <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
                      <CalendarClock className="h-6 w-6" />
                      <div>
                          <p className="font-semibold text-sm">Expected Delivery: {getExpectedDeliveryDate()}</p>
                      </div>
                  </div>
  
                  <div className="border rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Order ID:</span>
                          <span className="font-mono font-semibold">{orderData.orderId}</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">Product:</span>
                          <span className="font-semibold text-right">{orderData.productName} (x{orderData.quantity})</span>
                      </div>
                      <div className="flex justify-between">
                          <span className="text-muted-foreground">Total Amount:</span>
                          <span className="font-semibold">₹{orderData.totalCost.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between font-bold text-primary">
                          <span className="text-muted-foreground">Amount Paid:</span>
                          <span className="font-semibold text-primary">₹{orderData.advanceAmount.toFixed(2)}</span>
                      </div>
                       <div className="flex justify-between">
                          <span className="text-muted-foreground">Balance Due:</span>
                          <span className="font-semibold">₹{(orderData.totalCost - orderData.advanceAmount).toFixed(2)}</span>
                      </div>
                  </div>
                  <p className="text-xs text-center text-muted-foreground">
                    A confirmation has been sent to your WhatsApp. 
                    {supportPhoneNumber && <> For details, call <a href={`tel:${supportPhoneNumber}`} className="font-bold hover:underline">{supportPhoneNumber}</a>.</>}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3">
                      {status === 'success' && (
                        <Button className="w-full" onClick={generateInvoice}>
                            <Download className="mr-2 h-4 w-4" /> Download Invoice
                        </Button>
                      )}
                      <Button variant="outline" className="w-full" asChild>
                         <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Continue Shopping</Link>
                      </Button>
                  </div>
              </CardContent>
          </Card>
      </div>
    );
  }

  return null;
};


export default function OrderConfirmationPage() {
    return (
        <div className="container mx-auto px-4 py-12">
            <Suspense fallback={
                 <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                 </div>
            }>
                <OrderConfirmationContent />
            </Suspense>
        </div>
    )
}
