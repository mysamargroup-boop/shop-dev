
'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle, Loader2, AlertCircle, Download, ArrowLeft, CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useToast } from '@/hooks/use-toast';
import useCart from '@/hooks/use-cart';
import Link from 'next/link';

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
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [deliveryMinDays, setDeliveryMinDays] = useState<number>(7);
  const [deliveryMaxDays, setDeliveryMaxDays] = useState<number>(15);
  const [hasLocalData, setHasLocalData] = useState(false);
  const [uploadedThumbs, setUploadedThumbs] = useState<string[]>([]);

  useEffect(() => {
    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    if (!orderId) {
      setStatus('error');
      return;
    }
    clearCart();
    let localData: OrderData | null = null;
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem(`order_${orderId}`) : null;
      if (stored) localData = JSON.parse(stored);
      if (localData) {
        setOrderData(localData);
        setHasLocalData(true);
      }
      try {
        const storedUploads = typeof window !== 'undefined' ? localStorage.getItem(`order_uploads_${orderId}`) : null;
        if (storedUploads) {
          const urls = JSON.parse(storedUploads);
          if (Array.isArray(urls)) setUploadedThumbs(urls.slice(0, 6));
        }
      } catch {}
    } catch {}
    (async () => {
      try {
        try {
        const sres = await fetch('/api/settings');
        const sdata = await sres.json();
        if (sres.ok && sdata) {
            if (typeof sdata.expected_delivery_min_days === 'number') {
              setDeliveryMinDays(Math.max(1, sdata.expected_delivery_min_days));
            }
            if (typeof sdata.expected_delivery_max_days === 'number') {
              setDeliveryMaxDays(Math.max(1, sdata.expected_delivery_max_days));
            }
          }
        } catch {}
        const res = await fetch(`/api/order-status?order_id=${encodeURIComponent(orderId)}`, { cache: 'no-store' });
        const statusData = await res.json();
        if (!res.ok) throw new Error(statusData.error || 'Status fetch failed');
        const orderStatus = (statusData.order_status || statusData.orderStatus || '').toUpperCase();
        const orderAmount = Number(statusData.order_amount || statusData.orderAmount || 0);
        if (!localData) {
          setOrderData({
            orderId,
            customerName: 'Customer',
            customerPhoneNumber: '',
            customerAddress: '',
            productName: 'Order',
            quantity: 1,
            totalCost: orderAmount,
            advanceAmount: Math.max(1, parseFloat((orderAmount * 0.05).toFixed(2))),
          });
        }
        if (orderStatus === 'PAID' || orderStatus === 'COMPLETED') {
          setStatus('success');
          const od = localData || {
            customerName: 'Customer',
            customerPhoneNumber: '',
            productName: 'Order',
            quantity: 1,
            customerAddress: '',
            totalCost: orderAmount,
            orderId,
            advanceAmount: Math.max(1, parseFloat((orderAmount * 0.05).toFixed(2))),
          };
          try {
            const resp = await fetch('/api/whatsapp/send-template', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                to: od.customerPhoneNumber,
                bodyParameters: [
                  od.customerName,
                  orderId,
                  od.productName,
                  `${od.quantity}x`,
                  od.customerAddress,
                  `₹${(od.totalCost || orderAmount).toFixed(2)}`,
                ],
              }),
            });
            const wdata = await resp.json().catch(() => null);
            if (!resp.ok) throw new Error(wdata?.error || 'WhatsApp API failed');

            try {
              const supportNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER || '';
              const normalizedSupport = supportNumber.replace(/\D/g, '');
              const normalizedCustomer = (od.customerPhoneNumber || '').replace(/\D/g, '');
              if (normalizedSupport && normalizedSupport !== normalizedCustomer) {
                const resp2 = await fetch('/api/whatsapp/send-template', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    to: supportNumber,
                    bodyParameters: [
                      od.customerName,
                      orderId,
                      od.productName,
                      `${od.quantity}x`,
                      od.customerAddress,
                      `₹${(od.totalCost || orderAmount).toFixed(2)}`,
                    ],
                  }),
                });
                await resp2.json().catch(() => null);
              }
            } catch {}
          } catch (err: any) {
            console.error('Failed to send WhatsApp confirmation:', err?.message || err);
            toast({
              variant: 'destructive',
              title: 'WhatsApp Failed',
              description: 'Could not send WhatsApp order confirmation.',
            });
          }
        } else {
          setStatus('error');
          toast({
            variant: 'destructive',
            title: 'Payment Not Confirmed',
            description: 'We could not confirm your payment. If money is debited, please contact support.',
          });
        }
      } catch (err: any) {
        console.error('Order confirmation status check failed:', err.message || err);
        setStatus('error');
        toast({
          variant: 'destructive',
          title: 'Payment Check Failed',
          description: 'Could not verify payment status due to network error.',
        });
      }
    })();
  }, [searchParams, toast, clearCart]);

  const generateInvoice = async () => {
    if (!orderData) return;

    const doc = new jsPDF();
    // Optionally fetch invoice settings
    let businessName = process.env.NEXT_PUBLIC_BUSINESS_NAME || 'Woody Business';
    let businessAddress = process.env.NEXT_PUBLIC_BUSINESS_ADDRESS || 'Sagar, Madhya Pradesh';
    let logoUrl = process.env.NEXT_PUBLIC_BUSINESS_LOGO_URL || '';
    let taxPercent = Number(process.env.NEXT_PUBLIC_TAX_PERCENT || 18);
    let currencySymbol = process.env.NEXT_PUBLIC_CURRENCY_SYMBOL || '₹';
    try {
          const sres = await fetch('/api/settings');
          const sdata = await sres.json();
          if (sres.ok && sdata) {
        businessName = sdata.invoice_business_name || businessName;
        businessAddress = sdata.invoice_business_address || businessAddress;
        logoUrl = sdata.invoice_logo_url || logoUrl;
        taxPercent = Number(sdata.invoice_tax_percent ?? taxPercent);
        currencySymbol = sdata.invoice_currency_symbol || currencySymbol;
      }
    } catch {}
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
    try {
      const sres2 = await fetch('/api/settings');
      const sdata2 = await sres2.json();
      if (sres2.ok && sdata2?.invoice_gst_number) {
        doc.text(`GSTIN: ${sdata2.invoice_gst_number}`, 14, 44);
      }
    } catch {}
    
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
    const today = new Date();
    const minDeliveryDate = new Date(today);
    minDeliveryDate.setDate(today.getDate() + deliveryMinDays);
    const maxDeliveryDate = new Date(today);
    maxDeliveryDate.setDate(today.getDate() + deliveryMaxDays);

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    };

    return `${formatDate(minDeliveryDate)} - ${formatDate(maxDeliveryDate)}`;
  }
  
  const supportPhoneNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER;


  if (status === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-xl">Confirming your order...</p>
      </div>
    );
  }

  if (status === 'error' && !orderData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-center">
        <AlertCircle className="h-12 w-12 text-destructive" />
        <h2 className="text-2xl font-bold">Order Confirmation Failed</h2>
        <p className="text-muted-foreground">We couldn't retrieve your order details. Please contact support.</p>
        <Button asChild>
            <Link href="/"><ArrowLeft className="mr-2 h-4 w-4" /> Go to Homepage</Link>
        </Button>
      </div>
    );
  }

  if (status === 'error' && orderData) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <div className="mx-auto bg-yellow-100 rounded-full p-3 w-fit">
              <AlertCircle className="h-12 w-12 text-yellow-600" />
            </div>
            <CardTitle className="text-2xl md:text-3xl font-headline mt-4">Order Received</CardTitle>
            <p className="text-muted-foreground">Payment verification pending due to network issues.</p>
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

  return (
    <div className="max-w-2xl mx-auto">
        <Card className="shadow-lg">
            <CardHeader className="text-center">
                <div className="mx-auto bg-green-100 rounded-full p-3 w-fit">
                    <CheckCircle className="h-12 w-12 text-green-600" />
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
                {uploadedThumbs.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <p className="font-semibold mb-2 text-sm">Your uploaded images</p>
                    <div className="grid grid-cols-3 gap-2">
                      {uploadedThumbs.map((u, i) => (
                        <div key={i} className="aspect-square overflow-hidden rounded-md">
                          <img src={u} alt={`Upload ${i + 1}`} className="object-cover w-full h-full" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

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
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Balance Due:</span>
                        <span className="font-semibold">₹{(orderData.totalCost - orderData.advanceAmount).toFixed(2)}</span>
                    </div>
                </div>
                <p className="text-xs text-center text-muted-foreground">A confirmation has been sent to your WhatsApp. You can download a copy of your invoice below. For details, call {supportPhoneNumber}.</p>
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
