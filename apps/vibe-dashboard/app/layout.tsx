import type { Metadata } from 'next'
import { Inter, Playfair_Display } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })
const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '600', '700']
})

export const metadata: Metadata = {
  title: 'VIBE Dashboard | ZANTARA',
  description: 'Multi-Agent AI Orchestration Dashboard',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className="bg-zantara-bg-0 text-zantara-text font-sans antialiased">
        {children}
      </body>
    </html>
  )
}
