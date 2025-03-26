import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google";
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'
import { ThemeProvider } from '@/components/theme-provider'

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    template: '%s | Market Sidekick',
    default: 'Market Sidekick - Financial Tool for Long-Term Investors',
  },
  description: 'A financial tool for tracking market indicators and making better investment decisions.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Market Sidekick',
    description: 'A financial tool for tracking market indicators and making better investment decisions.',
    url: '/',
    siteName: 'Market Sidekick',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Market Sidekick',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Market Sidekick',
    description: 'A financial tool for tracking market indicators and making better investment decisions.',
    images: ['/og.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <Header />
          <main className="flex-1 flex flex-col">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  )
}
