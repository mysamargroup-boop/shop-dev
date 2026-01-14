
'use client';

import { Suspense } from 'react';
import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth';
import ProgressBar from '@/components/layout/ProgressBar';
import { ThemeProvider } from 'next-themes';
import AdminSidebar from '@/components/admin/AdminSidebar';
import AdminHeader from '@/components/admin/AdminHeader';
import { useAuth } from '@/lib/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import AdminFooter from '@/components/admin/AdminFooter';

function AdminAuthLayout({ children }: { children: React.ReactNode }) {
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

  if (isLoginRoute) {
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


export default function AdminRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>Woody Business Admin</title>
        <link rel="icon" href="/favicon.svg" />
      </head>
      <body className={cn('min-h-screen font-body antialiased admin-bg')}>
        <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
        >
          <Suspense fallback={null}>
              <ProgressBar />
          </Suspense>
          <AuthProvider>
              <AdminAuthLayout>{children}</AdminAuthLayout>
          </AuthProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
