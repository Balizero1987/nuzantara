import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function RealEstatePage() {
  return (
    <main className="batik-pattern min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
            Real Estate Services
          </h1>
          <p className="text-cream font-sans text-lg md:text-xl max-w-3xl mx-auto">
            Secure property with legal clarity and guidance. Navigate Indonesia's real estate market with expert support from acquisition to ownership.
          </p>
        </div>
      </section>

      {/* Our Real Estate Services Grid */}
      <section className="pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl text-center mb-12">
            Our Real Estate Services
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Property Search */}
            <div className="group bg-navy/50 rounded-2xl p-8 border border-cream/15 hover:border-red transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,0,0,0.2)]">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <img 
                  src="/sticker/property-search-sticker.png" 
                  alt="Property Search"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="text-white font-serif font-bold text-2xl mb-4 text-center">Property Search</h3>
              <p className="text-cream/90">
                Find your ideal property in Bali. We connect you with trusted developers and property owners across the island.
              </p>
            </div>

            {/* Legal Due Diligence */}
            <div className="group bg-navy/50 rounded-2xl p-8 border border-cream/15 hover:border-red transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,0,0,0.2)]">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <img 
                  src="/sticker/legal-due-diligence-sticker.png" 
                  alt="Legal Due Diligence"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="text-white font-serif font-bold text-2xl mb-4 text-center">Legal Due Diligence</h3>
              <p className="text-cream/90">
                Comprehensive property verification. Land certificate checks, ownership verification, and legal risk assessment.
              </p>
            </div>

            {/* Transaction Support */}
            <div className="group bg-navy/50 rounded-2xl p-8 border border-cream/15 hover:border-red transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,0,0,0.2)]">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <img 
                  src="/sticker/transaction-support-sticker.png" 
                  alt="Transaction Support"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="text-white font-serif font-bold text-2xl mb-4 text-center">Transaction Support</h3>
              <p className="text-cream/90">
                End-to-end support for property purchases. Negotiation, contract review, and notary coordination.
              </p>
            </div>

            {/* Leasehold Agreements */}
            <div className="group bg-navy/50 rounded-2xl p-8 border border-cream/15 hover:border-red transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,0,0,0.2)]">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <img 
                  src="/sticker/leasehold-agreements-sticker.png" 
                  alt="Leasehold Agreements"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="text-white font-serif font-bold text-2xl mb-4 text-center">Leasehold Agreements</h3>
              <p className="text-cream/90">
                Structure and register long-term leasehold agreements (Hak Sewa) for villas, land, and commercial properties.
              </p>
            </div>

            {/* Building Permits */}
            <div className="group bg-navy/50 rounded-2xl p-8 border border-cream/15 hover:border-red transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,0,0,0.2)]">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <img 
                  src="/sticker/building-permits-sticker.png" 
                  alt="Building Permits"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="text-white font-serif font-bold text-2xl mb-4 text-center">IMB & Building Permits</h3>
              <p className="text-cream/90">
                Obtain building permits (IMB) for construction and renovation projects. Compliance with local regulations.
              </p>
            </div>

            {/* Property Management */}
            <div className="group bg-navy/50 rounded-2xl p-8 border border-cream/15 hover:border-red transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(255,0,0,0.2)]">
              <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
                <img 
                  src="/sticker/property-management-sticker.png" 
                  alt="Property Management"
                  className="w-full h-full object-contain group-hover:scale-110 transition-transform"
                />
              </div>
              <h3 className="text-white font-serif font-bold text-2xl mb-4 text-center">Property Management</h3>
              <p className="text-cream/90">
                Ongoing property management, maintenance coordination, and rental management for investment properties.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Property Ownership Structures */}
      <section className="py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-gradient-to-br from-navy/80 to-navy/40 rounded-3xl p-8 md:p-12 border border-cream/10">
            <h2 className="text-gold font-serif font-bold text-3xl md:text-4xl text-center mb-12">
              Property Ownership Structures for Foreigners
            </h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="bg-navy/60 rounded-xl p-6 border border-cream/10 hover:border-gold transition-colors hover:-translate-y-1">
                <h3 className="text-white font-serif font-bold text-xl mb-3">Leasehold (Hak Sewa)</h3>
                <p className="text-cream text-sm">
                  Long-term lease up to 80 years. Most common for foreigners. Renewable and transferable.
                </p>
              </div>
              
              <div className="bg-navy/60 rounded-xl p-6 border border-cream/10 hover:border-gold transition-colors hover:-translate-y-1">
                <h3 className="text-white font-serif font-bold text-xl mb-3">Hak Pakai (Right to Use)</h3>
                <p className="text-cream text-sm">
                  Up to 80 years. Available for foreigners with specific visa types. Can be extended.
                </p>
              </div>
              
              <div className="bg-navy/60 rounded-xl p-6 border border-cream/10 hover:border-gold transition-colors hover:-translate-y-1">
                <h3 className="text-white font-serif font-bold text-xl mb-3">Nominee Structure</h3>
                <p className="text-cream text-sm">
                  Property held by Indonesian nominee with usage rights. Requires careful legal structure.
                </p>
              </div>
              
              <div className="bg-navy/60 rounded-xl p-6 border border-cream/10 hover:border-gold transition-colors hover:-translate-y-1">
                <h3 className="text-white font-serif font-bold text-xl mb-3">PT PMA Ownership</h3>
                <p className="text-cream text-sm">
                  Foreign company (PT PMA) owns property. Best for commercial or investment properties.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Understanding Indonesian Real Estate Law */}
      <section className="py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl text-center mb-6">
            Understanding Indonesian Real Estate Law
          </h2>
          <p className="text-cream text-lg text-center max-w-3xl mx-auto mb-12">
            Indonesia has specific regulations for foreign property ownership. We ensure you understand the legal framework and choose the right structure for your needs.
          </p>
          
          <div className="grid gap-8 md:grid-cols-3">
            {/* Foreigners Can */}
            <div className="bg-gradient-to-br from-navy/70 to-navy/40 rounded-xl p-8 border-l-4 border-red">
              <h3 className="text-gold font-serif font-bold text-2xl mb-6">Foreigners Can:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Own property through leasehold (up to 80 years)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Hold Hak Pakai title with qualifying visa</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Own through Indonesian PT PMA company</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Purchase apartments/condos (strata title)</span>
                </li>
              </ul>
            </div>

            {/* Foreigners Cannot */}
            <div className="bg-gradient-to-br from-navy/70 to-navy/40 rounded-xl p-8 border-l-4 border-red">
              <h3 className="text-gold font-serif font-bold text-2xl mb-6">Foreigners Cannot:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Hold freehold (Hak Milik) title directly</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Own agricultural or plantation land</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Purchase certain strategic locations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Own land without proper legal structure</span>
                </li>
              </ul>
            </div>

            {/* Key Considerations */}
            <div className="bg-gradient-to-br from-navy/70 to-navy/40 rounded-xl p-8 border-l-4 border-red">
              <h3 className="text-gold font-serif font-bold text-2xl mb-6">Key Considerations:</h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Always conduct thorough due diligence</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Use licensed notary (PPAT) for transactions</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Verify land certificates with BPN</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Understand tax implications (BPHTB, PBB)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red font-bold mr-2">✓</span>
                  <span className="text-white">Review local zoning regulations</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <Link
            href="/services/contact"
            className="inline-block bg-red text-white px-12 py-5 rounded-full font-serif font-bold text-lg hover:bg-gold hover:text-black transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)]"
          >
            Start Your Property Journey
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}