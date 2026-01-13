
"use client";

import Link from 'next/link';
import { Facebook, Instagram, Youtube, Linkedin, ArrowRight, Twitter } from 'lucide-react';
import Logo from '../icons/Logo';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';

export const FooterContent = ({ settings, allCategories }: { settings: any, allCategories: any[] }) => {
  const shopLinks = allCategories.slice(0, 4).map(c => ({ href: `/collections/${c.id}`, label: c.name }));
  shopLinks.push({ href: '/offers', label: 'Special Offers' });

  const linkSections = [
      {
        title: 'Shop',
        links: shopLinks,
      },
      {
        title: 'About',
        links: [
          { href: '/our-story', label: 'Our Story' },
          { href: '/blog', label: 'Blog' },
          { href: '/connect', label: 'Contact Us' },
        ],
      },
      {
        title: 'Legacy',
        links: [
            { href: '/career', label: 'Careers' },
            { href: '/terms', label: 'Terms & Conditions' },
            { href: '/privacy', label: 'Privacy Policy' },
            { href: '/shipping', label: 'Shipping Policy' },
            { href: '/pricing', label: 'Pricing' },
            { href: '/returns-and-refunds', label: 'Returns & Refunds' },
        ],
      },
  ];

  return (
    <footer className="bg-primary/5 border-t mt-auto pb-20 md:pb-0">
      <div className="container mx-auto px-4 pt-16 pb-8">

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8 border-b pb-8">
            <div className="lg:col-span-2 flex flex-col items-center text-center md:items-start md:text-left">
                <Logo />
                <p className="text-sm text-muted-foreground mt-4 max-w-md">Exquisite Personalized Wooden Gifts. Handcrafted with love, designed to capture your most cherished memories.</p>
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="hidden md:grid md:grid-cols-3 col-span-3 gap-8">
              {linkSections.map((section: any) => (
                <div key={section.title}>
                    <h3 className="font-bold text-lg text-foreground mb-4">{section.title}</h3>
                    <ul className="space-y-2 text-sm">
                    {section.links.map((link: any) => (
                        <li key={link.href}>
                        <Link href={link.href} className="text-muted-foreground hover:text-primary font-semibold">{link.label}</Link>
                        </li>
                    ))}
                    </ul>
                </div>
              ))}
            </div>
            
            <div className="md:hidden col-span-1">
                <Accordion type="single" collapsible className="w-full">
                    {linkSections.map((section: any) => (
                        <AccordionItem value={section.title} key={section.title}>
                            <AccordionTrigger className="font-bold text-lg text-foreground">{section.title}</AccordionTrigger>
                            <AccordionContent>
                                <ul className="space-y-3 pt-2">
                                {section.links.map((link: any) => (
                                    <li key={link.href}>
                                        <Link href={link.href} className="text-muted-foreground hover:text-primary font-medium">{link.label}</Link>
                                    </li>
                                ))}
                                </ul>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>

              <div className="md:col-span-1">
                <h3 className="font-bold text-lg text-foreground mb-4">Newsletter</h3>
                <p className="text-sm text-muted-foreground mb-4">Subscribe for special offers, and new product announcements.</p>
                <form className="flex">
                  <Input type="email" placeholder="Your e-mail" className="rounded-r-none focus-visible:ring-0 focus-visible:ring-offset-0 border-r-0" />
                  <Button type="submit" className="rounded-l-none">
                    <ArrowRight className="h-5 w-5" />
                  </Button>
                </form>
                 <div className="flex items-center justify-start gap-4 mt-4">
                  {settings.social_facebook && (
                    <Link href={settings.social_facebook} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Facebook size={20} />
                    </Link>
                  )}
                  {settings.social_instagram && (
                    <Link href={settings.social_instagram} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Instagram size={20} />
                    </Link>
                  )}
                  {settings.social_youtube && (
                    <Link href={settings.social_youtube} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Youtube size={20} />
                    </Link>
                  )}
                  {settings.social_linkedin && (
                    <Link href={settings.social_linkedin} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Linkedin size={20} />
                    </Link>
                  )}
                  {settings.social_twitter && (
                    <Link href={settings.social_twitter} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary">
                      <Twitter size={20} />
                    </Link>
                  )}
                </div>
              </div>
        </div>

        <div className="mt-16 border-t pt-6 text-center text-sm text-muted-foreground">
          <p>
            &copy; {new Date().getFullYear()} {settings.invoice_business_name || 'Nema One'}. All rights reserved.
          </p>
           <p className="text-xs mt-2">
            Designed by <a href="https://instagram.com/shubham__nema" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary hover:underline">Samar</a>
          </p>
        </div>
      </div>
    </footer>
  );
};
