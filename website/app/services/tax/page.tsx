import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function TaxPage() {
  return (
    <main className="batik-pattern min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/sticker/tax-sticker.jpg" 
              alt="Tax Consulting"
              className="w-24 h-24 mx-auto object-contain"
            />
          </div>
          <h1 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
            <span className="text-red">Tax Consulting</span>
          </h1>
          <p className="text-white/70 font-sans text-lg md:text-xl mb-8 max-w-3xl mx-auto">
            Navigate Indonesia's tax system with confidence. Expert guidance for individuals and businesses to ensure full compliance and optimize your tax strategy.
          </p>
        </div>
      </section>

      {/* Our Tax Services Section */}
      <section className="pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl text-center mb-12">
            Our Tax Services
          </h2>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Tax Registration */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Tax Registration</h3>
              <p className="text-white/70">
                Complete NPWP (Tax Identification Number) registration for individuals and companies. Essential for all business operations in Indonesia.
              </p>
            </div>

            {/* Tax Filing & Reporting */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Tax Filing & Reporting</h3>
              <p className="text-white/70">
                Monthly and annual tax return preparation and submission. SPT Masa and SPT Tahunan for corporate and personal income tax.
              </p>
            </div>

            {/* Tax Audit Support */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Tax Audit Support</h3>
              <p className="text-white/70">
                Professional representation during tax audits. Documentation preparation and liaison with Indonesian tax authorities.
              </p>
            </div>

            {/* Corporate Tax Planning */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Corporate Tax Planning</h3>
              <p className="text-white/70">
                Strategic tax optimization for PT PMA and local companies. Minimize tax liability while ensuring full compliance.
              </p>
            </div>

            {/* Transfer Pricing */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Transfer Pricing</h3>
              <p className="text-white/70">
                Transfer pricing documentation and compliance for multinational companies operating in Indonesia.
              </p>
            </div>

            {/* Personal Income Tax */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Personal Income Tax</h3>
              <p className="text-white/70">
                Income tax filing for foreign workers, expats, and Indonesian nationals. Annual reconciliation and optimization.
              </p>
            </div>

            {/* VAT & Withholding Tax */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">VAT & Withholding Tax</h3>
              <p className="text-white/70">
                VAT registration, reporting, and compliance. Withholding tax (PPh 21, 22, 23, 26) management and filing.
              </p>
            </div>

            {/* Tax Incentives & Reliefs */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Tax Incentives & Reliefs</h3>
              <p className="text-white/70">
                Identify and apply for tax incentives, holidays, and reliefs available for your business sector.
              </p>
            </div>

            {/* Tax Health Check */}
            <div className="bg-navy/20 rounded-lg p-8 border border-white/10 hover:border-red/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.2)] hover:transform hover:-translate-y-1">
              <h3 className="text-white font-serif font-bold text-2xl mb-4">Tax Health Check</h3>
              <p className="text-white/70">
                Comprehensive review of your current tax position. Identify risks, opportunities, and areas for improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto bg-navy/30 rounded-2xl p-12 border border-white/10">
          <h2 className="text-gold font-serif font-bold text-3xl md:text-4xl text-center mb-12">
            Why Choose Bali Zero for Tax Consulting?
          </h2>
          
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Expert Compliance</h3>
              <p className="text-cream/80">
                Navigate complex Indonesian tax regulations with certified tax consultants who ensure full compliance.
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Strategic Optimization</h3>
              <p className="text-cream/80">
                Minimize your tax burden legally through strategic planning and utilization of available incentives.
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Government Relations</h3>
              <p className="text-cream/80">
                Direct liaison with Indonesian tax office (DJP) on your behalf for all tax-related matters.
              </p>
            </div>

            <div className="text-center">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Deadline Management</h3>
              <p className="text-cream/80">
                Never miss a tax filing deadline with our proactive reminder system and timely submissions.
              </p>
            </div>
          </div>
        </div>
      </section>
          
      {/* CTA Section */}
      <section className="pb-24 px-4 md:px-6 lg:px-8">
        <div className="text-center">
          <Link
            href="/services/contact"
            className="inline-block bg-red text-black px-8 py-4 font-serif font-bold text-lg hover:bg-red/90 transition-all duration-300 hover:shadow-[0_0_30px_rgba(255,0,0,0.6)] hover:transform hover:-translate-y-1 rounded-full"
          >
            Get Tax Consultation
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}