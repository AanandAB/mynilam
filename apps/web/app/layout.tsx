import type { Metadata } from 'next'
import { DM_Sans, DM_Serif_Display } from 'next/font/google'
import './globals.css'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const dmSerif = DM_Serif_Display({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-dm-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'MyNilam | Premium Property & Co-Living Marketplace',
  description: 'Find PGs, hostels, co-living spaces, apartments and rooms across 85+ cities. Verified listings, zero brokerage.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmSerif.variable}`}>
      <body className="font-sans bg-cream dark:bg-[#0c1222] text-navy dark:text-slate-200 antialiased transition-colors duration-200 min-h-screen">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <QueryProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow">{children}</main>
              <Footer />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
