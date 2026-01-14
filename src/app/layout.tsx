
'use client';

import { usePathname } from 'next/navigation';
import { Suspense } from 'react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNavFooter from '@/components/layout/MobileNavFooter';
import { AuthProvider } from '@/lib/auth';
import ProgressBar from '@/components/layout/ProgressBar';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';
import { getSiteSettings } from './../lib/data-async';
import { useEffect, useState } from 'react';
import type { SiteSettings } from '@/lib/types';


function MainLayout({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>({});

    useEffect(() => {
        getSiteSettings().then(setSettings);
    }, []);

    const gtmId = process.env.NEXT_PUBLIC_GTM_ID || settings.google_tag_manager_id;
    const themeBackground = settings.theme_background || '0 0% 100%';
    const themeMuted = settings.theme_muted || '210 40% 96.1%';

    const themeStyle = (
        <style>
        {`
            :root {
            ${themeBackground ? `--background: ${themeBackground};` : ''}
            ${themeMuted ? `--muted: ${themeMuted};` : ''}
            }
            body:not(.admin-page) {
            background-image: linear-gradient(to bottom, hsl(${themeBackground}) , #e0f2fe);
            }
            .dark body:not(.admin-page) {
            background-image: linear-gradient(to bottom, hsl(var(--background)), #0c1e35);
            }
        `}
        </style>
    );

    return (
        <html lang="en" suppressHydrationWarning>
        <head>
            {gtmId && (
                <Script id="google-tag-manager" strategy="afterInteractive">
                    {`
                    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
                    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
                    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
                    })(window,document,'script','dataLayer','${gtmId}');
                    `}
                </Script>
            )}
            {themeStyle}
            <meta name="theme-color" content="#5a473a" />
            <link rel="preconnect" href="https://fonts.googleapis.com" />
            <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            <link rel="manifest" href="/manifest.webmanifest" />
        </head>
        <body className={cn('min-h-screen bg-background font-body antialiased flex flex-col')}>
            <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
            >
                {gtmId && (
                <noscript>
                    <iframe
                    src={`https://www.googletagmanager.com/ns.html?id=${gtmId}`}
                    height="0"
                    width="0"
                    style={{ display: 'none', visibility: 'hidden' }}
                    ></iframe>
                </noscript>
                )}
                <Suspense fallback={null}>
                    <ProgressBar />
                </Suspense>
                <AuthProvider>
                    <Header />
                    <main className="flex-1 pb-20 md:pb-0">{children}</main>
                    <Footer />
                    <MobileNavFooter />
                    <Toaster />
                </AuthProvider>
                <Script id="cashfree-js" src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
            </ThemeProvider>
        </body>
        </html>
    );
}

function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
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
                    {children}
                </AuthProvider>
                <Toaster />
            </ThemeProvider>
            </body>
        </html>
    );
}


export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/sr-admin');

  if (isAdminPage) {
    return <AdminLayout>{children}</AdminLayout>;
  }

  return <MainLayout>{children}</MainLayout>;
}
