
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Privacy Policy</h1>
      </header>
      
      <div className="space-y-8 prose dark:prose-invert max-w-none">
        <section>
          <h2 className="text-2xl font-semibold mb-4">Information We Collect</h2>
          <p>We collect information that you provide directly to us when you place an order, contact us, or subscribe to our newsletter. This information may include your name, email address, phone number, and shipping address.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">How We Use Your Information</h2>
          <p>We use the information we collect to process your orders, communicate with you, and improve our services. We do not sell, trade, or otherwise transfer to outside parties your personally identifiable information.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">Data Security</h2>
          <p>We implement a variety of security measures to maintain the safety of your personal information when you place an order or enter, submit, or access your personal information.</p>
        </section>

         <section>
          <h2 className="text-2xl font-semibold mb-4">Your Consent</h2>
          <p>By using our site, you consent to our web site privacy policy.</p>
        </section>
      </div>
    </div>
  );
}
