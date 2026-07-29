import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import './globals.css'
import { QueryProvider } from './providers/query-provider'
import { ThemeProvider } from '@/components/providers/theme-provider'

import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'MyNilam | Real Estate & Roommate Marketplace',
  description: 'Find apartments, flats, villas, plots, or roommate matches with ease.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-gradient-to-br from-indigo-50/40 via-white to-purple-50/40 dark:from-indigo-950/20 dark:via-gray-950 dark:to-purple-950/20 text-gray-900 dark:text-gray-100 transition-colors duration-200 min-h-screen`}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <QueryProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-grow bg-transparent">{children}</main>
              <Footer />
            </div>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}