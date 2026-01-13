
import { FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <header className="text-center mb-12">
        <h1 className="text-4xl font-headline font-bold text-primary">Terms & Conditions</h1>
      </header>
      
      <div className="space-y-8 prose dark:prose-invert max-w-none">
        <section>
          <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
          <p>Welcome to Woody Business. By accessing our website and using our services, you agree to comply with and be bound by the following terms and conditions of use, which together with our privacy policy govern Woody Business's relationship with you in relation to this website.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">2. Intellectual Property</h2>
          <p>The content of the pages of this website is for your general information and use only. It is subject to change without notice. All trademarks reproduced in this website which are not the property of, or licensed to, the operator are acknowledged on the website. Unauthorized use of this website may give rise to a claim for damages and/or be a criminal offense.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">3. Product Information</h2>
          <p>We endeavor to describe and display our products as accurately as possible. However, we cannot guarantee that the colors, features, specifications, and details of the products will be accurate, complete, reliable, current, or free of other errors, and your electronic display may not accurately reflect the actual colors and details of the products.</p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4">4. Limitation of Liability</h2>
          <p>In no event will we be liable for any loss or damage including without limitation, indirect or consequential loss or damage, or any loss or damage whatsoever arising from loss of data or profits arising out of, or in connection with, the use of this website.</p>
        </section>
      </div>
    </div>
  );
}
