
"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2, PanelLeft, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminFooter from "@/components/admin/AdminFooter";

export default function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoginRoute = pathname === "/sr-admin/login";

  useEffect(() => {
    if (loading) {
      return; 
    }
    
    if (!user && !isLoginRoute) {
      router.push("/sr-admin/login");
    } else if (user && isLoginRoute) {
      router.push("/sr-admin/dashboard");
    }

  }, [user, loading, router, pathname, isLoginRoute]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
            <p className="text-xl font-bold animate-pulse bg-gradient-to-r from-yellow-400 to-black bg-clip-text text-transparent">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoginRoute) {
    return <>{children}</>;
  }

  if (user) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 flex flex-col overflow-x-hidden">
            <header className="flex h-14 items-center justify-between gap-4 border-b bg-muted/40 px-6 flex-shrink-0">
              <div className="flex items-center gap-4">
                  <Button variant="outline" size="icon" className="h-8 w-8 lg:hidden" onClick={() => setIsSidebarOpen(true)}>
                    <PanelLeft className="h-4 w-4" />
                    <span className="sr-only">Toggle Menu</span>
                  </Button>
                  <h1 className="font-semibold text-lg">Admin Console</h1>
              </div>
              <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground hidden sm:inline">{user.email}</span>
                  <UserCircle className="h-6 w-6 text-muted-foreground" />
              </div>
            </header>
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              {children}
            </div>
            <AdminFooter />
        </main>
      </div>
    );
  }

  return null;
}
