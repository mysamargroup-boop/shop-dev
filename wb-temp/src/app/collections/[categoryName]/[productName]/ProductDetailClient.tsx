
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Star, Zap, Heart, Share2, Upload, X, Truck, Info, IndianRupee, Flame, Camera } from 'lucide-react';
import type { Product, OrderItem } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { cn, slugify } from '@/lib/utils';
import WhatsAppCheckoutModal from '@/components/checkout/WhatsAppCheckoutModal';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { useToast } from '@/hooks/use-toast';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Input } from '@/components/ui/input';
import RecentlySoldWidget from './RecentlySoldWidget';
import Image from 'next/image';
import Link from 'next/link';
import { BLUR_DATA_URL } from '@/lib/constants';
import ProductInfoBadges from '@/components/products/ProductInfoBadges';
import { SiteSettings } from '@/lib/types';
import { Loader2 } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const ImageUpload = ({ onFilesChange }: { onFilesChange: (files: File[]) => void }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newFiles = [...selectedFiles, ...files].slice(0, 3); // Allow up to 3 files
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    onFilesChange(newFiles);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="my-4 p-4 border-dashed border-2 rounded-lg bg-muted/30">
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-semibold text-base">Personalize with Your Photos</h3>
          <p className="text-muted-foreground text-xs">Upload up to 3 images for customization.</p>
        </div>
         {selectedFiles.length < 3 && (
          <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-1.5 h-3.5 w-3.5" />
            Choose Files ({selectedFiles.length}/3)
          </Button>
        )}
      </div>
      
      {selectedFiles.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-3">
          {selectedFiles.map((file, index) => (
            <div key={index} className="relative aspect-square">
              <Image
                src={URL.createObjectURL(file)}
                alt={`Preview ${index + 1}`}
                fill
                className="rounded-md object-cover"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                sizes="100px"
              />
              <Button
                size="icon"
                variant="destructive"
                className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full"
                onClick={() => handleRemoveFile(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        multiple
        accept="image/png, image/jpeg, image/webp"
        onChange={handleFileChange}
        disabled={selectedFiles.length >= 3}
      />
    </div>
  );
};


export default function ProductDetailClient({ product }: { product: Product }) {
  const pathname = usePathname();
  
  const isKeychainCategory = product?.category.toLowerCase().includes('keychain');
  const minQuantity = isKeychainCategory ? 100 : 25;

  const [quantity, setQuantity] = useState(minQuantity);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [customImageFiles, setCustomImageFiles] = useState<File[]>([]);
  const [quantityType, setQuantityType] = useState<'preset' | 'custom'>('preset');
  const [customQuantity, setCustomQuantity] = useState<number | string>(minQuantity);
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const productSlug = slugify(product.name);
  const categorySlug = slugify(product.category.split(',')[0].trim());
  const currentUrl = baseUrl ? `${baseUrl}/collections/${categorySlug}/${productSlug}` : '';

  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  
  const [selectedVariant, setSelectedVariant] = useState(product?.options && product.options.length > 0 ? undefined : product?.options?.[0]?.value);
  
  useEffect(() => {
    const newMinQuantity = product?.category.toLowerCase().includes('keychain') ? 100 : 25;
    setQuantity(newMinQuantity);
    setCustomQuantity(newMinQuantity);
  }, [product?.category]);


  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  
  const isInWishlist = wishlist.some(item => item.id === product.id);

  const handleWishlistToggle = () => {
    if (isInWishlist) {
      removeFromWishlist(product.id);
      toast({ title: "Removed from Wishlist", description: `${product.name} removed from your wishlist.` });
    } else {
      addToWishlist(product);
      toast({ title: "Added to Wishlist", description: `${product.name} added to your wishlist.` });
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: product.name,
                text: product.shortDescription,
                url: currentUrl,
            });
        } catch (error) {
            console.error('Error sharing:', error);
            toast({ title: "Could not share", description: "Sharing was cancelled or failed."});
        }
    } else {
        // Fallback for browsers that don't support the Web Share API
        navigator.clipboard.writeText(currentUrl);
        toast({ title: "Link Copied", description: "Product link copied to clipboard." });
    }
  };
  
  const finalQuantity = quantityType === 'preset' ? quantity : (typeof customQuantity === 'number' ? customQuantity : parseInt(String(customQuantity), 10) || 0);

  const handleBuyNow = () => {
    if (finalQuantity < minQuantity) {
        toast({ variant: 'destructive', title: 'Invalid Quantity', description: `Minimum quantity for this item is ${minQuantity}.` });
        return;
    }
    setCheckoutMode((settings?.whatsapp_only_checkout_enabled ? 'whatsapp' : 'payment'));
    setIsModalOpen(true);
  };

  const areActionsDisabled =
    (product.options && product.options.length > 0 && !selectedVariant) ||
    finalQuantity <= 0 ||
    (finalQuantity < minQuantity);
    
  const getDiscountPercentage = (quantity: number, minQty: number) => {
    if (quantity <= minQty) {
      return 0; // No discount at or below minimum quantity
    }
    const additionalQty = quantity - minQty;
    // Start discount from the first item over the minimum
    const steps = Math.floor(additionalQty / 50);

    if (steps < 1) return 0; // No discount for first 49 items over min

    const baseDiscount = 2; 
    const stepDiscount = 1; 
    const maxDiscount = 7;
    
    const calculatedDiscount = baseDiscount + (steps - 1) * stepDiscount;
    
    return Math.min(calculatedDiscount, maxDiscount);
  };

  const discountPercentage = getDiscountPercentage(finalQuantity, minQuantity);
  const pricePerPiece = product.price * (1 - discountPercentage / 100);
  const discountedSubtotal = pricePerPiece * finalQuantity;

  const [settings, setSettings] = useState<SiteSettings | null>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/settings', { cache: 'no-store' });
        const data: SiteSettings = await res.json();
        if (res.ok && data) {
          setSettings(data);
        }
      } catch {}
    })();
  }, []);
  
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 2999;
  const shippingCost = discountedSubtotal > freeShippingThreshold ? 0 : 99;
  const totalCost = discountedSubtotal + shippingCost;

  const presetQuantities = isKeychainCategory ? [100, 200, 500] : [25, 50, 100];
  
  const deliveryMinDays = settings?.expected_delivery_min_days ?? 7;
  const deliveryMaxDays = settings?.expected_delivery_max_days ?? 15;


  const productsForCheckout: OrderItem[] = [{
    id: product.id,
    name: product.name,
    quantity: finalQuantity,
    price: pricePerPiece,
    imageUrl: product.imageUrl,
    imageHint: product.imageHint,
  }];

  const pricingTiers = [
    { qty: minQuantity, discount: 0 },
    { qty: minQuantity + 50, discount: 2 },
    { qty: minQuantity + 100, discount: 4 },
    { qty: minQuantity + 150, discount: 7 },
  ];

  return (
    <>
      <div className='text-left space-y-4'>
        <div className="flex justify-between items-start">
          <div>
            <h1 className="font-headline text-2xl font-bold lg:text-3xl">{product.name}</h1>
            <p className="text-sm text-muted-foreground font-mono mt-1">SKU: {product.id}</p>
          </div>
          <Button variant="outline" size="icon" className="flex-shrink-0" onClick={handleShare}>
              <Share2 className="h-5 w-5" />
          </Button>
        </div>
        
        {product.tags && product.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {product.tags.map(tag => (
              <Link key={tag} href={`/tags/${slugify(tag)}`}>
                <Badge variant="secondary" className="hover:bg-primary/10 hover:text-primary cursor-pointer">{tag}</Badge>
              </Link>
            ))}
          </div>
        )}

         <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            {product.rating && product.reviewCount && (
                <div className="flex items-center gap-1">
                    <div className="flex items-center gap-0.5 text-green-600">
                        <Star className="w-4 h-4 fill-current"/>
                        <Star className="w-4 h-4 fill-current"/>
                        <Star className="w-4 h-4 fill-current"/>
                        <Star className="w-4 h-4 fill-current"/>
                        <Star className="w-4 h-4 fill-current"/>
                    </div>
                    <span className="font-semibold text-foreground">{product.rating}</span>
                    <span className="text-muted-foreground">&bull;</span>
                    <span className="text-muted-foreground underline cursor-pointer">{product.reviewCount} Reviews</span>
                </div>
            )}
             <span className="text-muted-foreground">&bull;</span>
              <Link href="/samples" className="flex items-center gap-1 text-muted-foreground underline hover:text-primary">
                <Camera className="h-4 w-4" />
                Customer Gallery
            </Link>
        </div>

        <div className="space-y-2">
            <div className="flex items-baseline gap-2">
                <p className="text-3xl font-bold text-foreground">₹{pricePerPiece.toFixed(2)}<span className="text-base font-normal text-muted-foreground">/piece</span></p>
                {discountPercentage > 0 && (
                    <p className="text-lg font-bold text-destructive line-through">₹{product.price.toFixed(2)}</p>
                )}
                 <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button>
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Price includes all taxes.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
            </div>
        </div>
        
        <div className="flex items-center gap-3 p-3 rounded-lg border bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300">
          <Truck className="h-6 w-6" />
          <div>
            <p className="font-semibold text-sm">Estimated Delivery: {deliveryMinDays}-{deliveryMaxDays} days</p>
             {settings?.free_shipping_threshold ? (
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Free shipping on orders over ₹{settings.free_shipping_threshold}.</p>
             ) : (
                <p className="text-xs text-muted-foreground">Depends on order quantity & customization</p>
             )}
          </div>
        </div>
        
        <RecentlySoldWidget />
        {product.shortDescription && <p className="text-sm text-muted-foreground">{product.shortDescription}</p>}
        
        
        {product.options && product.options.length > 0 && (
          <div className="my-6">
            <h3 className="font-semibold mb-3">Material:</h3>
            <RadioGroup value={selectedVariant} onValueChange={setSelectedVariant} className="flex flex-wrap gap-3">
              {product.options.map(option => (
                <div key={option.value}>
                  <RadioGroupItem value={option.value} id={`v-${option.value}`} className="sr-only" />
                  <Label 
                    htmlFor={`v-${option.value}`}
                    className={cn(
                      "flex items-center justify-center rounded-md border-2 border-muted bg-popover px-4 py-2 text-foreground hover:bg-accent/10 cursor-pointer transition-colors",
                      selectedVariant === option.value && "border-primary bg-primary/10"
                    )}
                  >
                   <span className="font-bold text-lg">{option.label}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
        )}
        
        <div className="flex flex-col gap-4 pt-4 border-t">
            <div className="space-y-3">
                <Label className="font-semibold">Select Quantity</Label>
                <div className="flex flex-wrap items-center gap-2">
                    {presetQuantities.map(q => (
                        <Button 
                            key={q}
                            type="button"
                            variant={quantity === q && quantityType === 'preset' ? "default" : "outline"}
                            className="rounded-lg"
                            onClick={() => {
                                setQuantity(q);
                                setQuantityType('preset');
                            }}
                        >
                            {q}
                        </Button>
                    ))}
                    <div className="relative">
                        <Input
                            type="number"
                            min={minQuantity}
                            placeholder="Custom"
                            value={customQuantity}
                            onFocus={() => setQuantityType('custom')}
                            onChange={(e) => {
                                setQuantityType('custom');
                                const val = e.target.value;
                                setCustomQuantity(val === '' ? '' : Math.max(minQuantity, parseInt(val, 10) || minQuantity));
                            }}
                            className={cn(
                                "w-28 text-center font-semibold rounded-lg bg-muted/50",
                                quantityType === 'custom' && "border-primary ring-2 ring-primary bg-background"
                            )}
                        />
                    </div>
                     <Button variant="ghost" size="icon" onClick={handleWishlistToggle} className="ml-auto">
                        <Heart className={cn("h-6 w-6", isInWishlist ? "fill-destructive text-destructive" : "text-foreground")} />
                    </Button>
                </div>
            </div>
            
            <div className="mt-2 rounded-lg border-2 border-dashed border-green-500/50 bg-green-500/5 p-3">
                <div className="flex items-center justify-start gap-2 text-green-700 dark:text-green-300">
                    <Info className="h-5 w-5" />
                    <div className="font-semibold text-sm">
                        Minimum order: <span className="font-bold">{minQuantity}</span> pieces.
                        <span className="block text-xs font-bold bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">Save up to 7%—the more you buy, the more you save!</span>
                    </div>
                </div>
            </div>


             {areActionsDisabled && finalQuantity < minQuantity && (
              <p className="text-sm text-destructive font-semibold">
                {`Minimum quantity for this item is ${minQuantity}.`}
              </p>
             )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <Button size="lg" onClick={() => addToCart(product, finalQuantity)} className="w-full bg-primary hover:bg-primary/80 rounded-lg" disabled={areActionsDisabled}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                 <Button size="lg" onClick={handleBuyNow} className="w-full bg-gradient-to-r from-red-600 to-red-800 hover:from-red-700 hover:to-red-900 text-white shine-effect rounded-lg" disabled={areActionsDisabled}>
                  <Zap className="mr-2 h-5 w-5 text-yellow-300" />
                  Buy Now
                </Button>
            </div>
        </div>

        <div className="my-6 text-left pt-4 border-t">
             <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger className='text-xl font-headline font-semibold hover:no-underline'>
                    Description
                  </AccordionTrigger>
                  <AccordionContent>
                     <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.description }} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-pricing">
                  <AccordionTrigger className='text-xl font-headline font-semibold hover:no-underline'>
                    Bulk Pricing
                  </AccordionTrigger>
                  <AccordionContent>
                      <p className="text-sm text-muted-foreground mb-4">The price per piece decreases as you order more. Here's a breakdown of the discounts:</p>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Quantity</TableHead>
                            <TableHead>Discount</TableHead>
                            <TableHead className="text-right">Price per Piece</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {pricingTiers.map(tier => (
                            <TableRow key={tier.qty}>
                              <TableCell className="font-medium">{tier.qty}+</TableCell>
                              <TableCell>{tier.discount > 0 ? `${tier.discount}%` : '—'}</TableCell>
                              <TableCell className="text-right font-semibold">₹{(product.price * (1 - tier.discount / 100)).toFixed(2)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  </AccordionContent>
                </AccordionItem>
                {product.allowImageUpload && <ImageUpload onFilesChange={setCustomImageFiles} />}
                <AccordionItem value="item-2">
                    <AccordionTrigger className='text-xl font-headline font-semibold hover:no-underline'>
                        Features
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                        {product.features.map((feature, index) => (
                            <li key={index}>
                            {feature}
                            </li>
                        ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                    <AccordionTrigger className='text-xl font-headline font-semibold hover:no-underline'>
                        Specifications
                    </AccordionTrigger>
                    <AccordionContent>
                        <table className="w-full text-sm">
                            <tbody>
                                <tr className="border-b">
                                    <td className="py-2 text-muted-foreground">SKU</td>
                                    <td className="py-2 font-semibold text-right">{product.id}</td>
                                </tr>
                                <tr className="border-b">
                                    <td className="py-2 text-muted-foreground">Manufacturer</td>
                                    <td className="py-2 font-semibold text-right">
                                        Shreeji Art Creation, Woody Business. Retail: <a href="https://woody.co.in" target="_blank" rel="noopener noreferrer" className="text-primary underline">Woody</a>
                                    </td>
                                </tr>
                                {product.weight && (
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Weight</td>
                                        <td className="py-2 font-semibold text-right">{product.weight}</td>
                                    </tr>
                                )}
                                {product.dimensions && (
                                    <tr>
                                        <td className="py-2 text-muted-foreground">Dimensions</td>
                                        <td className="py-2 font-semibold text-right">{product.dimensions}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </AccordionContent>
                </AccordionItem>
             </Accordion>
             <ProductInfoBadges />
        </div>
        
      </div>
      <WhatsAppCheckoutModal 
        isOpen={isModalOpen} 
        onOpenChange={setIsModalOpen}
        checkoutMode={checkoutMode}
        checkoutInput={{
            sku: product.id,
            productName: `${product.name}${selectedVariant ? ` (${product.options?.find(o => o.value === selectedVariant)?.label})` : ''}`,
            productDescription: product.description,
            originalPrice: product.price * finalQuantity,
            productPrice: discountedSubtotal,
            discountPercentage: 0,
            quantity: finalQuantity,
            shippingCost: shippingCost,
            totalCost: totalCost,
            productUrls: currentUrl ? [currentUrl] : [],
            products: productsForCheckout,
            customImageFiles: customImageFiles,
        }}
      />
      
      <div className={cn(
        "fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t shadow-lg transition-transform duration-300 ease-in-out z-40 pb-16 md:pb-0",
        showStickyBar ? 'translate-y-0' : 'translate-y-full'
      )}>
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-3 overflow-hidden">
                  <Image src={product.imageUrl} alt={product.imageAlt || product.name} width={40} height={40} className="rounded-md object-cover flex-shrink-0" data-ai-hint={product.imageHint} placeholder="blur" blurDataURL={BLUR_DATA_URL} sizes="40px" />
                  <div className="overflow-hidden">
                      <p className="font-semibold text-sm truncate">{product.name}</p>
                      <p className="text-muted-foreground text-xs">₹{pricePerPiece.toFixed(2)}</p>
                  </div>
              </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 w-20">
                <Input
                    type="number"
                    min={minQuantity}
                    value={finalQuantity}
                    onChange={(e) => {
                      const val = Math.max(minQuantity, parseInt(e.target.value, 10) || minQuantity);
                      if (presetQuantities.includes(val)) {
                        setQuantityType('preset');
                        setQuantity(val);
                      } else {
                        setQuantityType('custom');
                        setCustomQuantity(val);
                      }
                    }}
                    className="w-full h-9 text-center"
                />
              </div>
              <Button onClick={() => addToCart(product, finalQuantity)} variant="outline" className="hidden xs:inline-flex rounded-lg" disabled={areActionsDisabled}>
                 Add to Cart
              </Button>
              <Button onClick={handleBuyNow} size="icon" className="rounded-lg sm:hidden" disabled={areActionsDisabled}>
                <Zap className="h-4 w-4 text-yellow-300" />
              </Button>
               <Button onClick={handleBuyNow} className="rounded-lg hidden sm:inline-flex" disabled={areActionsDisabled}>
                 <Zap className="mr-2 h-4 w-4 text-yellow-300" />
                 Buy Now
              </Button>
               <Button onClick={() => addToCart(product, finalQuantity)} size="icon" className="xs:hidden" disabled={areActionsDisabled}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
              
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
