
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { handleSubscription } from '@/ai/flows/handle-subscription';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send } from 'lucide-react';
import { sendWhatsAppTemplateMessage } from '@/lib/whatsapp-cloud';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from '@/components/ui/dialog';
import { getProducts } from '@/lib/data-async';
import type { Product } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { supabase } from '@/lib/supabase-client';

const defaultTestOrderPayload = {
    orderId: '',
    subtotal: 100,
    shippingCost: 0,
    totalCost: 100,
    advanceAmount: 5,
    customerName: 'Supabase Tester',
    customerPhone: '919876543210',
    customerAddress: '123 Database Lane, Supabase City',
    pincode: '123456',
    items: [],
    customImageUrls: [],
    couponCode: '',
    couponDiscount: 0,
    quantity: 1,
};

export default function TestsTab() {
  const { toast } = useToast();
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [whatsappTestNumber, setWhatsappTestNumber] = useState(process.env.NEXT_PUBLIC_TEST_WHATSAPP_TO || '');
  
  const [dbStatus, setDbStatus] = useState('Idle');
  const [dbResult, setDbResult] = useState<any>(null);
  const [dbError, setDbError] = useState<string | null>(null);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [testOrderPayload, setTestOrderPayload] = useState<any>(defaultTestOrderPayload);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');

  // Load Cashfree SDK on component mount
  useEffect(() => {
    if (typeof window !== 'undefined' && !document.getElementById('cashfree-sdk')) {
        const script = document.createElement('script');
        script.id = 'cashfree-sdk';
        script.src = 'https://sdk.cashfree.com/js/v3/cashfree.js';
        document.head.appendChild(script);
    }
  }, []);

  useEffect(() => {
    async function fetchProducts() {
        const fetchedProducts = await getProducts();
        setProducts(fetchedProducts);
        if (fetchedProducts.length > 0) {
            handleProductChange(fetchedProducts[0].id);
        }
    }
    fetchProducts();
  }, []);
  
  useEffect(() => {
    if (selectedProductId) {
        const product = products.find(p => p.id === selectedProductId);
        if (product) {
            const subtotal = product.price * testOrderPayload.quantity;
            const shipping = subtotal > 2999 ? 0 : 99;
            const total = subtotal + shipping;
            const advance = Math.max(1, total * 0.05);

            setTestOrderPayload((prev: any) => ({
                ...prev,
                subtotal: subtotal,
                shippingCost: shipping,
                totalCost: total,
                advanceAmount: parseFloat(advance.toFixed(2)),
                items: [{ id: product.id, name: product.name, quantity: prev.quantity, price: product.price, imageUrl: product.imageUrl }]
            }));
        }
    }
  }, [selectedProductId, testOrderPayload.quantity, products]);
  
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
  };
  
  const handleQuantityChange = (qty: number) => {
      setTestOrderPayload((prev: any) => ({ ...prev, quantity: Math.max(1, qty) }));
  }

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
      customerPhoneNumber: whatsappTestNumber || process.env.NEXT_PUBLIC_TEST_WHATSAPP_TO || '919999999999',
    });
  };

  const testWhatsapp = () => {
    return sendWhatsAppTemplateMessage({
      to: whatsappTestNumber,
      templateName: process.env.WHATSAPP_TEMPLATE_NAME || 'hello_world',
      languageCode: 'en_US',
    });
  };
  
  const handleEndToEndOrderTest = async () => {
    setDbStatus('Running...');
    setDbError(null);
    setDbResult(null);
    setIsTestModalOpen(false);

    try {
        const payload = { ...testOrderPayload };
        
        // Directly invoke the Supabase function
        const { data, error } = await supabase.functions.invoke('create-cashfree-order', {
          body: payload
        });
        
        if (error) throw error;
        if (!data) throw new Error("No data returned from function.");

        setDbResult(data);
        setDbStatus('Session created. Initiating payment...');
        
        if (data.payment_session_id && (window as any).Cashfree) {
           const cashfreeEnv = (process.env.NEXT_PUBLIC_CASHFREE_ENV || 'SANDBOX').toLowerCase();
           const cashfree = (window as any).Cashfree({ mode: cashfreeEnv }); 
           
           toast({ title: 'Launching Cashfree Modal...' });
           
           cashfree.checkout({
               paymentSessionId: data.payment_session_id,
               returnUrl: `${window.location.origin}/order-confirmation?order_id={order_id}`
           }).then((checkoutResult: any) => {
                console.log('Checkout result:', checkoutResult);
                if (checkoutResult.error) {
                    toast({ variant: 'destructive', title: 'Payment Failed', description: checkoutResult.error.message });
                    setDbStatus('Failed.');
                }
                if (checkoutResult.redirect) {
                    setDbStatus("Redirecting to bank page...");
                }
            });
        } else {
            throw new Error("Cashfree SDK not available or payment session ID missing.");
        }
        
    } catch (e: any) {
        setDbError(e.message || 'An unknown error occurred.');
        setDbStatus('Failed.');
        toast({
          variant: 'destructive',
          title: 'Order Test Failed',
          description: e.message || 'An unknown error occurred.',
        });
    }
  };

  const handlePayloadChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTestOrderPayload((prev: any) => ({ ...prev, [name]: value }));
  }

  return (
    <div className="grid gap-6">
       <Card>
        <CardHeader>
          <CardTitle>End-to-End Order Test</CardTitle>
          <CardDescription>
            This simulates a full checkout using the Supabase Edge Function. It saves the order and initiates a payment with Cashfree.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <Dialog open={isTestModalOpen} onOpenChange={setIsTestModalOpen}>
                <DialogTrigger asChild>
                    <Button>
                        Run End-to-End Test
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Configure Test Order</DialogTitle>
                        <DialogDescription>Review the payload before creating the order and initiating payment.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto pr-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="product" className="text-right">Product</Label>
                            <Select onValueChange={handleProductChange} defaultValue={selectedProductId} name="product">
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a product" />
                                </SelectTrigger>
                                <SelectContent>
                                    {products.map(p => (
                                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="quantity" className="text-right">Quantity</Label>
                            <Input id="quantity" name="quantity" type="number" value={testOrderPayload.quantity} onChange={(e) => handleQuantityChange(Number(e.target.value))} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customerName" className="text-right">Customer Name</Label>
                            <Input id="customerName" name="customerName" value={testOrderPayload.customerName} onChange={handlePayloadChange} className="col-span-3" />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customerPhone" className="text-right">Phone</Label>
                            <Input id="customerPhone" name="customerPhone" value={testOrderPayload.customerPhone} onChange={handlePayloadChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="customerAddress" className="text-right">Address</Label>
                            <Input id="customerAddress" name="customerAddress" value={testOrderPayload.customerAddress} onChange={handlePayloadChange} className="col-span-3" />
                        </div>
                         <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="pincode" className="text-right">Pincode</Label>
                            <Input id="pincode" name="pincode" value={testOrderPayload.pincode} onChange={handlePayloadChange} className="col-span-3" />
                        </div>
                        <div className="border-t pt-4 mt-4 space-y-2">
                             <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal:</span> <strong>₹{testOrderPayload.subtotal.toFixed(2)}</strong></div>
                             <div className="flex justify-between text-sm"><span className="text-muted-foreground">Shipping:</span> <strong>₹{testOrderPayload.shippingCost.toFixed(2)}</strong></div>
                             <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total:</span> <strong>₹{testOrderPayload.totalCost.toFixed(2)}</strong></div>
                             <div className="flex justify-between font-bold text-primary"><span >Advance Payable:</span> <span>₹{testOrderPayload.advanceAmount.toFixed(2)}</span></div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleEndToEndOrderTest} disabled={dbStatus === 'Running...'}>
                            {dbStatus === 'Running...' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm & Proceed to Payment
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

          <div className="space-y-2">
            <p><strong>Status:</strong> {dbStatus}</p>
            {dbResult && (
              <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 rounded-md">
                <h4 className="font-semibold text-green-800 dark:text-green-300">Success Response from Supabase:</h4>
                <pre className="text-xs mt-2 overflow-x-auto">
                  {JSON.stringify(dbResult, null, 2)}
                </pre>
              </div>
            )}
            {dbError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-md">
                <h4 className="font-semibold text-red-800 dark:text-red-300">Error Details:</h4>
                <p className="text-xs mt-2">{dbError}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
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
             {!process.env.NEXT_PUBLIC_TEST_WHATSAPP_TO && !whatsappTestNumber && (
                <p className="text-xs text-destructive">Set the NEXT_PUBLIC_TEST_WHATSAPP_TO environment variable or enter a number.</p>
            )}
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
          <Button onClick={() => runTest('Subscription Test', testSubscription)} disabled={loading['Subscription Test'] || !whatsappTestNumber}>
             {loading['Subscription Test'] && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Run Subscription Test
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}
