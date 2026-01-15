import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  total: number;
}

interface InvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  orderDate: string;
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail: string;
  gstNumber?: string;
}

// Client-side PDF generation (Recommended for simple invoices)
export const generateInvoicePDF = (data: InvoiceData): string => {
  const doc = new jsPDF();
  
  // Add custom font for better Unicode support (if needed)
  // doc.addFont('https://cdnjs.cloudflare.com/ajax/libs/pdfmake/0.1.66/fonts/Roboto/Roboto-Regular.ttf', 'Roboto', 'normal');
  
  // Header
  doc.setFontSize(20);
  doc.text('Tax Invoice', 105, 20, { align: 'center' });
  
  // Business Details
  doc.setFontSize(12);
  doc.text(`${data.businessName}`, 20, 40);
  doc.text(`${data.businessAddress}`, 20, 50);
  doc.text(`Phone: ${data.businessPhone}`, 20, 60);
  doc.text(`Email: ${data.businessEmail}`, 20, 70);
  if (data.gstNumber) {
    doc.text(`GST: ${data.gstNumber}`, 20, 80);
  }
  
  // Order Details
  doc.text(`Order #: ${data.orderNumber}`, 140, 40);
  doc.text(`Date: ${data.orderDate}`, 140, 50);
  
  // Customer Details
  doc.setFontSize(14);
  doc.text('Bill To:', 20, 100);
  doc.setFontSize(12);
  doc.text(`${data.customerName}`, 20, 110);
  doc.text(`${data.customerAddress}`, 20, 120);
  doc.text(`Phone: ${data.customerPhone}`, 20, 130);
  doc.text(`Email: ${data.customerEmail}`, 20, 140);
  
  // Items Table
  const tableData = data.items.map(item => [
    item.name,
    item.quantity.toString(),
    `₹${item.price.toFixed(2)}`,
    `₹${item.total.toFixed(2)}`
  ]);
  
  autoTable(doc, {
    head: [['Product', 'Quantity', 'Price', 'Total']],
    body: tableData,
    startY: 160,
    theme: 'grid',
    styles: { fontSize: 10 },
    headStyles: { fillColor: [66, 66, 66] }
  });
  
  // Summary
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  doc.text(`Subtotal: ₹${data.subtotal.toFixed(2)}`, 140, finalY);
  doc.text(`Tax (18%): ₹${data.tax.toFixed(2)}`, 140, finalY + 10);
  doc.text(`Shipping: ₹${data.shipping.toFixed(2)}`, 140, finalY + 20);
  doc.setFontSize(14);
  doc.text(`Total: ₹${data.total.toFixed(2)}`, 140, finalY + 30);
  
  // Footer
  doc.setFontSize(10);
  doc.text('Thank you for your business!', 105, 280, { align: 'center' });
  
  return doc.output('datauristring');
};

// Server-side PDF generation (Recommended for complex/high-volume invoices)
export const generateInvoicePDFServer = async (data: InvoiceData): Promise<Buffer> => {
  // This would be implemented in a Supabase Edge Function
  // For now, return the client-side version
  const dataUri = generateInvoicePDF(data);
  const base64 = dataUri.split(',')[1];
  return Buffer.from(base64, 'base64');
};
