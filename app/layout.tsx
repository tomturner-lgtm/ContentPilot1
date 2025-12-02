import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Header from '@/components/Header'
import { ToastProvider } from '@/components/ToastProvider'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'ContentFlow - Générez des articles de blog en 1 clic',
  description: 'Générez des articles de blog professionnels en un clic avec l\'IA',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr" className="transition-colors" suppressHydrationWarning>
      <body className={`${inter.className} transition-colors`}>
        <ToastProvider>
          <Header />
          {children}
        </ToastProvider>
      </body>
    </html>
  )
}
