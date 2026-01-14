
"use client";

import { useEffect, useState, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Loader2 } from "lucide-react";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminHeader from "@/components/admin/AdminHeader";

export default function AdminAuthLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isLoginRoute = pathname === "/sr-admin/login";

  useEffect(() => {
    if (!loading) {
      if (!user && !isLoginRoute) {
        router.push("/sr-admin/login");
      } else if (user && isLoginRoute) {
        router.push("/sr-admin/dashboard");
      }
    }
  }, [user, loading, router, isLoginRoute, pathname]);

  if (loading || (!user && !isLoginRoute)) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-yellow-500" />
          <p className="text-xl font-bold animate-pulse bg-gradient-to-r from-yellow-400 to-black bg-clip-text text-transparent">Loading...</p>
        </div>
      </div>
    );
  }

  if (isLoginRoute && !user) {
    return <>{children}</>;
  }

  if (user) {
    return (
      <div className="flex min-h-screen bg-background">
        <AdminSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
        <main className="flex-1 flex flex-col overflow-x-hidden">
          <AdminHeader isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />
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
