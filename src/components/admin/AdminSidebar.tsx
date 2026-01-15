

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, LogOut, Megaphone, Send, PenSquare, ImageIcon, LayoutGrid, Settings, BookText, TicketPercent, Gift, ShoppingBag, ArrowRightLeft, Users, List, MessageSquare } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Logo from "../icons/Logo";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useEffect, useState } from "react";
import { ScrollArea } from "../ui/scroll-area";
import type { SiteSettings } from "@/lib/types";

const navItems = [
  { href: "/sr-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sr-admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/sr-admin/products", label: "Products", icon: Package },
  { href: "/sr-admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/sr-admin/blogs", label: "Blogs", icon: PenSquare },
  { href: "/sr-admin/reviews", label: "Reviews", icon: MessageSquare },
  { href: "/sr-admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/sr-admin/banners", label: "Banners", icon: Gift },
  { href: "/sr-admin/site-images", label: "Site Images", icon: ImageIcon },
  { href: "/sr-admin/marketing", label: "Marketing", icon: Send },
  { href: "/sr-admin/leads", label: "Leads", icon: Users },
  { href: "/sr-admin/settings", label: "Settings", icon: Settings },
  { href: "/sr-admin/instructions", label: "Instructions", icon: BookText },
];

const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'A';
}


export default function AdminSidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/site-settings');
        if (!res.ok) return;
        const data = await res.json();
        setSettings((data || {}) as SiteSettings);
      } catch {
      }
    })();
  }, []);
  
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const NavContent = () => {
    const ownerName = [settings?.owner_first_name, settings?.owner_last_name].filter(Boolean).join(' ') || user?.email;
    return (
     <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/sr-admin/dashboard" className="flex items-center gap-2 font-semibold">
                <span className="font-bold">Admin Panel</span>
            </Link>
        </div>
        <div className="flex-1 overflow-y-auto">
            <ScrollArea className="h-full">
              <nav className="grid items-start px-2 text-sm font-medium lg:px-4 space-y-1">
              {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
                    isActive && "bg-muted text-primary"
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              )})}
              </nav>
            </ScrollArea>
        </div>
        <div className="mt-auto p-4 border-t">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={ownerName} />
                <AvatarFallback>{getInitials(settings?.owner_first_name, settings?.owner_last_name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{ownerName}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
        </div>
    </div>
  )};

  return (
    <>
        <div className="hidden border-r bg-muted/40 lg:block lg:w-64">
           <NavContent />
        </div>
        <Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
            <SheetContent side="left" className="flex flex-col p-0 w-64">
                <NavContent />
            </SheetContent>
        </Sheet>
    </>
  );
}
