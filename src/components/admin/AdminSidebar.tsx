
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, LogOut, Megaphone, Send, PenSquare, ImageIcon, LayoutGrid, Settings, BookText, TicketPercent, Tag as TagIcon, Gift, ShoppingBag, ArrowRightLeft, Users, List } from "lucide-react";
import { useAuth } from "@/lib/auth";
import Logo from "../icons/Logo";
import { Button } from "../ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "@/lib/utils";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useEffect } from "react";
import { ScrollArea } from "../ui/scroll-area";

const navItems = [
  { href: "/wb-admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/wb-admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/wb-admin/products", label: "Products", icon: Package },
  { href: "/wb-admin/categories", label: "Categories", icon: LayoutGrid },
  { href: "/wb-admin/tags", label: "Tags", icon: TagIcon },
  { href: "/wb-admin/blogs", label: "Blogs", icon: PenSquare },
  { href: "/wb-admin/coupons", label: "Coupons", icon: TicketPercent },
  { href: "/wb-admin/banners", label: "Banners", icon: Gift },
  { href: "/wb-admin/site-images", label: "Site Images", icon: ImageIcon },
  { href: "/wb-admin/marketing", label: "Marketing", icon: Send },
  { href: "/wb-admin/leads", label: "Leads", icon: Users },
  { href: "/wb-admin/settings", label: "Settings", icon: Settings },
  { href: "/wb-admin/instructions", label: "Instructions", icon: BookText },
];

const getInitials = (email: string | undefined) => {
    if (!email) return 'A';
    const name = email.split('@')[0].replace('.', ' ').replace('_', ' ');
    const nameParts = name.split(' ').filter(Boolean);
    if (nameParts.length > 1) {
        return (nameParts[0][0] + (nameParts[nameParts.length - 1][0] || '')).toUpperCase();
    } else if (nameParts.length === 1 && nameParts[0].length > 1) {
        return (nameParts[0][0] + nameParts[0][1]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
}


export default function AdminSidebar({ isSidebarOpen, setIsSidebarOpen }: { isSidebarOpen: boolean, setIsSidebarOpen: (open: boolean) => void }) {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  
  useEffect(() => {
    if (isSidebarOpen) {
      setIsSidebarOpen(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  const NavContent = () => (
     <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            <Link href="/" className="flex items-center gap-2 font-semibold">
                <Logo />
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
                <AvatarImage src={`https://avatar.vercel.sh/${user?.email}.png`} alt={user?.email || 'admin'} />
                <AvatarFallback>{getInitials(user?.email)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.email}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={signOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
        </div>
    </div>
  )

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
