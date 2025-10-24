"use client"

import Link from "next/link"
import Image from "next/image"

export function Header() {
  const navItems = [
    { label: "Immigration", href: "#immigration" },
    { label: "Business", href: "#business" },
    { label: "Tax & Legal", href: "#tax-legal" },
    { label: "AI Insights", href: "#ai" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-red/20">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-between">
        {/* Logo Section - Left */}
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/balizero-logo-3d.png"
            alt="Bali Zero"
            width={100}
            height={100}
            className="h-16 w-16 md:h-22 md:w-22 lg:h-24 lg:w-24"
            priority
          />
          <span className="font-serif font-bold text-xl md:text-2xl lg:text-3xl text-white hidden md:inline">
            From Zero to Infinity ∞
          </span>
          <Image
            src="/zantara_logo_transparent.png"
            alt="ZANTARA"
            width={100}
            height={100}
            className="h-16 w-16 md:h-22 md:w-22 lg:h-24 lg:w-24 hidden md:block"
          />
        </Link>

        {/* Navigation Menu - Right */}
        <div className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-white hover:text-red transition-colors text-sm font-medium font-sans uppercase tracking-wider"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* Mobile Menu Button - Right */}
        <button className="lg:hidden text-white hover:text-red transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </nav>
    </header>
  )
}
