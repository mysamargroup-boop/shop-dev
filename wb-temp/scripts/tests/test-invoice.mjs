import { writeFileSync } from 'fs';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

function generateSampleInvoice() {
  const doc = new jsPDF();
  const businessName = 'Woody Business';
  const businessAddress = 'Sagar, Madhya Pradesh';
  const currencySymbol = '₹';
  const orderId = `WB-TEST-${Date.now()}`;
  const orderData = {
    sku: 'SKU-TEST-001',
    productName: 'Sample Product',
    quantity: 25,
    totalCost: 2999.0,
    advanceAmount: 149.95,
  };
  const taxPercent = 18;
  const netAmount = orderData.totalCost / (1 + taxPercent / 100);
  const taxAmount = orderData.totalCost - netAmount;
  const balanceDue = orderData.totalCost - orderData.advanceAmount;

  doc.setFontSize(16);
  doc.text(businessName, 14, 18);
  doc.setFontSize(12);
  doc.text(businessAddress, 14, 24);
  doc.text('Invoice', 160, 18);
  doc.text(`Order ID: ${orderId}`, 14, 32);
  doc.text(`Date & Time: ${new Date().toLocaleString('en-GB')}`, 14, 38);

  doc.text('Bill To:', 14, 50);
  doc.text('Test Customer', 14, 56);
  doc.text('Test Address', 14, 62);

  doc.autoTable({
    startY: 75,
    head: [['SKU', 'Description', 'Qty', 'Unit Price', 'Total']],
    body: [[
      orderData.sku || '-', 
      orderData.productName, 
      String(orderData.quantity), 
      `${currencySymbol}${(orderData.totalCost / orderData.quantity).toFixed(2)}`,
      `${currencySymbol}${orderData.totalCost.toFixed(2)}`
    ]],
  });

  doc.autoTable({
    startY: doc.lastAutoTable.finalY + 10,
    theme: 'plain',
    body: [
      ['Subtotal (before tax):', `${currencySymbol}${netAmount.toFixed(2)}`],
      [`GST @ ${taxPercent}% (included):`, `${currencySymbol}${taxAmount.toFixed(2)}`],
      ['Total (incl. taxes):', `${currencySymbol}${orderData.totalCost.toFixed(2)}`],
      ['Advance Paid:', `${currencySymbol}${orderData.advanceAmount.toFixed(2)}`],
      ['Balance Due:', `${currencySymbol}${balanceDue.toFixed(2)}`],
    ],
    styles: { fontSize: 11 },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { halign: 'right' } },
  });

  const out = doc.output('arraybuffer');
  const filePath = `Invoice_${orderId}.pdf`;
  writeFileSync(filePath, Buffer.from(out));
  console.log(`✅ PDF created: ${filePath}`);
}

generateSampleInvoice();
