import type { Metadata, Viewport } from 'next';
import { ThemeProvider } from 'next-themes';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: {
    default: 'Freedom Aviation | Premium Aircraft Management at KAPA',
    template: '%s | Freedom Aviation',
  },
  description:
    'Premium aircraft management, flight instruction, and hangar services at Centennial Airport (KAPA) in Colorado. Expert care for your aircraft.',
  keywords: [
    'aircraft management',
    'flight instruction',
    'KAPA',
    'Centennial Airport',
    'Colorado aviation',
    'hangar services',
    'pilot training',
    'aircraft maintenance',
  ],
  authors: [{ name: 'Freedom Aviation' }],
  creator: 'Freedom Aviation',
  publisher: 'Freedom Aviation',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://www.freedomaviationco.com'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'Freedom Aviation | Premium Aircraft Management',
    description:
      'Premium aircraft management, flight instruction, and hangar services at Centennial Airport (KAPA) in Colorado.',
    url: 'https://www.freedomaviationco.com',
    siteName: 'Freedom Aviation',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/images/owner-portal-preview.jpg',
        width: 1200,
        height: 630,
        alt: 'Freedom Aviation Owner Portal',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Freedom Aviation | Premium Aircraft Management',
    description:
      'Premium aircraft management, flight instruction, and hangar services at Centennial Airport (KAPA) in Colorado.',
    images: ['/images/owner-portal-preview.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0f' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
