import type React from "react"
import type { Metadata } from "next"
import { Geist_Mono, Playfair_Display, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { LiveChatWidget } from "@/components/live-chat-widget"
import "./globals.css"

const _playfairDisplay = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "500", "600", "700", "800", "900"],
})

const _inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Bali Zero | From Zero to Infinity ∞",
  description: "Your guide to Indonesian immigration, business setup, tax compliance, property ownership, and AI-powered insights. Expert expat services in Bali and Indonesia.",
  keywords: "Bali visa, KITAS, PT PMA Indonesia, Indonesian tax, Bali property, expat services, business Indonesia, ZANTARA",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${_playfairDisplay.variable} ${_inter.variable} font-sans antialiased bg-black text-off-white`}>
        {children}
        <LiveChatWidget />
        <Analytics />
      </body>
    </html>
  )
}
