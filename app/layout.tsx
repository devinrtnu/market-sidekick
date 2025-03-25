import './globals.css'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from "next/font/google";

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
    template: '%s | Spark Foundation',
    default: 'Spark Foundation - Modern Web Application Starter',
  },
  description: 'A modern, high-performance Next.js starter template for building scalable web applications.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: 'Spark Foundation',
    description: 'A modern, high-performance Next.js starter template for building scalable web applications.',
    url: '/',
    siteName: 'Spark Foundation',
    images: [
      {
        url: '/og.png',
        width: 1200,
        height: 630,
        alt: 'Spark Foundation',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Spark Foundation',
    description: 'A modern, high-performance Next.js starter template for building scalable web applications.',
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
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  )
}
