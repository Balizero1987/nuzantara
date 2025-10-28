"use client"

import Link from "next/link"
import Image from "next/image"
import { LanguageSwitcher, useLocale } from "./language-switcher"
import { getTranslations } from "@/lib/i18n"

export function Header() {
  const { locale } = useLocale()
  const t = getTranslations(locale)
  
  const navItems = [
    { label: t.nav.immigration, href: "#immigration" },
    { label: t.nav.business, href: "#business" },
    { label: t.nav.taxLegal, href: "#tax-legal" },
    { label: t.nav.insights, href: "#ai" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-red/20">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-between">
        {/* Logo Section - Left */}
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/logo/balizero-logo.png"
            alt="Bali Zero"
            width={120}
            height={120}
            className="h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain brightness-125 hover:brightness-150 contrast-110 transition-all duration-300"
            priority
          />
          <span className="font-serif font-bold text-xl md:text-2xl lg:text-3xl text-white hidden md:inline">
            From Zero to Infinity ∞
          </span>
          <Image
            src="/logo/zantara_logo_transparent.png"
            alt="ZANTARA"
            width={120}
            height={120}
            className="h-20 w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 object-contain brightness-125 hover:brightness-150 contrast-110 transition-all duration-300"
            priority
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
          <LanguageSwitcher className="ml-4" />
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
