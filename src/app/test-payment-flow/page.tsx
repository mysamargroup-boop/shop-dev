'use client';
import { useState } from 'react';
import { createPaymentLink } from '@/lib/payment';

export default function TestPaymentFlowPage() {
  const [status, setStatus] = useState('Idle');
  const [result, setResult] = useState<any>(null);

  const handleTestPayment = async () => {
    setStatus('Creating Payment Link...');
    try {
      const input = {
        productName: 'Test Product',
        totalCost: 10,
        customerName: 'Test User',
        customerPhoneNumber: '9999999999',
        customerAddress: 'Test Address',
        advanceAmount: 10,
        productUrls: []
      };

      const res = await createPaymentLink(input);
      setResult(res);
      setStatus('Payment Link Created');
      
      console.log('Payment Response:', res);

      if (res.payment_url) {
        // Simulate what WhatsAppCheckoutModal does (checking if appending return_url is actually needed or correct)
        // Ideally, we should just use res.payment_url if the return_url was already embedded in the order creation
        const confirmationData = btoa(JSON.stringify({ ...input, orderId: res.orderId }));
        const returnUrlParam = `&return_url=${window.location.origin}/order-confirmation?data=${encodeURIComponent(confirmationData)}`;
        
        // Check if we should append it. If the URL already has it, maybe not.
        // But for this test, let's provide a button to redirect.
      }

    } catch (error: any) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Test Payment Flow</h1>
      <button 
        onClick={handleTestPayment}
        className="bg-blue-600 text-white px-4 py-2 rounded"
      >
        Create Payment Link
      </button>
      
      <div className="mt-4">
        <p>Status: {status}</p>
        {result && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <pre>{JSON.stringify(result, null, 2)}</pre>
            {result.payment_url && (
              <div className="mt-4">
                <p className="mb-2">Click to pay:</p>
                <a 
                    href={result.payment_url} 
                    className="bg-green-600 text-white px-4 py-2 rounded inline-block"
                >
                    Pay Now (Direct)
                </a>
                <p className="mt-2 text-sm text-gray-500">
                    Note: This uses the URL returned by Cashfree.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
