
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, Heart } from 'lucide-react';
import type { Product, SiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn, slugify } from '@/lib/utils';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import WhatsAppCheckoutModal from '../checkout/WhatsAppCheckoutModal';
import { BLUR_DATA_URL } from '@/lib/constants';
import { getSiteSettings } from '@/lib/actions';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

  const categorySlug = product.category ? slugify(product.category.split(',')[0].trim()) : 'uncategorized';
  const productUrl = `/collections/${categorySlug}/${slugify(product.name)}`;
  const imageUrl = product.imageUrl || '/placeholder-image.svg';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const currentUrl = baseUrl ? `${baseUrl}${productUrl}` : '';

  useEffect(() => {
    getSiteSettings().then(setSettings);
  }, []);

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isClient) {
        const effectiveCheckoutMode = settings?.whatsapp_only_checkout_enabled ? 'whatsapp' : 'payment';
        setCheckoutMode(effectiveCheckoutMode);
        setIsModalOpen(true);
    }
  };
  
  const isInWishlist = wishlist.some(item => item.id === product.id);

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast({ title: "Removed from Wishlist", description: `${product.name} removed from your wishlist.` });
    } else {
      addToWishlist(product);
      toast({ title: "Added to Wishlist", description: `${product.name} added to your wishlist.` });
    }
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addToCart(product);
  };
  
  const discountedSubtotal = product.price;
  const shippingCost = discountedSubtotal > (settings?.free_shipping_threshold ?? 2999) ? 0 : 99;
  const totalCost = discountedSubtotal + shippingCost;


  return (
    <>
    <Card className="flex flex-col overflow-hidden transition-shadow duration-300 hover:shadow-lg group bg-card h-full relative">
      {product.badge && (
        <Badge className="absolute top-2 left-2 z-10" variant="secondary">{product.badge}</Badge>
      )}
      <CardHeader className="p-0 relative">
        <Link href={productUrl}>
          <div className="aspect-square relative">
            <Image
              src={imageUrl}
              alt={product.imageAlt || product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              data-ai-hint={product.imageHint}
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
            />
          </div>
        </Link>
         <Button
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background"
            onClick={handleWishlistToggle}
          >
            <Heart className={cn("h-4 w-4 text-foreground", isInWishlist && "fill-destructive text-destructive")} />
          </Button>
      </CardHeader>
      <CardContent className="flex-1 p-3 space-y-2 flex flex-col">
        <Link href={productUrl} className="flex-1">
            <h3 className="font-headline font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-2 min-h-[40px]">
            {product.name}
            </h3>
        </Link>
        <div className="flex flex-wrap items-center gap-1 text-xs">
            <Badge variant="outline">{product.category.split(',')[0]}</Badge>
            {product.tags?.slice(0, 2).map(tag => (
                <Badge key={tag} variant="secondary">{tag}</Badge>
            ))}
        </div>
        <div className="flex items-baseline gap-2 mt-auto">
            {typeof product.salePrice === 'number' && typeof product.regularPrice === 'number' && product.salePrice < product.regularPrice ? (
              <>
                <p className="text-lg font-bold text-accent">
                  ₹{product.salePrice.toFixed(0)}
                </p>
                <p className="text-sm line-through text-muted-foreground">
                  ₹{product.regularPrice.toFixed(0)}
                </p>
              </>
            ) : (
              <p className="text-lg font-bold text-primary">
                {typeof product.regularPrice === 'number'
                  ? `₹${product.regularPrice.toFixed(0)}`
                  : typeof product.price === 'number'
                  ? `₹${product.price.toFixed(0)}`
                  : 'Price not available'}
              </p>
            )}
        </div>
        {product.specificDescription && <p className="text-xs text-muted-foreground font-semibold">{product.specificDescription}</p>}
      </CardContent>
      <CardFooter className="p-2 pt-0 mt-auto flex flex-col items-stretch gap-2">
         {product.rating && product.reviewCount && (
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500"/>
                    <span className="font-semibold text-foreground">{product.rating}</span>
                    <span className="text-[11px] sm:text-xs">({product.reviewCount} Reviews)</span>
                </div>
                 <Button 
                    onClick={handleAddToCart} 
                    className="rounded-full h-8 w-8 p-0 bg-primary/10 text-primary hover:bg-primary/20 disabled:bg-muted disabled:text-muted-foreground"
                    disabled={product.inventory === 0}
                    variant="outline"
                    size="icon"
                >
                    <ShoppingCart className="h-4 w-4" />
                </Button>
            </div>
        )}
        <Button 
          onClick={handleBuyNow} 
          className="w-full rounded-lg bg-gradient-to-r from-green-700 to-green-900 hover:from-green-800 hover:to-green-900 text-white shine-effect"
          disabled={product.inventory === 0}
          size="sm"
        >
            <Zap className="h-4 w-4 text-yellow-300" />
            <span>Buy Now</span>
        </Button>
      </CardFooter>
    </Card>
     <WhatsAppCheckoutModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        checkoutMode={checkoutMode}
        checkoutInput={{
            sku: product.id,
            productName: `${product.name}${product.options?.find(o => o.value)?.label ? ` (${product.options?.find(o => o.value)?.label})` : ''}`,
            productDescription: product.description,
            originalPrice: totalCost,
            productPrice: totalCost,
            discountPercentage: 0,
            quantity: 1,
            shippingCost: shippingCost,
            totalCost: totalCost,
            productUrls: currentUrl ? [currentUrl] : [],
        }}
      />
    </>
  );
};

export default ProductCard;
