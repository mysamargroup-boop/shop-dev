
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { handleSubscription } from '@/ai/flows/handle-subscription';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud';
import { useRouter } from 'next/navigation';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

export default function TestsTab() {
  const { toast } = useToast();
  const router = useRouter();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [whatsappTestNumber, setWhatsappTestNumber] = useState(process.env.NEXT_PUBLIC_TEST_WHATSAPP_TO || '919999999999');

  const runTest = async (testName: string, testFn: () => Promise<any>) => {
    setLoading(prev => ({ ...prev, [testName]: true }));
    try {
      await testFn();
      toast({
        title: 'Test Successful',
        description: `${testName} completed without errors.`,
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Test Failed',
        description: error.message || `An error occurred during ${testName}.`,
      });
    } finally {
      setLoading(prev => ({ ...prev, [testName]: false }));
    }
  };

  const testSubscription = () => {
    return handleSubscription({
      customerName: 'Test Subscriber',
      customerPhoneNumber: process.env.NEXT_PUBLIC_TEST_WHATSAPP_TO || '919999999999',
    });
  };

  const testWhatsapp = () => {
    return sendWhatsAppTemplateMessage({
      to: whatsappTestNumber,
      templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'hello_world',
      languageCode: 'en_US',
    });
  };

  const testPayment = async () => {
    const orderId = `WB-TEST-${Date.now()}`;
    const res = await fetch('/api/create-payment-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId,
        amount: 1,
        customerName: 'Test Customer',
        customerPhone: '9999999999',
        returnUrl: `${window.location.origin}/order-confirmation`,
        items: [{ name: 'Test Item', quantity: 1, price: 1 }]
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to create payment link.');
    }
    
    // Store dummy data for confirmation page
    localStorage.setItem(`order_${orderId}`, JSON.stringify({
        orderId: orderId,
        customerName: 'Test Customer',
        customerPhoneNumber: '919999999999',
        customerAddress: '123 Test Street, Test City, 12345',
        productName: 'Test Product',
        quantity: 1,
        totalCost: 1,
        advanceAmount: 1,
    }));

    // Redirect to Cashfree
    if (data.payment_session_id && (window as any).Cashfree) {
       const cashfree = (window as any).Cashfree({ mode: data.env === 'PRODUCTION' ? 'production' : 'sandbox' });
       cashfree.checkout({
           paymentSessionId: data.payment_session_id,
           returnUrl: `${window.location.origin}/order-confirmation?order_id={order_id}`
       });
    } else {
        throw new Error("Cashfree SDK not available or payment session ID missing.");
    }
  };

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>WhatsApp Message</CardTitle>
          <CardDescription>
            Send a test `hello_world` template message to a specific phone number.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2 max-w-sm">
            <Label htmlFor="whatsapp-test-number">Phone Number</Label>
            <Input id="whatsapp-test-number" value={whatsappTestNumber} onChange={(e) => setWhatsappTestNumber(e.target.value)} placeholder="e.g. 919876543210"/>
          </div>
          <Button onClick={() => runTest('WhatsApp Test', testWhatsapp)} disabled={loading['WhatsApp Test'] || !whatsappTestNumber}>
            {loading['WhatsApp Test'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Send className="mr-2"/>
            Send Test Message
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription Flow</CardTitle>
          <CardDescription>
            Simulate a new user subscribing. This will run the `handleSubscription` flow.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => runTest('Subscription Test', testSubscription)} disabled={loading['Subscription Test']}>
             {loading['Subscription Test'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Subscription Test
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment & Order Confirmation</CardTitle>
          <CardDescription>
            Initiate a test payment of ₹1.00. This will redirect you to the Cashfree payment gateway to complete the test transaction.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={() => runTest('Payment Test', testPayment)} disabled={loading['Payment Test']}>
            {loading['Payment Test'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Start Payment Test
          </Button>
        </CardContent>
      </Card>
       <Card>
        <CardHeader>
            <CardTitle>Webhook Test</CardTitle>
            <CardDescription>Manually trigger a mock Cashfree webhook to test the order update logic.</CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
                This requires running the app locally. Open a new terminal and run: <code className="bg-muted p-1 rounded-md">node scripts/test-webhook.js</code>
            </p>
        </CardContent>
      </Card>
    </div>
  );
}
