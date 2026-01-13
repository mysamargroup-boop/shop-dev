
import { RotateCcw, ShieldCheck, Truck } from "lucide-react";

export default function ReturnsAndRefundsPage() {
  const supportPhoneNumber = process.env.NEXT_PUBLIC_SUPPORT_PHONE_NUMBER || "919691045405";
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Returns & Refunds Policy</h1>
      </header>
      
      <div className="space-y-8 prose dark:prose-invert max-w-none">
        <p>At Woody Business, we specialize in bulk and customized orders. Due to the personalized nature of our products and the logistics of bulk production, our policy on returns and refunds is as follows:</p>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><RotateCcw className="mr-3 h-6 w-6 text-destructive"/>General Policy: No Refunds on Placed Orders</h2>
          <p>Once an order is placed and the 5% advance payment is made, the order is considered confirmed and enters production. Because we immediately begin sourcing materials and allocating resources, **we generally do not offer refunds or cancellations on confirmed orders.**</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><ShieldCheck className="mr-3 h-6 w-6 text-green-600"/>Exceptions for Returns/Replacements</h2>
          <p>We stand by the quality of our products. While we do not offer refunds, we are committed to ensuring you receive the products as ordered. We will offer a free replacement of affected items in the following specific cases:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li><strong>Damaged in Transit:</strong> If your order arrives with significant damage, please contact us within 48 hours of delivery with photographic evidence of the damage to the packaging and the products.</li>
            <li><strong>Incorrect Product Received:</strong> If you receive a different product from what you ordered, please notify us within 48 hours. We will arrange for the correct items to be sent to you.</li>
            <li><strong>Manufacturing Defects:</strong> If there is a clear manufacturing defect (e.g., incorrect engraving, structural flaws), please provide clear photos and a description of the issue. Our team will assess the defect and process a replacement if validated.</li>
          </ul>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><Truck className="mr-3 h-6 w-6 text-primary"/>How to Initiate a Replacement Claim</h2>
          <p>To initiate a replacement claim for one of the reasons above, please follow these steps:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Contact our support team via WhatsApp at <a href={`https://wa.me/${supportPhoneNumber}`} className="font-semibold text-primary hover:underline">{supportPhoneNumber}</a> or email us at <a href="mailto:support@woody.co.in" className="font-semibold text-primary hover:underline">support@woody.co.in</a> within 48 hours of receiving your order.</li>
            <li>Provide your Order ID and a detailed explanation of the issue.</li>
            <li>Attach clear photos or a video showing the damage, defect, or incorrect item.</li>
            <li>Our team will review your claim and get back to you within 2-3 business days with the next steps.</li>
          </ol>
           <p className="mt-4">Please note that minor variations in wood grain, color, or texture are natural characteristics of the material and are not considered defects.</p>
        </section>

      </div>
    </div>
  );
}
