'use client';
import { Button } from '@/components/ui/button';
import { FileDown } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

type Item = { name: string; quantity: number; price: number };

export default function InvoiceDownloadButton(props: {
  orderId: string;
  createdAt: string;
  customerName: string;
  customerAddress?: string;
  customerPhone?: string;
  items: Item[];
  subtotal?: number;
  shippingCost?: number;
  discountAmount?: number;
  totalAmount: number;
  advanceAmount: number;
  remainingAmount: number;
  couponCode?: string;
  taxPercent?: number;
}) {
  function handleDownload() {
    const {
      orderId,
      createdAt,
      customerName,
      customerAddress,
      customerPhone,
      items,
      subtotal = 0,
      shippingCost = 0,
      discountAmount = 0,
      totalAmount,
      advanceAmount,
      remainingAmount,
      couponCode,
      taxPercent = 18,
    } = props;

    const currency = '₹';
    const doc = new jsPDF();

    const businessName = 'Woody Business';
    const businessAddress = 'Sagar, Madhya Pradesh';

    doc.setFontSize(16);
    doc.text(businessName, 14, 18);
    doc.setFontSize(11);
    doc.text(businessAddress, 14, 24);
    doc.setFontSize(14);
    doc.text('Invoice', 170, 18, { align: 'right' });

    doc.setFontSize(11);
    doc.text(`Order ID: ${orderId}`, 14, 34);
    doc.text(`Date: ${new Date(createdAt).toLocaleString('en-GB')}`, 14, 40);

    doc.text('Bill To:', 14, 52);
    doc.text(customerName || '-', 14, 58);
    if (customerPhone) doc.text(customerPhone, 14, 64);
    if (customerAddress) {
      const split = doc.splitTextToSize(customerAddress, 180);
      doc.text(split as string[], 14, customerPhone ? 70 : 64);
    }

    const startY = 80;
    const body = items.length
      ? items.map((it) => [
          it.name,
          String(it.quantity),
          `${currency}${(it.price).toFixed(2)}`,
          `${currency}${(it.price * it.quantity).toFixed(2)}`,
        ])
      : [['-', '0', `${currency}0.00`, `${currency}0.00`]];

    // @ts-ignore
    doc.autoTable({
      startY,
      head: [['Description', 'Qty', 'Unit Price', 'Total']],
      body,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [240, 240, 240], textColor: 20 },
    });

    const afterTableY = (doc as any).lastAutoTable?.finalY || startY + 10;

    const netAmount = totalAmount / (1 + taxPercent / 100);
    const taxAmount = totalAmount - netAmount;

    const summary: [string, string][] = [
      ['Subtotal:', `${currency}${subtotal.toFixed(2)}`],
      ['Shipping:', `${currency}${shippingCost.toFixed(2)}`],
      ...(discountAmount ? [['Discount:', `- ${currency}${discountAmount.toFixed(2)}`] as [string, string]] : []),
      [`GST @ ${taxPercent}% (included):`, `${currency}${taxAmount.toFixed(2)}`],
      ['Total (incl. taxes):', `${currency}${totalAmount.toFixed(2)}`],
      ['Advance Paid:', `${currency}${advanceAmount.toFixed(2)}`],
      ['Balance Due:', `${currency}${remainingAmount.toFixed(2)}`],
    ];
    if (couponCode) summary.splice(3, 0, ['Coupon Code:', couponCode]);

    // @ts-ignore
    doc.autoTable({
      startY: afterTableY + 8,
      theme: 'plain',
      body: summary,
      styles: { fontSize: 11 },
      columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
    });

    doc.save(`Invoice_${orderId}.pdf`);
  }

  return (
    <Button type="button" onClick={handleDownload}>
      <FileDown className="h-4 w-4 mr-2" />
      Download Invoice
    </Button>
  );
}

