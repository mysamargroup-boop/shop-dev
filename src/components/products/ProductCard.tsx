
"use client";

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, Zap, Heart } from 'lucide-react';
import type { Product } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import WhatsAppCheckoutModal from '../checkout/WhatsAppCheckoutModal';
import { BLUR_DATA_URL } from '@/lib/constants';

interface ProductCardProps {
  product: Product;
}

const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  
  const categorySlug = product.category ? product.category.split(',')[0].trim().toLowerCase().replace(/ /g, '-') : 'uncategorized';
  const productUrl = `/collections/${categorySlug}/${product.id}`;
  const imageUrl = product.imageUrl || '/placeholder-image.svg';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const currentUrl = baseUrl ? `${baseUrl}${productUrl}` : '';

  const handleBuyNow = (e: React.MouseEvent) => {
    e.preventDefault();
    setCheckoutMode('payment');
    setIsModalOpen(true);
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
  
  const effectivePrice = typeof product.salePrice === 'number'
    ? product.salePrice
    : typeof product.regularPrice === 'number'
      ? product.regularPrice
      : product.price;
  const discountedSubtotal = effectivePrice;
  const shippingCost = discountedSubtotal > 2999 ? 0 : 99;
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
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.tags?.map(tag => (
             <Badge key={tag} className="bg-primary text-primary-foreground">
               {tag}
            </Badge>
          ))}
        </div>
         <Button
            size="icon"
            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-background/70 backdrop-blur-sm hover:bg-background"
            onClick={handleWishlistToggle}
          >
            <Heart className={cn("h-4 w-4 text-foreground", isInWishlist && "fill-destructive text-destructive")} />
          </Button>
      </CardHeader>
      <CardContent className="flex-1 p-3 space-y-2 flex flex-col">
        <div className="flex-1 space-y-1">
            <Link href={productUrl}>
                <h3 className="font-headline font-bold text-base leading-tight group-hover:text-accent transition-colors">
                {product.name}
                </h3>
            </Link>
             <div className="flex items-baseline gap-2">
                 {typeof effectivePrice === 'number' && effectivePrice > 0 ? (
                   <>
                     <p className="text-lg font-bold text-primary">
                       ₹{Number(effectivePrice).toFixed(0)}
                     </p>
                     {typeof product.regularPrice === 'number' &&
                      typeof product.salePrice === 'number' &&
                      product.salePrice < product.regularPrice && (
                        <p className="text-sm text-muted-foreground line-through">
                          ₹{Number(product.regularPrice).toFixed(0)}
                        </p>
                     )}
                   </>
                 ) : (
                   <p className="text-sm text-muted-foreground">Price not available</p>
                 )}
            </div>
            {product.specificDescription && <p className="text-xs text-muted-foreground font-semibold">{product.specificDescription}</p>}
        </div>
        
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
                    onClick={() => addToCart(product)} 
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
          className="w-full rounded-lg"
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
