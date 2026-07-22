import type { Metadata } from 'next';
import { Geist, Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { Providers } from '@/components/providers';
import { Sidebar } from '@/components/navigation/Sidebar';
import { TrendsSidebar } from '@/components/navigation/TrendsSidebar';
import { MobileNav } from '@/components/navigation/MobileNav';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'VoiceFlow',
  description: 'A social network powered by the AT Protocol',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body
        className={`${geistSans.variable} ${plusJakartaSans.variable} antialiased bg-surface-base text-foreground`}
      >
        <Providers>
          <div className="app-layout">
            <Sidebar />
            <main className="app-main">
              {children}
            </main>
            <TrendsSidebar />
          </div>
          <MobileNav />
        </Providers>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: 'var(--surface-elevated)',
              color: 'var(--foreground)',
              border: '1px solid var(--border)',
            },
          }}
        />
      </body>
    </html>
  );
}
