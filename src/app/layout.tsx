

'use client';

import { usePathname } from 'next/navigation';
import type { Metadata } from 'next';
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

// export async function generateMetadata(): Promise<Metadata> {
//   const settings = await getSiteSettings();
//   const googleVerification = process.env.GOOGLE_SITE_VERIFICATION;
  
//   return {
//     title: settings.home_meta_title || 'Nema One',
//     description: settings.home_meta_description || 'Exquisite Personalized Wooden Gifts',
//     manifest: '/manifest.webmanifest',
//     icons: { icon: '/favicon.svg' },
//     verification: {
//       google: googleVerification,
//     },
//   };
// }

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const pathname = usePathname();
  const isAdminPage = pathname.startsWith('/sr-admin');

  // const settings = await getSiteSettings();
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID; // settings.google_tag_manager_id;
  const themeBackground = '0 0% 100%';//settings.theme_background;
  const themeMuted = '210 40% 96.1%'; //settings.theme_muted;

  const themeStyle = (themeBackground || themeMuted) ? (
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
  ) : <style>{`body { background-image: linear-gradient(to bottom, #ffffff, #e0f2fe); } .dark body { background-image: linear-gradient(to bottom, hsl(var(--background)), #0c1e35); }`}</style>;

  if (isAdminPage) {
    return (
       <html lang="en" suppressHydrationWarning>
        <body>
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
    )
  }

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
      <body className={cn(
        'min-h-screen bg-background font-body antialiased flex flex-col',
        isAdminPage && 'admin-page'
      )}>
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
                {!isAdminPage && <Header />}
                <main className={cn("flex-1", !isAdminPage && "pb-20 md:pb-0")}>{children}</main>
                {!isAdminPage && <Footer />}
                {!isAdminPage && <MobileNavFooter />}
                <Toaster />
            </AuthProvider>
            <Script id="cashfree-js" src="https://sdk.cashfree.com/js/v3/cashfree.js" strategy="lazyOnload" />
        </ThemeProvider>
      </body>
    </html>
  );
}
