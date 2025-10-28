"use client"

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

const services = [
  {
    slug: 'visas',
    title: 'Visa Services',
    description: 'KITAS, work permits, and residence solutions',
    icon: '✈️',
    sticker: '/sticker/visa-sticker.jpg'
  },
  {
    slug: 'company',
    title: 'Company Formation',
    description: 'PT PMA setup, OSS 2.0, and business licensing',
    icon: '🏢',
    sticker: '/sticker/company-sticker.jpg'
  },
  {
    slug: 'tax',
    title: 'Tax Consulting',
    description: 'NPWP, tax compliance, and accounting services',
    icon: '📊',
    sticker: '/sticker/tax-sticker.jpg'
  },
  {
    slug: 'real-estate',
    title: 'Real Estate',
    description: 'Property search, legal support, and investment',
    icon: '🏡',
    sticker: '/sticker/realestate-sticker.jpg'
  },
  {
    slug: 'team',
    title: 'Our Team',
    description: 'Meet the experts behind Bali Zero',
    icon: '👥',
    sticker: '/sticker/team-collaboration-sticker.png'
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    description: 'Get in touch with our team',
    icon: '📧',
    sticker: '/sticker/contact-communication-sticker.png'
  }
]

export default function HomePage() {
  return (
    <main className="bg-black batik-pattern min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <span className="text-gold font-serif font-bold text-sm tracking-widest">FROM ZERO TO INFINITY ∞</span>
          <h1 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6 mt-4">
            Build Your <span className="text-red">Indonesian</span><br />
            Dream with Confidence
          </h1>
          <p className="text-white/70 font-sans text-lg md:text-xl max-w-3xl mx-auto">
            We simplify your journey in Bali: visas, business setup, taxes, and real estate — all under one roof.
          </p>
        </div>
      </section>

      {/* Services Section with 3D Stickers */}
      <section className="pb-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-white font-serif font-bold text-4xl md:text-5xl mb-4">Our Services</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map((service) => (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-navy/50 to-black hover:border-red/50 transition-all duration-500 p-8"
              >
                {/* 3D Sticker */}
                <div className="mb-6 relative">
                  <img 
                    src={service.sticker} 
                    alt={service.title}
                    className="w-16 h-16 object-contain group-hover:scale-110 transition-transform duration-300"
                    onError={(e) => {
                      // Fallback to emoji if sticker not found
                      e.currentTarget.style.display = 'none';
                      const nextElement = e.currentTarget.nextElementSibling as HTMLElement;
                      if (nextElement) {
                        nextElement.style.display = 'block';
                      }
                    }}
                  />
                  <div className="text-4xl hidden">{service.icon}</div>
                </div>

                {/* Content */}
                <h3 className="text-white font-serif font-bold text-xl mb-3 group-hover:text-red transition-colors">
                  {service.title}
                </h3>
                <p className="text-white/60 font-sans text-sm mb-4">
                  {service.description}
                </p>
                
                {/* Learn More */}
                <div className="flex items-center text-red font-sans text-sm font-semibold">
                  Learn More
                  <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>

                {/* Hover Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                  <div className="absolute inset-0 bg-gradient-to-t from-red/10 to-transparent" />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Work with Experts Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8 border-t border-white/10">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl mb-4">
            Work with Experts
          </h2>
          <p className="text-white/70 font-sans text-lg mb-8 max-w-2xl mx-auto">
            Our team combines local knowledge with international experience.
          </p>
          <Link
            href="/services/team"
            className="inline-block bg-red text-black px-8 py-3 font-serif font-bold hover:bg-red/90 transition-colors hover:shadow-[0_0_30px_rgba(255,0,0,0.6)]"
          >
            Meet Our Team
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
