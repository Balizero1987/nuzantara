"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: "Immigration", href: "#immigration" },
    { label: "Business", href: "#business" },
    { label: "Tax & Legal", href: "#tax-legal" },
    { label: "Property", href: "#property" },
    { label: "AI Insights", href: "#ai" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-navy">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/balizero-logo.png"
            alt="Bali Zero"
            width={48}
            height={48}
            className="h-12 w-12"
          />
          <div className="h-8 w-px bg-cream/30 hidden sm:block" />
          <Image
            src="/zantara_logo_transparent.png"
            alt="ZANTARA"
            width={40}
            height={40}
            className="h-10 w-10 hidden sm:block"
          />
          <span className="font-serif font-bold text-base text-off-white hidden lg:inline">
            From Zero to Infinity ∞
          </span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-cream hover:text-red transition-colors text-sm font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <Link
            href="https://welcome.balizero.com"
            target="_blank"
            className="bg-red text-black px-6 py-2 font-serif font-bold hover:bg-red/90 transition-all hover:shadow-[0_0_20px_rgba(255,0,0,0.5)] inline-block"
          >
            Get Started
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button className="md:hidden text-cream" onClick={() => setIsOpen(!isOpen)} aria-label="Toggle menu">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-navy border-t border-navy">
          <div className="px-4 py-4 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-cream hover:text-red transition-colors font-medium"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="https://welcome.balizero.com"
              target="_blank"
              className="block w-full bg-red text-black px-6 py-2 font-serif font-bold hover:bg-red/90 transition-all text-center"
            >
              Get Started
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
