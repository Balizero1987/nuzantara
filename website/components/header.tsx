"use client"

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"

export function Header() {
  const [isOpen, setIsOpen] = useState(false)

  const navItems = [
    { label: "The Visa Journey", href: "#visa" },
    { label: "Building in Bali", href: "#business" },
    { label: "Finding Home", href: "#home" },
    { label: "Cultural Insights", href: "#culture" },
  ]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-md border-b border-[#2a2a2a]">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Logo - Bali Zero with Indonesian touch */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* Logo image (will use real Bali Zero logo) */}
          <div className="relative w-10 h-10">
            <div className="w-10 h-10 bg-black rounded-full border-2 border-[#FF0000] flex items-center justify-center group-hover:border-[#D4AF37] transition-colors duration-300">
              <span className="text-[#FF0000] font-serif font-bold text-xl group-hover:text-[#D4AF37] transition-colors duration-300">
                3
              </span>
            </div>
          </div>

          {/* Brand Text */}
          <div className="hidden sm:block">
            <div className="text-[#f5f5f5] font-serif font-bold text-lg leading-tight">
              Bali Zero
            </div>
            <div className="text-[#e8d5b7] text-xs font-sans italic">
              From Zero to Infinity ∞
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-6">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-[#f5f5f5] hover:text-[#FF0000] transition-colors text-sm font-medium relative group"
            >
              {item.label}
              {/* Underline animation */}
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF0000] group-hover:w-full transition-all duration-300"></span>
            </Link>
          ))}
        </div>

        {/* CTA Button */}
        <div className="hidden md:block">
          <button className="bg-[#FF0000] text-black px-6 py-2.5 font-serif font-bold hover:bg-[#FF0000]/90 transition-all duration-300 glow-red-subtle hover:glow-red-medium">
            Start Your Journey
          </button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-[#f5f5f5] hover:text-[#FF0000] transition-colors"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden bg-[#0a0e27] border-t border-[#2a2a2a] backdrop-blur-lg">
          <div className="px-4 py-6 space-y-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block text-[#f5f5f5] hover:text-[#FF0000] transition-colors font-medium py-2"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button className="w-full bg-[#FF0000] text-black px-6 py-3 font-serif font-bold hover:bg-[#FF0000]/90 transition-all duration-300 mt-4">
              Start Your Journey
            </button>
          </div>
        </div>
      )}
    </header>
  )
}
