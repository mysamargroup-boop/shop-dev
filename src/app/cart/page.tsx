
"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from 'react';
import { Minus, Plus, Trash2, ShoppingCart, Loader2, FileText } from "lucide-react";
import useCart from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import WhatsAppCheckoutModal from "@/components/checkout/WhatsAppCheckoutModal";
import type { WhatsAppCheckoutInput } from "@/ai/flows/whatsapp-checkout-message";
import { BLUR_DATA_URL } from "@/lib/constants";
import type { OrderItem, SiteSettings } from "@/lib/types";
import { getSiteSettings } from "@/lib/data-async";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, cartTotal, isLoaded } = useCart();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  
  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  if (!isLoaded || !settings) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-xl font-bold animate-pulse bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Loading your cart...</p>
        </div>
    );
  }
  
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity >= 1) {
      updateQuantity(productId, newQuantity);
    }
  };
  
  const handlePaymentCheckout = () => {
    setCheckoutMode('payment');
    setIsModalOpen(true);
  };
  
  const originalCartTotal = cart.reduce((total, item) => {
    const originalPrice = (item.product as any).regularPrice || item.product.price;
    return total + originalPrice * item.quantity;
  }, 0);
  
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 2999;
  const shippingCost = cartTotal > freeShippingThreshold ? 0 : 99;
  const totalCost = cartTotal + shippingCost;
  
  const productsForCheckout: OrderItem[] = cart.map(item => ({
    id: item.product.id,
    name: item.product.name,
    quantity: item.quantity,
    price: item.product.price,
    imageUrl: item.product.imageUrl,
    imageHint: item.product.imageHint,
  }))

  const uploadProductIds: string[] = cart
    .filter(item => item.product.allowImageUpload)
    .map(item => item.product.id);

  const checkoutInput: Omit<WhatsAppCheckoutInput, 'customerName' | 'customerPhoneNumber' | 'customerAddress' | 'extraNote'> & { productImages?: string[], products: OrderItem[] } | null = cart.length > 0 ? {
    productName: cart.map(item => `${item.quantity}x ${item.product.name}`).join(', '),
    productDescription: `Total order value: ₹${totalCost.toFixed(2)}`,
    originalPrice: originalCartTotal,
    productPrice: cartTotal,
    discountPercentage: originalCartTotal > cartTotal ? ((originalCartTotal - cartTotal) / originalCartTotal) * 100 : 0,
    quantity: cart.reduce((acc, item) => acc + item.quantity, 0),
    shippingCost: shippingCost,
    totalCost: totalCost,
    productImages: cart.map(item => item.product.imageUrl),
    productUrls: baseUrl ? cart.map(item => `${baseUrl}/collections/${item.product.category.toLowerCase().replace(/ /g, '-')}/${item.product.id}`) : [],
    products: productsForCheckout,
    uploadProductIds: uploadProductIds
  } : null;

  return (
    <>
      <div className="container mx-auto px-4 py-12">
        <h1 className="text-4xl font-headline font-bold mb-8 text-center">Your Cart</h1>
        {cart.length === 0 ? (
          <div className="text-center py-16 border-dashed border-2 rounded-lg">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h2 className="mt-4 text-2xl font-semibold">Your cart is empty</h2>
            <p className="mt-2 text-muted-foreground">Looks like you haven't added any gifts to your cart yet.</p>
            <Button asChild className="mt-6">
              <Link href="/">Continue Shopping</Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              {cart.map(({ product, quantity }) => (
                <Card key={product.id} className="flex items-center p-4 overflow-hidden">
                    <div className="relative h-20 w-20 sm:h-24 sm:w-24 flex-shrink-0 rounded-lg overflow-hidden">
                        <Image src={product.imageUrl} alt={product.name} fill className="object-cover" data-ai-hint={product.imageHint} placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="(max-width: 640px) 20vw, 96px" />
                    </div>
                    <div className="ml-4 flex-1 grid grid-cols-1 sm:grid-cols-3 items-center gap-4">
                        <div className="sm:col-span-1">
                            <h3 className="font-semibold text-lg leading-tight">{product.name}</h3>
                            <p className="text-muted-foreground text-sm sm:hidden">₹{product.price.toFixed(2)}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity - 1)}>
                                <Minus className="h-4 w-4"/>
                            </Button>
                            <span className="w-8 text-center font-semibold">{quantity}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleQuantityChange(product.id, quantity + 1)}>
                                <Plus className="h-4 w-4"/>
                            </Button>
                        </div>
                        <div className="sm:col-span-1 flex items-center justify-between sm:justify-end gap-4">
                             <p className="font-semibold text-lg sm:w-24 sm:text-right">₹{(product.price * quantity).toFixed(2)}</p>
                             <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive sm:hidden" onClick={() => removeFromCart(product.id)}>
                                <Trash2 className="h-5 w-5"/>
                            </Button>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" className="ml-2 text-muted-foreground hover:text-destructive flex-shrink-0 hidden sm:flex" onClick={() => removeFromCart(product.id)}>
                        <Trash2 className="h-5 w-5"/>
                    </Button>
                </Card>
              ))}
            </div>
            <div>
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{shippingCost > 0 ? `₹${shippingCost.toFixed(2)}` : 'Free'}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>₹{totalCost.toFixed(2)}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-3">
                  <Button className="w-full" size="lg" onClick={handlePaymentCheckout}>
                    <FileText className="mr-2 h-4 w-4" /> Order with Advance
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
      {checkoutInput && <WhatsAppCheckoutModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        checkoutInput={checkoutInput}
        checkoutMode={checkoutMode}
      />}
    </>
  );
}
