"use client"

import Link from "next/link"
import { Mail, Linkedin, Twitter } from "lucide-react"
import { useLocale } from "./language-switcher"
import { getTranslations } from "@/lib/i18n"

export function Footer() {
  const currentYear = new Date().getFullYear()
  const { locale } = useLocale()
  const t = getTranslations(locale)

  const footerLinks = {
    [t.contact.company]: [
      { label: t.contact.about, href: "#" },
      { label: t.contact.careers, href: "#" },
      { label: t.contact.press, href: "#" },
      { label: t.contact.contact, href: "#" },
    ],
    [t.contact.resources]: [
      { label: t.contact.research, href: "#" },
      { label: t.contact.reports, href: "#" },
      { label: t.contact.webinars, href: "#" },
      { label: t.contact.blog, href: "#" },
    ],
    [t.contact.legal]: [
      { label: t.contact.privacy, href: "#" },
      { label: t.contact.terms, href: "#" },
      { label: t.contact.cookies, href: "#" },
      { label: t.contact.disclaimer, href: "#" },
    ],
  }

  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-red rounded-sm flex items-center justify-center">
                <span className="text-black font-serif font-bold text-lg">Z</span>
              </div>
              <span className="font-serif font-bold text-white">Bali Zero</span>
            </Link>
            <p className="text-white/60 font-sans text-sm leading-relaxed">
              {t.contact.description}
            </p>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-serif font-bold mb-4">{category}</h4>
              <ul className="space-y-2">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-white/60 hover:text-red transition-colors font-sans text-sm">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-white/10 my-8"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-white/50 font-sans text-sm">© {currentYear} Bali Zero Insights. {t.contact.rights}</p>

          {/* Social Links */}
          <div className="flex items-center gap-4">
            <a href="#" className="text-white/60 hover:text-red transition-colors" aria-label="Email">
              <Mail size={20} />
            </a>
            <a href="#" className="text-white/60 hover:text-red transition-colors" aria-label="LinkedIn">
              <Linkedin size={20} />
            </a>
            <a href="#" className="text-white/60 hover:text-red transition-colors" aria-label="Twitter">
              <Twitter size={20} />
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
