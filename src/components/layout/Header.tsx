
"use client";

import Link from 'next/link';
import { ShoppingCart, Menu, Search, Gift, Box, Brush, Info, ShoppingBag, LayoutGrid, Heart, Mail, KeyRound, Smartphone, ImageIcon, Moon, Sun, Sparkles, User, LogOut, Facebook, Instagram, Youtube, Linkedin, Twitter } from 'lucide-react';
import Logo from '@/components/icons/Logo';
import { Button } from '@/components/ui/button';
import useCart from '@/hooks/use-cart';
import useWishlist from '@/hooks/use-wishlist';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '../ui/sheet';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '../ui/input';
import { usePathname } from 'next/navigation';
import { ScrollArea } from '../ui/scroll-area';
import { cn } from '@/lib/utils';
import type { Product, Category, SiteSettings } from '@/lib/types';
import Image from 'next/image';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu"
import { BLUR_DATA_URL } from '@/lib/constants';
import { useTheme } from 'next-themes';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { getProducts, getCategories, getSiteSettings as getSettings } from '@/lib/data-async';
import { getHeaderLinks as getNavLinks } from '@/lib/data-supabase';
import { useAuth } from '@/lib/auth';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

const Marquee = () => {
    const messages = ["🎉 Great discount offer depends on quantity 💰", "Custom Engraving Available on All Products", "Handcrafted with Love"];
    const marqueeContent = messages.join(" • ");
    return (
        <div className="bg-yellow-400 text-black py-1 text-center text-sm overflow-hidden">
            <div className="marquee">
               <span className="mx-4">{marqueeContent}</span>
               <span className="mx-4">{marqueeContent}</span>
            </div>
        </div>
    )
}

const DarkModeToggle = () => {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const isDark = theme === 'dark';

    return (
        <div className="flex items-center justify-between rounded-lg border p-3">
             <div className="flex items-center space-x-2">
                {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <Label htmlFor="dark-mode-toggle" className="font-semibold text-foreground">
                    Dark Mode
                </Label>
            </div>
            <Switch
                id="dark-mode-toggle"
                checked={isDark}
                onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
        </div>
    );
};

const Header = () => {
  const { cartCount, isLoaded: cartLoaded } = useCart();
  const { wishlistCount, isLoaded: wishlistLoaded } = useWishlist();
  const { user } = useAuth();
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [headerLinks, setHeaderLinks] = useState<any[]>([]);
  const [siteSettings, setSiteSettings] = useState<SiteSettings>({});

  const pathname = usePathname() || '';

  useEffect(() => {
    async function fetchData() {
        const [products, categories, settings, navLinks] = await Promise.all([
          getProducts(),
          getCategories(),
          getSettings(),
          getNavLinks()
        ]);
        
        setAllProducts(products);
        setAllCategories(categories);
        setSiteSettings(settings);
        // Correctly transform the 'All Gifts' link to 'Shop'
        const transformedLinks = (navLinks || []).map(link => {
            if (link.label === 'All Gifts') {
                return { ...link, label: 'Shop', href: '/shop', special: true };
            }
            return link;
        });
        setHeaderLinks(transformedLinks);
    }
    fetchData();
  }, [])


  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
    if (query.trim().length > 1) {
      const lowerCaseQuery = query.toLowerCase();
      const results = allProducts.filter(p => 
        p.name.toLowerCase().includes(lowerCaseQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerCaseQuery)) ||
        p.category.toLowerCase().includes(lowerCaseQuery) ||
        (p.tags && p.tags.some(tag => tag.toLowerCase().includes(lowerCaseQuery)))
      );
      setSearchResults(results);
      setIsSearchOpen(true);
    } else {
      setSearchResults([]);
      setIsSearchOpen(false);
    }
  }, [allProducts]);

  useEffect(() => {
    setIsSheetOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
  }, [pathname]);

  const isCountsLoaded = cartLoaded && wishlistLoaded;

  const MobileNavContent = () => {
    
    const handleMobileSearch = (query: string) => {
        handleSearch(query);
    }
      
    return (
    <div className="flex flex-col h-full">
        <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
            <Input 
              placeholder="Search For Gifts..." 
              className="pl-10 bg-muted"
              defaultValue={searchQuery}
              onChange={(e) => handleMobileSearch(e.target.value)}
              onFocus={(e) => handleMobileSearch(e.target.value)}
            />
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute top-full mt-2 w-full p-2 bg-popover border rounded-md shadow-lg z-20">
                  <ScrollArea className="max-h-60">
                    <div className="space-y-1">
                        {searchResults.map(product => {
                            const categorySlug = product.category.split(',')[0].trim().toLowerCase().replace(/ /g, '-');
                            return (
                            <Link 
                              key={product.id} 
                              href={`/collections/${categorySlug}/${product.name}`} 
                              className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/10"
                              onClick={() => setIsSheetOpen(false)}
                            >
                                <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover"/>
                                <div>
                                    <p className="font-semibold text-sm">{product.name}</p>
                                    <p className="text-sm text-muted-foreground">₹{product.price.toFixed(2)}</p>
                                </div>
                            </Link>
                        )})}
                    </div>
                  </ScrollArea>
              </div>
          )}
        </div>
        <ScrollArea className="flex-1">
          <nav className="flex flex-col gap-1 pr-4">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="categories">
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-3 text-sm font-semibold text-foreground group-hover:text-accent transition-colors uppercase">
                      <LayoutGrid className="h-5 w-5 text-primary"/>
                      Categories
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                    <div className="pl-6 space-y-0.5">
                      {allCategories.map(category => (
                          <Link key={category.id} href={category.linkUrl || `/collections/${category.id}`} className="flex items-center gap-3 py-2 rounded-md hover:bg-muted/50" onClick={() => setIsSheetOpen(false)}>
                            <Image src={category.imageUrl} alt={category.name} width={24} height={24} className="rounded-md object-cover w-6 h-6"/>
                            <p className="font-medium text-sm text-muted-foreground">{category.name}</p>
                          </Link>
                      ))}
                    </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
            {
              headerLinks.filter(l => !l.isMegaMenu).map((link) => {
                  const isActive = pathname.startsWith(link.href);
                  const specialClassName = link.label === 'Our Story'
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                      : "bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent";
                  
                  const Icon = link.href.includes('keychains') ? KeyRound :
                              link.href.includes('wall-hangings') ? ImageIcon :
                              link.href.includes('mobile-stands') ? Smartphone :
                              link.label === 'Shop' ? ShoppingBag :
                              link.href.includes('our-story') ? Info :
                              link.href.includes('connect') ? Mail : ShoppingBag;

                  return (
                  <Button key={link.label} variant="ghost" asChild className="h-auto p-2 hover:bg-transparent group justify-start" data-active={isActive}>
                      <Link href={link.href} className="flex items-center gap-3">
                      <div className="h-6 w-6 flex items-center justify-center text-primary group-hover:text-foreground group-data-[active=true]:text-accent"><Icon className="h-5 w-5" /></div>
                      <span className={cn(
                          "text-sm font-semibold text-foreground group-hover:text-accent transition-colors uppercase",
                          link.special ? specialClassName :
                          (isActive) && "bg-gradient-to-r from-destructive to-accent bg-clip-text text-transparent"
                      )}>
                          {link.label}
                      </span>
                      </Link>
                  </Button>
              )})
              }
          </nav>
        </ScrollArea>
        <div className="mt-auto space-y-4 pt-4 border-t">
            {siteSettings.social_instagram || siteSettings.social_facebook ? (
                 <div className="flex items-center justify-center gap-6 mt-4">
                  {siteSettings.social_facebook && (
                    <Link href={siteSettings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Facebook size={20} />
                    </Link>
                  )}
                  {siteSettings.social_instagram && (
                    <Link href={siteSettings.social_instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Instagram size={20} />
                    </Link>
                  )}
                  {siteSettings.social_youtube && (
                    <Link href={siteSettings.social_youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Youtube size={20} />
                    </Link>
                  )}
                  {siteSettings.social_linkedin && (
                    <Link href={siteSettings.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Linkedin size={20} />
                    </Link>
                  )}
                  {siteSettings.social_twitter && (
                    <Link href={siteSettings.social_twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Twitter size={20} />
                    </Link>
                  )}
                </div>
            ) : null}

            {user && (
              <Button variant="outline" asChild className="w-full justify-start">
                  <Link href="/sr-admin" className="flex items-center gap-2">
                    <User className="h-5 w-5" /> Admin Panel
                  </Link>
              </Button>
            )}
            <DarkModeToggle />
        </div>
    </div>
  )};

  const DesktopNavContent = () => {
    const isCollectionsActive = pathname === '/collections';
    return (
        <NavigationMenu>
        <NavigationMenuList>
            {headerLinks.map((link) => {
            const isActive = pathname === link.href || (link.href !== '/collections' && pathname.startsWith(link.href) && !link.isMegaMenu);
            const specialClassName = link.label === 'Our Story'
                ? "bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent"
                : "bg-gradient-to-r from-red-600 to-orange-500 bg-clip-text text-transparent";

            if (link.isMegaMenu) {
                return (
                <NavigationMenuItem key={link.label}>
                    <NavigationMenuTrigger className={cn(
                        navigationMenuTriggerStyle(),
                        "h-auto p-2 bg-transparent hover:bg-transparent focus:bg-transparent data-[state=open]:bg-transparent text-sm font-semibold text-foreground hover:text-accent transition-colors uppercase"
                    )}>
                         <span className={cn(isCollectionsActive && "stylish-underline")}>{link.label}</span>
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 w-screen max-w-sm md:max-w-xl lg:max-w-3xl">
                            {allCategories.map(category => (
                            <Link key={category.id} href={category.linkUrl || `/collections/${category.id}`} className="group block rounded-lg p-2 hover:bg-muted/50">
                                <div className="aspect-video relative mb-2 overflow-hidden rounded-md">
                                    <Image 
                                        src={category.imageUrl} 
                                        alt={category.name} 
                                        fill 
                                        className="object-cover group-hover:scale-105 transition-transform" 
                                        data-ai-hint={category.imageHint}
                                        sizes="20vw"
                                        placeholder="blur"
                                        blurDataURL={BLUR_DATA_URL}
                                    />
                                </div>
                                <p className="font-semibold text-sm text-center text-foreground group-hover:text-primary">{category.name}</p>
                            </Link>
                            ))}
                        </div>
                    </NavigationMenuContent>
                </NavigationMenuItem>
                );
            }
            return (
                <NavigationMenuItem key={link.label}>
                <Link href={link.href} legacyBehavior passHref>
                    <NavigationMenuLink className={cn(
                    navigationMenuTriggerStyle(),
                    "h-auto p-2 bg-transparent hover:bg-transparent focus:bg-transparent text-sm font-semibold text-foreground hover:text-accent transition-colors uppercase"
                    )}>
                    <span className={cn(
                        link.special ? specialClassName : (isActive && "bg-gradient-to-r from-destructive to-accent bg-clip-text text-transparent"),
                        isActive && !link.special && "stylish-underline"
                    )}>
                        {link.label}
                    </span>
                    </NavigationMenuLink>
                </Link>
                </NavigationMenuItem>
            );
            })}
        </NavigationMenuList>
        </NavigationMenu>
    );
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <Marquee />
      <div className="container mx-auto px-4">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center w-1/3">
             <div className="md:hidden mr-2">
              <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-auto w-auto p-1 group hover:bg-transparent hover:text-accent [&_svg]:!size-6">
                    <Menu size={22} />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="flex flex-col">
                  <SheetHeader className="border-b pb-4">
                    <SheetTitle className="flex items-center justify-center">
                      <Logo className="h-8 w-auto"/>
                    </SheetTitle>
                  </SheetHeader>
                  <MobileNavContent />
                </SheetContent>
              </Sheet>
            </div>
            <div className="hidden md:flex relative">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                    <Input 
                        placeholder="Search for gifts..." 
                        className="pl-10 w-64 bg-background"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={(e) => handleSearch(e.target.value)}
                    />
                </div>
                 {isSearchOpen && searchResults.length > 0 && (
                    <div className="absolute top-full mt-2 w-80 p-2 bg-popover border rounded-md shadow-lg z-20">
                        <ScrollArea className="max-h-80">
                          <div className="space-y-1">
                              {searchResults.map(product => {
                                  const categorySlug = product.category.split(',')[0].trim().toLowerCase().replace(/ /g, '-');
                                  return (
                                  <Link key={product.id} href={`/collections/${categorySlug}/${product.name}`} className="flex items-center gap-3 p-2 rounded-md hover:bg-accent/10">
                                      <Image src={product.imageUrl} alt={product.name} width={40} height={40} className="rounded-md object-cover"/>
                                      <div>
                                          <p className="font-semibold text-sm">{product.name}</p>
                                          <p className="text-sm text-muted-foreground">₹{product.price.toFixed(2)}</p>
                                      </div>
                                  </Link>
                              )})}
                          </div>
                        </ScrollArea>
                    </div>
                )}
            </div>
          </div>

          <div className="flex justify-center w-auto md:w-1/3">
            <Link href="/" className="flex items-center gap-2">
              <Logo />
            </Link>
          </div>

          <div className="flex items-center justify-end w-1/3">
            <div className="flex items-center gap-2 md:gap-4">
                <Button variant="ghost" size="icon" asChild className="h-auto w-auto p-1 group hover:bg-transparent [&_svg]:!size-6">
                  <Link href="/wishlist" aria-label="Wishlist" className="relative flex items-center justify-center">
                    <Heart size={22} className="text-foreground group-hover:text-accent transition-colors"/>
                    {isCountsLoaded && wishlistCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-xs text-accent-foreground">
                        {wishlistCount}
                      </span>
                    )}
                  </Link>
                </Button>
                <Button variant="ghost" size="icon" asChild className="h-auto w-auto p-1 group hover:bg-transparent [&_svg]:!size-6">
                <Link href="/cart" aria-label="Shopping Cart" className="relative flex items-center justify-center">
                    <ShoppingCart size={22} className="text-foreground group-hover:text-primary transition-colors"/>
                    {isCountsLoaded && cartCount > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                        {cartCount}
                    </span>
                    )}
                </Link>
                </Button>
            </div>
          </div>
        </div>
      </div>
      <div className="hidden md:flex justify-center border-t">
        <DesktopNavContent />
      </div>
    </header>
  );
};

export default Header;
