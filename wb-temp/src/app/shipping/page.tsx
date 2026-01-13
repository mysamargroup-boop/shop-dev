
import { Shield, Truck, FileText, BadgeInfo } from "lucide-react";
import { getSiteSettings } from "@/lib/actions";

export default async function ShippingPage() {
  const settings = await getSiteSettings();
  const freeShippingThreshold = settings.free_shipping_threshold ?? 2999;

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Shipping & Policies</h1>
        <p className="mt-4 text-lg text-muted-foreground">Everything you need to know about your order.</p>
      </header>
      
      <div className="space-y-8">
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><Truck className="mr-3 h-6 w-6 text-primary"/>Shipping Policy</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p>We are committed to delivering your products in a timely and secure manner. We ship across India. Standard shipping times are between {settings.expected_delivery_min_days || 7} and {settings.expected_delivery_max_days || 15} business days, depending on order quantity and customization. Shipping is free for all orders above ₹{freeShippingThreshold}.</p>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><Shield className="mr-3 h-6 w-6 text-primary"/>Privacy Policy</h2>
          <div className="prose dark:prose-invert max-w-none">
            <p>Your privacy is important to us. We do not sell or share your personal information with third parties. All data collected is used solely for the purpose of processing your order and improving our services. For more details, please review our full <a href="/privacy">Privacy Policy</a>.</p>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><BadgeInfo className="mr-3 h-6 w-6 text-primary"/>Pricing Policy</h2>
           <div className="prose dark:prose-invert max-w-none">
            <p>All prices are listed in Indian Rupees (INR) and are inclusive of all applicable taxes ({settings.invoice_tax_percent || 18}% GST). We require a 5% advance payment to confirm bulk orders. We strive to offer competitive pricing for our high-quality, handcrafted products. For very large orders, special pricing may be available. Please <a href="/connect">contact us</a> for a quote.</p>
          </div>
        </section>
        
        <section>
          <h2 className="text-2xl font-semibold mb-4 flex items-center"><FileText className="mr-3 h-6 w-6 text-primary"/>Terms & Conditions</h2>
           <div className="prose dark:prose-invert max-w-none">
            <p>By using our website and purchasing our products, you agree to our terms and conditions. Please read them carefully. All content on this site is the property of Woody Business. For full details, please visit our <a href="/terms">Terms & Conditions</a> page.</p>
          </div>
        </section>
      </div>
    </div>
  );
}
