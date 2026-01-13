
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { CartItem, Product } from '@/lib/types';
import { useToast } from './use-toast';

const useCart = () => {
    const [cart, setCart] = useState<CartItem[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const storedCart = sessionStorage.getItem('woody-business-cart');
            if (storedCart) {
                setCart(JSON.parse(storedCart));
            }
        } catch (error) {
            console.error("Failed to parse cart from sessionStorage", error);
            sessionStorage.removeItem('woody-business-cart');
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const updateSessionStorage = useCallback((newCart: CartItem[]) => {
        try {
            sessionStorage.setItem('woody-business-cart', JSON.stringify(newCart));
        } catch (error) {
            console.error("Failed to save cart to sessionStorage", error);
        }
    }, []);

    const addToCart = useCallback((product: Product, quantity: number = 1) => {
        setCart(prevCart => {
            const productWithCorrectPrice = { ...product, price: product.price };
            const existingItem = prevCart.find(item => item.product.id === productWithCorrectPrice.id);
            
            let newCart;
            if (existingItem) {
                newCart = prevCart.map(item =>
                    item.product.id === productWithCorrectPrice.id
                        ? { ...item, quantity: item.quantity + quantity }
                        : item
                );
            } else {
                newCart = [...prevCart, { product: productWithCorrectPrice, quantity }];
            }
            updateSessionStorage(newCart);
            return newCart;
        });
        toast({
            title: "Added to Cart",
            description: `${product.name} has been added to your cart.`,
        });
    }, [updateSessionStorage, toast]);

    const removeFromCart = useCallback((productId: string) => {
        let productToRemove: Product | undefined;
        setCart(prevCart => {
            productToRemove = prevCart.find(item => item.product.id === productId)?.product;
            const newCart = prevCart.filter(item => item.product.id !== productId);
            updateSessionStorage(newCart);
            return newCart;
        });
        
        if (productToRemove) {
            toast({
              title: "Removed from Cart",
              description: `${productToRemove.name} has been removed from your cart.`,
              variant: 'destructive'
            });
        }
    }, [updateSessionStorage, toast]);

    const updateQuantity = useCallback((productId: string, newQuantity: number) => {
        if (newQuantity <= 0) {
            removeFromCart(productId);
            return;
        }

        setCart(prevCart => {
            const newCart = prevCart.map(item =>
                item.product.id === productId ? { ...item, quantity: newQuantity } : item
            );
            updateSessionStorage(newCart);
            return newCart;
        });
    }, [removeFromCart, updateSessionStorage]);

    const clearCart = useCallback(() => {
        setCart([]);
        sessionStorage.removeItem('woody-business-cart');
    }, []);
    
    const cartCount = useMemo(() => cart.reduce((count, item) => count + item.quantity, 0), [cart]);

    const cartTotal = useMemo(() => cart.reduce((total, item) => total + item.product.price * item.quantity, 0), [cart]);

    return { cart, cartCount, cartTotal, addToCart, removeFromCart, updateQuantity, clearCart, isLoaded };
};

export default useCart;
