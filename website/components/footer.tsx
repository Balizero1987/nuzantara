import Link from "next/link"
import { Mail, Instagram, Linkedin } from "lucide-react"

export function Footer() {
  const currentYear = new Date().getFullYear()

  const footerLinks = {
    "Your Journey": [
      { label: "Visa & KITAS", href: "#visa" },
      { label: "PT PMA Company", href: "#business" },
      { label: "Finding Home", href: "#home" },
      { label: "Cultural Intelligence", href: "#culture" },
    ],
    Resources: [
      { label: "Journey Stories", href: "#stories" },
      { label: "Practical Guides", href: "#guides" },
      { label: "ZANTARA Insights", href: "#insights" },
      { label: "Community", href: "#community" },
    ],
    "Bali Zero": [
      { label: "About Us", href: "#about" },
      { label: "Contact", href: "#contact" },
      { label: "Bali Office", href: "#office" },
      { label: "Our Philosophy", href: "#philosophy" },
    ],
    Legal: [
      { label: "Privacy Policy", href: "#privacy" },
      { label: "Terms of Service", href: "#terms" },
      { label: "Cookie Policy", href: "#cookies" },
    ],
  }

  return (
    <footer className="bg-[#0a0e27] border-t border-[#2a2a2a]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-16">
        {/* Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-10 mb-12">
          {/* Brand - Larger on desktop */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6 group">
              <div className="w-10 h-10 bg-black rounded-full border-2 border-[#FF0000] flex items-center justify-center group-hover:border-[#D4AF37] transition-colors duration-300">
                <span className="text-[#FF0000] font-serif font-bold text-xl group-hover:text-[#D4AF37] transition-colors">
                  3
                </span>
              </div>
              <div>
                <div className="text-[#f5f5f5] font-serif font-bold text-lg">Bali Zero</div>
                <div className="text-[#e8d5b7] text-xs italic">From Zero to Infinity ∞</div>
              </div>
            </Link>
            <p className="text-[#f5f5f5]/60 font-sans text-sm leading-relaxed mb-4">
              Your warm companion for the Indonesia journey.
              <br />
              Visa, business, home, culture — guided by ZANTARA Intelligence.
            </p>

            {/* Contact Info */}
            <div className="space-y-2 text-[#f5f5f5]/50 text-sm font-sans">
              <div>📍 Kerobokan, Bali, Indonesia</div>
              <div>📱 +62 859 0436 9574</div>
              <div>✉️ info@balizero.com</div>
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-[#f5f5f5] font-serif font-bold mb-4 text-sm">{category}</h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-[#f5f5f5]/60 hover:text-[#FF0000] transition-colors font-sans text-sm"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="border-t border-[#2a2a2a] my-10"></div>

        {/* Bottom Footer */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Copyright */}
          <p className="text-[#f5f5f5]/50 font-sans text-sm">
            © {currentYear} PT. Bali Nol Impersariat. All rights reserved.
          </p>

          {/* Powered by ZANTARA */}
          <p className="text-[#e8d5b7]/60 font-sans text-xs italic">
            Powered by ZANTARA Intelligence 🤖
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-5">
            <a
              href="mailto:info@balizero.com"
              className="text-[#f5f5f5]/60 hover:text-[#FF0000] transition-colors"
              aria-label="Email"
            >
              <Mail size={20} />
            </a>
            <a
              href="https://instagram.com/balizero0"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5f5f5]/60 hover:text-[#FF0000] transition-colors"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://linkedin.com/company/balizero"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#f5f5f5]/60 hover:text-[#FF0000] transition-colors"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
          </div>
        </div>

        {/* Indonesian Touch */}
        <div className="mt-8 text-center">
          <p className="text-[#D4AF37]/40 font-serif text-xs italic">
            🙏 Terima kasih telah mempercayai kami dalam perjalanan Indonesia Anda
          </p>
        </div>
      </div>
    </footer>
  )
}
