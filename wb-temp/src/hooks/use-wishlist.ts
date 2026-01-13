
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import type { Product } from '@/lib/types';
import { useToast } from './use-toast';

const useWishlist = () => {
    const [wishlist, setWishlist] = useState<Product[]>([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        try {
            const storedWishlist = sessionStorage.getItem('woody-wishlist');
            if (storedWishlist) {
                setWishlist(JSON.parse(storedWishlist));
            }
        } catch (error) {
            console.error("Failed to parse wishlist from sessionStorage", error);
            sessionStorage.removeItem('woody-wishlist');
        } finally {
            setIsLoaded(true);
        }
    }, []);

    const updateSessionStorage = useCallback((newWishlist: Product[]) => {
        try {
            sessionStorage.setItem('woody-wishlist', JSON.stringify(newWishlist));
        } catch (error) {
            console.error("Failed to save wishlist to sessionStorage", error);
        }
    }, []);

    const addToWishlist = useCallback((product: Product) => {
        setWishlist(prevWishlist => {
            const existingItem = prevWishlist.find(item => item.id === product.id);
            if (existingItem) {
                // Item is already in the wishlist, no need to add it again.
                // We can optionally show a toast message here if needed.
                toast({
                    title: "Already in Wishlist",
                    description: `${product.name} is already in your wishlist.`,
                });
                return prevWishlist;
            }
            const newWishlist = [...prevWishlist, product];
            updateSessionStorage(newWishlist);
            return newWishlist;
        });
    }, [updateSessionStorage, toast]);

    const removeFromWishlist = useCallback((productId: string) => {
        setWishlist(prevWishlist => {
            const newWishlist = prevWishlist.filter(item => item.id !== productId);
            updateSessionStorage(newWishlist);
            return newWishlist;
        });
    }, [updateSessionStorage]);

    const wishlistCount = useMemo(() => wishlist.length, [wishlist]);

    return { wishlist, wishlistCount, addToWishlist, removeFromWishlist, isLoaded };
};

export default useWishlist;

    