
import type { Metadata } from 'next';
import { Suspense } from 'react';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import MobileNavFooter from '@/components/layout/MobileNavFooter';
import Link from 'next/link';
import { AuthProvider } from '@/lib/auth';
import ProgressBar from '@/components/layout/ProgressBar';
import Script from 'next/script';
import { ThemeProvider } from 'next-themes';

import { getSiteSettings } from '@/lib/actions';

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
  
  return {
    title: settings.home_meta_title || 'Woody Business',
    description: settings.home_meta_description || 'Exquisite Personalized Wooden Gifts',
    manifest: '/manifest.webmanifest',
    icons: { icon: '/favicon.svg' },
    verification: {
      google: googleVerification,
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const settings = await getSiteSettings();
  const gtmId = settings.google_tag_manager_id;
  const themeBackground = settings.theme_background;
  const themeMuted = settings.theme_muted;

  const themeStyle = (themeBackground || themeMuted) ? (
    <style>
      {`
        :root:not(.dark) {
          ${themeBackground ? `--background: ${themeBackground};` : ''}
          ${themeMuted ? `--muted: ${themeMuted};` : ''}
        }
      `}
    </style>
  ) : null;

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
