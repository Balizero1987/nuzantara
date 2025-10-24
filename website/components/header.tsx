"use client"

import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-red/20">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-4">
          <Image
            src="/balizero-logo.png"
            alt="Bali Zero"
            width={112}
            height={112}
            className="h-18 w-18 md:h-24 md:w-24 lg:h-28 lg:w-28"
            priority
          />
          <span className="font-serif font-bold text-xl md:text-2xl lg:text-3xl text-white hidden sm:inline">
            From Zero to Infinity ∞
          </span>
          <Image
            src="/zantara_logo_transparent.png"
            alt="ZANTARA"
            width={112}
            height={112}
            className="h-18 w-18 md:h-24 md:w-24 lg:h-28 lg:w-28 hidden sm:block"
          />
        </Link>
      </nav>

    </header>
  )
}
