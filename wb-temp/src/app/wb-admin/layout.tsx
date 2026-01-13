

"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AuthProvider, useAuth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2, PanelLeft } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { Button } from "@/components/ui/button";
import ProgressBar from "@/components/layout/ProgressBar";

function AdminAuthLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isLoginRoute = pathname === "/wb-admin/login";

  useEffect(() => {
    if (loading) {
      return; 
    }
    
    if (!user && !isLoginRoute) {
      router.push("/wb-admin/login");
    } else if (user && isLoginRoute) {
      router.push("/wb-admin/dashboard");
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
            <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-6 lg:hidden flex-shrink-0">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setIsSidebarOpen(true)}>
                <PanelLeft className="h-4 w-4" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </header>
            <div className="flex-1 p-4 sm:p-8 overflow-y-auto">
              <ProgressBar />
              {children}
            </div>
        </main>
        <Toaster />
      </div>
    );
  }

  return null;
}


export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AdminAuthLayout>{children}</AdminAuthLayout>
        </AuthProvider>
    )
}
