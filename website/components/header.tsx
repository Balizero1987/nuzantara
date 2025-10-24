"use client"

import Link from "next/link"
import Image from "next/image"

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-black/95 backdrop-blur-sm border-b border-red/20">
      <nav className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-6 flex items-center justify-center">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-6">
          <Image
            src="/balizero-logo-new.png"
            alt="Bali Zero"
            width={224}
            height={224}
            className="h-36 w-36 md:h-48 md:w-48 lg:h-56 lg:w-56"
            priority
          />
          <span className="font-serif font-bold text-2xl md:text-3xl lg:text-4xl text-white hidden sm:inline">
            From Zero to Infinity ∞
          </span>
          <Image
            src="/zantara_logo_transparent.png"
            alt="ZANTARA"
            width={224}
            height={224}
            className="h-36 w-36 md:h-48 md:w-48 lg:h-56 lg:w-56 hidden sm:block"
          />
        </Link>
      </nav>

    </header>
  )
}
