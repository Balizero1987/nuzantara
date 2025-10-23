"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: "Insights", href: "#insights" },
    { label: "Intelligence", href: "#intelligence" },
    { label: "Research", href: "#research" },
    { label: "About", href: "#about" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-navy">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-red rounded-sm flex items-center justify-center">
            <span className="text-black font-serif font-bold text-lg">Z</span>
          </div>
          <span className="font-serif font-bold text-lg text-cream hidden sm:inline">Bali Zero</span>
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
          <button className="bg-red text-black px-6 py-2 font-serif font-bold hover:bg-red/90 transition-colors">
            Subscribe
          </button>
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
            <button className="w-full bg-red text-black px-6 py-2 font-serif font-bold hover:bg-red/90 transition-colors">
              Subscribe
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
