
'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Loader2, AlertTriangle, UploadCloud } from 'lucide-react';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper to convert a Base64 string back to a File object
async function base64ToFile(base64: string, filename: string): Promise<File> {
    const res = await fetch(base64);
    const blob = await res.blob();
    return new File([blob], filename, { type: blob.type });
}

function OrderConfirmationContent() {
    const searchParams = useSearchParams();
    const orderId = searchParams.get('order_id');
    const [status, setStatus] = useState<'loading' | 'uploading' | 'success' | 'warning' | 'error'>('loading');
    const [message, setMessage] = useState('Verifying your order...');

    useEffect(() => {
        if (!orderId) {
            setStatus('error');
            setMessage('No order ID found. Your order might be processed, but we cannot confirm it here.');
            return;
        }

        const processOrder = async () => {
            try {
                // 1. Retrieve image data from localStorage
                const imageDataString = localStorage.getItem(`images_for_${orderId}`);
                
                if (imageDataString) {
                    setStatus('uploading');
                    setMessage('Finalizing your order and uploading custom images...');

                    const base64Files: string[] = JSON.parse(imageDataString);

                    // 2. Invoke the 'upload-images' Supabase function
                    const { data: uploadData, error: uploadError } = await supabase.functions.invoke('upload-images', {
                        body: { orderId, base64Files },
                    });

                    if (uploadError) {
                        throw new Error(`Image upload failed: ${uploadError.message}`);
                    }
                    
                    // The 'upload-images' function should handle updating the order itself.
                    // If it doesn't, you would update the order here with the returned URLs.

                    // 3. Clear the stored images from localStorage
                    localStorage.removeItem(`images_for_${orderId}`);
                }

                // Trigger success effects
                confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, zIndex: 10000 });
                setStatus('success');
                setMessage(`Your order #${orderId} has been successfully placed and paid for.`);

                // 4. Clean up other order data from localStorage
                localStorage.removeItem(`order_${orderId}`);

            } catch (err: any) {
                console.error('Order confirmation processing failed:', err);
                setStatus('warning');
                setMessage(`Your payment was successful, but we encountered an issue processing the final details (e.g., image upload). Please contact support with your order ID: ${orderId}. Error: ${err.message}`);
                // Don't remove localStorage data in case of failure, for manual recovery
            }
        };

        processOrder();

    }, [orderId]);

    const renderStatusIcon = () => {
        switch (status) {
            case 'loading':
                return <Loader2 className="h-12 w-12 animate-spin text-blue-500" />;
            case 'uploading':
                return <UploadCloud className="h-12 w-12 animate-spin text-purple-500" />;
            case 'success':
                return <CheckCircle className="h-12 w-12 text-green-500" />;
            case 'warning':
                return <AlertTriangle className="h-12 w-12 text-yellow-500" />;
            case 'error':
                return <AlertTriangle className="h-12 w-12 text-red-500" />;
            default:
                return null;
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
            <Card className="w-full max-w-md mx-4 shadow-lg">
                <CardHeader className="text-center">
                    <div className="mx-auto mb-4">
                        {renderStatusIcon()}
                    </div>
                    <CardTitle className="text-2xl font-bold"> 
                        {status === 'success' ? 'Order Confirmed!' : 'Processing Order'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-6">
                    <p className="text-muted-foreground">
                        {message}
                    </p>
                    {status === 'success' && (
                       <div className='flex flex-col gap-2'>
                         <p className="text-sm">
                            Thank you for your purchase! You will receive a confirmation on WhatsApp or SMS shortly.
                        </p>
                        <p className='text-xs text-muted-foreground'>Please save your Order ID for future reference.</p>
                       </div>
                    )}
                     {(status === 'success' || status === 'warning' || status === 'error') && (
                        <Button asChild className="mt-4 w-full">
                            <Link href="/">Continue Shopping</Link>
                        </Button>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

export default function OrderConfirmationPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OrderConfirmationContent />
        </Suspense>
    );
}
