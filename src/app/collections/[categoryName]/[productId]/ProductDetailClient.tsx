
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ShoppingCart, Star, Zap, Heart, Share2, Upload, X, Truck, Info } from 'lucide-react';
import type { Product, OrderItem, SiteSettings } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { cn, slugify } from '@/lib/utils';
import CheckoutModal from '@/components/checkout/CheckoutModal';
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
import RecentlySoldWidget from '@/components/home/RecentlySoldWidget';
import Image from 'next/image';
import { BLUR_DATA_URL } from '@/lib/constants';
import ProductInfoBadges from '@/components/products/ProductInfoBadges';
import { getSiteSettings } from '@/lib/actions';
import ProductReviews from '@/components/products/ProductReviews';
import Link from 'next/link';

const ImageUpload = ({ onFilesChange }: { onFilesChange: (files: File[]) => void }) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const files = Array.from(event.target.files);
      const newFiles = [...selectedFiles, ...files].slice(0, 3);
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);
    }
  };

  const handleRemoveFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFiles(newFiles);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  return (
    <div className="my-6 p-4 border-dashed border-2 rounded-lg text-center">
      <h3 className="font-semibold mb-3 text-lg">Personalize with Your Photos</h3>
      <p className="text-muted-foreground text-sm mb-4">Upload up to 3 images for customization.</p>
      
      <div className="grid grid-cols-3 gap-2 mb-4">
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
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
              onClick={() => handleRemoveFile(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {selectedFiles.length < 3 && (
        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
          <Upload className="mr-2 h-4 w-4" />
          Choose Files ({selectedFiles.length}/3)
        </Button>
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
  
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkoutMode, setCheckoutMode] = useState<'whatsapp' | 'payment'>('payment');
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [customImages, setCustomImages] = useState<File[]>([]);
  const [quantityType, setQuantityType] = useState<'preset' | 'custom'>('preset');
  const [customQuantity, setCustomQuantity] = useState<number | string>(1);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [isClient, setIsClient] = useState(false);
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || '';
  const currentUrl = isClient ? window.location.href : (baseUrl ? `${baseUrl}${pathname}` : '');

  const { addToCart } = useCart();
  const { wishlist, addToWishlist, removeFromWishlist } = useWishlist();
  const { toast } = useToast();
  
  const [selectedVariant, setSelectedVariant] = useState(product?.options && product.options.length > 0 ? undefined : product?.options?.[0]?.value);
  const [selectedColor, setSelectedColor] = useState(product?.colorOptions?.[0]?.value || '');
  
  useEffect(() => {
    setIsClient(true);
    getSiteSettings().then(setSettings);
  }, []);


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

  const handleBuyNow = () => {
    if (!isClient) return;
    const effectiveCheckoutMode = settings?.whatsapp_only_checkout_enabled ? 'whatsapp' : 'payment';
    setCheckoutMode(effectiveCheckoutMode);
    setIsModalOpen(true);
  };

  const finalQuantity = quantityType === 'preset' ? quantity : (typeof customQuantity === 'number' ? customQuantity : 0);

  const areActionsDisabled =
    (product.options && product.options.length > 0 && !selectedVariant) ||
    (product.colorOptions && product.colorOptions.length > 0 && !selectedColor) ||
    (product.allowImageUpload && customImages.length === 0) ||
    finalQuantity <= 0;

  const discountedSubtotal = product.price * finalQuantity;
  const freeShippingThreshold = settings?.free_shipping_threshold ?? 2999;
  const shippingCost = discountedSubtotal > freeShippingThreshold ? 0 : 99;
  const totalCost = discountedSubtotal + shippingCost;

  const presetQuantities = [1, 2, 5, 10];

  const deliveryMinDays = settings?.expected_delivery_min_days ?? 7;
  const deliveryMaxDays = settings?.expected_delivery_max_days ?? 15;


  const productsForCheckout: OrderItem[] = [{
    id: product.id,
    name: product.name,
    quantity: finalQuantity,
    price: product.price,
    imageUrl: product.imageUrl,
    imageHint: product.imageHint || '',
  }];

  return (
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
        
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {product.category && (
            <Link href={`/collections/${slugify(product.category.split(',')[0].trim())}`}>
              <Badge variant="outline">{product.category}</Badge>
            </Link>
          )}
          {product.subCategory && (
            <Badge variant="secondary">{product.subCategory}</Badge>
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
        </div>

        <div className="space-y-2">
            <div className="flex items-baseline gap-2">
                {typeof product.salePrice === 'number' && typeof product.regularPrice === 'number' && product.salePrice < product.regularPrice ? (
                  <div>
                    <p className="text-3xl font-bold text-accent">₹{product.salePrice.toFixed(0)}</p>
                    <p className="text-lg line-through text-muted-foreground">₹{product.regularPrice.toFixed(0)}</p>
                  </div>
  ) : (
                  <p className="text-3xl font-bold text-foreground">
                    {typeof product.regularPrice === 'number'
                      ? `₹${product.regularPrice.toFixed(0)}`
                      : `₹${product.price.toFixed(0)}`}
                  </p>
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

        <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
          <Truck className="h-6 w-6 text-primary" />
          <div>
            <p className="font-semibold text-sm">Estimated Delivery: {deliveryMinDays}-{deliveryMaxDays} days</p>
            {settings?.free_shipping_threshold && (
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400">Free shipping on orders over ₹{settings.free_shipping_threshold}.</p>
            )}
          </div>
        </div>
        
        <RecentlySoldWidget />

        {product.shortDescription && <p className="text-muted-foreground">{product.shortDescription}</p>}
        
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

        {product.colorOptions && product.colorOptions.length > 0 && (
          <div className="my-6">
            <h3 className="font-semibold mb-3">Color:</h3>
            <div className="flex flex-wrap gap-3">
              {product.colorOptions.map((colorOption) => (
                <button
                  key={colorOption.value}
                  onClick={() => setSelectedColor(colorOption.value)}
                  className={cn(
                    "relative w-12 h-12 rounded-full border-4 transition-all hover:scale-110",
                    selectedColor === colorOption.value 
                      ? "border-primary ring-2 ring-primary/30" 
                      : "border-gray-300"
                  )}
                  style={{ backgroundColor: colorOption.value }}
                  title={colorOption.name}
                >
                  {selectedColor === colorOption.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  )}
                </button>
              ))}
            </div>
            {selectedColor && (
              <p className="text-sm text-muted-foreground mt-2">
                Selected: {product.colorOptions.find(c => c.value === selectedColor)?.name}
              </p>
            )}
          </div>
        )}

        {product.allowImageUpload && <ImageUpload onFilesChange={setCustomImages} />}
        
        {product.allowImageUpload && customImages.length > 0 && (
          <input type="hidden" name="customerImages" value={JSON.stringify(customImages.map(f => f.name))} />
        )}
        
        <div className="flex flex-col gap-4 pt-4">
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
                            min="1"
                            placeholder="Custom"
                            value={customQuantity}
                            onFocus={() => setQuantityType('custom')}
                            onChange={(e) => {
                                setQuantityType('custom');
                                const val = e.target.value;
                                setCustomQuantity(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                            }}
                            className={cn(
                                "w-28 text-center font-semibold rounded-lg bg-muted/50",
                                quantityType === 'custom' && "border-primary ring-2 ring-primary bg-background"
                            )}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                <Button size="lg" onClick={() => addToCart(product, finalQuantity)} className="w-full bg-primary hover:bg-primary/80 rounded-lg" disabled={areActionsDisabled}>
                  <ShoppingCart className="mr-2 h-5 w-5" /> Add to Cart
                </Button>
                 <Button size="lg" onClick={handleBuyNow} className="w-full bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-700 hover:to-teal-800 text-white shine-effect rounded-lg" disabled={areActionsDisabled}>
                  <Zap className="mr-2 h-5 w-5 text-yellow-300" /> Buy Now
                </Button>
            </div>
        </div>
        
        <div className="my-6 text-left pt-4 border-t">
             <Accordion type="single" collapsible defaultValue="item-1">
                <AccordionItem value="item-1">
                  <AccordionTrigger className='text-lg font-headline font-semibold hover:no-underline'>
                    Description
                  </AccordionTrigger>
                  <AccordionContent>
                     <div className="prose dark:prose-invert" dangerouslySetInnerHTML={{ __html: product.description }} />
                  </AccordionContent>
                </AccordionItem>
                <AccordionItem value="item-2">
                    <AccordionTrigger className='text-lg font-headline font-semibold hover:no-underline'>
                        Features
                    </AccordionTrigger>
                    <AccordionContent>
                        <ul className="space-y-3 list-disc pl-5 text-muted-foreground">
                        {(product.features || []).map((feature, index) => (
                            <li key={index}>
                            {feature}
                            </li>
                        ))}
                        </ul>
                    </AccordionContent>
                </AccordionItem>
                 <AccordionItem value="item-3">
                    <AccordionTrigger className='text-lg font-headline font-semibold hover:no-underline'>
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
                                        Nemaonline
                                    </td>
                                </tr>
                                {product.weightGrams && (
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Weight</td>
                                        <td className="py-2 font-semibold text-right">{product.weightGrams}g</td>
                                    </tr>
                                )}
                                {product.dimensionsCm && (
                                    <tr>
                                        <td className="py-2 text-muted-foreground">Dimensions</td>
                                        <td className="py-2 font-semibold text-right">{product.dimensionsCm.length} x {product.dimensionsCm.width} x {product.dimensionsCm.height} cm</td>
                                    </tr>
                                )}
                                {product.material && (
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Material</td>
                                        <td className="py-2 font-semibold text-right">{product.material}</td>
                                    </tr>
                                )}
                                {product.color && (!product.colorOptions || product.colorOptions.length === 0) && (
                                    <tr className="border-b">
                                        <td className="py-2 text-muted-foreground">Color</td>
                                        <td className="py-2 font-semibold text-right">{product.color}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </AccordionContent>
                </AccordionItem>
             </Accordion>
             <ProductInfoBadges />
        </div>
        
        {/* Product Reviews Section */}
        <ProductReviews productId={product.id} />
        
        <div className="mt-8">
          <CheckoutModal 
            isOpen={isModalOpen} 
            onOpenChange={setIsModalOpen}
            checkoutMode={checkoutMode}
            checkoutInput={{
              sku: product.id,
              productName: `${product.name}${selectedVariant ? ` (${product.options?.find(o => o.value === selectedVariant)?.label})` : ''}`,
              productDescription: product.description,
              originalPrice: totalCost,
              productPrice: totalCost,
              discountPercentage: 0,
              quantity: finalQuantity,
              shippingCost: shippingCost,
              totalCost: totalCost,
              productUrls: currentUrl ? [currentUrl] : [],
              products: productsForCheckout,
            }}
          />
        </div>
      
      </div>
      
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
                      {typeof product.salePrice === 'number' && typeof product.regularPrice === 'number' && product.salePrice < product.regularPrice ? (
                        <div className="flex items-center gap-2">
                          <p className="text-accent text-xs font-semibold">₹{product.salePrice.toFixed(2)}</p>
                          <p className="text-muted-foreground text-[11px] line-through">₹{product.regularPrice.toFixed(2)}</p>
                        </div>
                      ) : (
                        <p className="text-muted-foreground text-xs">
                          {typeof product.regularPrice === 'number'
                            ? `₹${product.regularPrice.toFixed(2)}`
                            : `₹${product.price.toFixed(2)}`}
                        </p>
                      )}
                  </div>
              </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="flex items-center gap-1 w-20">
                <Input
                    type="number"
                    min="1"
                    value={finalQuantity}
                    onChange={(e) => {
                      const val = Math.max(1, parseInt(e.target.value, 10) || 1);
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
               <Button onClick={handleBuyNow} size="icon" className="xs:hidden rounded-lg bg-green-600 hover:bg-green-700" disabled={areActionsDisabled}>
                <Zap className="h-4 w-4 text-yellow-300" />
              </Button>
               <Button onClick={handleBuyNow} className="hidden xs:inline-flex rounded-lg bg-green-600 hover:bg-green-700" disabled={areActionsDisabled}>
                <Zap className="mr-2 h-4 w-4 text-yellow-300" /> Buy Now
              </Button>
               <Button onClick={() => addToCart(product, finalQuantity)} size="icon" className="xs:hidden" disabled={areActionsDisabled}>
                <ShoppingCart className="h-4 w-4" />
              </Button>
              
            </div>
          </div>
        </div>
      </div>
      </div>
  );
}
