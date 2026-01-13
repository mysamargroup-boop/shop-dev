

'use client';

import { Suspense } from 'react';
import '../globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/lib/auth';
import ProgressBar from '@/components/layout/ProgressBar';
import { ThemeProvider } from 'next-themes';
import AdminAuthLayout from './AdminAuthLayout';


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
        <style>{`
          .admin-bg {
            background-color: #f4f4f5; /* zinc-100 */
          }
          .dark .admin-bg {
            background-color: #18181b; /* zinc-900 */
          }
        `}</style>
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
