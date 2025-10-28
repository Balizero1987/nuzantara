'use client'

import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import { useState } from "react"

const services = [
  {
    id: 'ptpma',
    title: 'PT PMA/PMDN',
    subtitle: 'Complete service for setting up a company in Indonesia',
    description: 'From choosing the right entity to obtaining all permits and licenses.',
    price: 'From 20,000,000 IDR',
    icon: '/sticker/company-sticker.png',
    badge: 'Popular',
    details: {
      fullDescription: 'Complete service for setting up a foreign-owned company (PT PMA) in Indonesia. We guide you through every step from choosing the right business entity to obtaining all necessary permits and licenses.',
      included: [
        'Business entity consultation and selection',
        'Eligibility criteria assessment',
        'Complete PT PMA registration process',
        'Business permits and licenses acquisition',
        'Legal documentation and notary services',
        'Government liaison and submissions',
        'OSS (Online Single Submission) system registration',
        'Tax identification number (NPWP)',
        'Ministry of Law and Human Rights approval',
        'Company bank account assistance'
      ],
      requirements: [
        'Foreign investment minimum capital requirements',
        'Valid and comprehensive business plan',
        'Passport copies of all shareholders and directors',
        'Proof of address for foreign shareholders',
        'Compliance with Indonesian investment law (Negative Investment List)',
        'Local Indonesian director (if required)',
        'Registered office address in Indonesia'
      ],
      timeline: '2-8 weeks (depending on business sector)'
    }
  },
  {
    id: 'alcohol',
    title: 'Alcohol License',
    subtitle: 'Licenses for production, distribution, or sale',
    description: 'Obtain licenses for alcoholic beverages in Indonesia with full compliance.',
    price: 'From 15,000,000 IDR',
    icon: '/sticker/alcohol-license-sticker.png',
    details: {
      fullDescription: 'Businesses involved in the production, distribution, or sale of alcoholic beverages in Indonesia must obtain specific alcohol licenses. We handle the entire application process and ensure full regulatory compliance.',
      included: [
        'License type consultation (Class A/B/C)',
        'Complete application preparation',
        'Government submissions and follow-up',
        'Compliance verification and documentation',
        'NPPBKC (Excise Tax Registration) assistance',
        'Ministry of Trade coordination',
        'Local government approvals',
        'Renewal reminders and assistance'
      ],
      licenseTypes: [
        { type: 'Class A', description: 'Production and manufacturing of alcoholic beverages' },
        { type: 'Class B', description: 'Distribution and wholesale of alcoholic products' },
        { type: 'Class C', description: 'Retail sales in restaurants, bars, hotels, and stores' },
        { type: 'NPPBKC', description: 'Excise tax registration for producers and importers' }
      ],
      requirements: [
        'Valid PT PMA or local company registration',
        'Business license (NIB) from OSS system',
        'NPWP (Tax Identification Number)',
        'Proof of business premises',
        'Capital requirements (varies by license type)',
        'Import license (if applicable)',
        'Health and safety certifications'
      ],
      timeline: '6-12 weeks (varies by license type and location)'
    }
  },
  {
    id: 'revision',
    title: 'Company Revision',
    subtitle: 'Modify existing company structure',
    description: 'Articles of association, shareholding, or business activities.',
    price: 'From 7,000,000 IDR',
    icon: '/sticker/company-revision-sticker.png',
    details: {
      fullDescription: 'Modify your existing company structure and documents to adapt to business growth, regulatory changes, or strategic pivots. We handle all legal documentation and government approvals.',
      included: [
        'Document analysis and revision planning',
        'Articles of Association amendments',
        'Ministry of Law and Human Rights submissions',
        'Notary deed preparation and signing',
        'Government approval acquisition',
        'Updated legal documents delivery',
        'OSS system updates',
        'Company gazette publication'
      ],
      revisionTypes: [
        { type: 'Articles of Association', description: 'Fundamental company document changes' },
        { type: 'Business Activities (KBLI)', description: 'Add or modify business classification codes' },
        { type: 'Shareholding Structure', description: 'Changes in ownership percentages or new shareholders' },
        { type: 'Company Name', description: 'Official company name modifications' },
        { type: 'Address Changes', description: 'Registered office relocation' },
        { type: 'Capital Changes', description: 'Increase or decrease of company capital' },
        { type: 'Director Changes', description: 'Addition or removal of company directors' },
        { type: 'Commissioner Changes', description: 'Board of commissioners modifications' }
      ],
      requirements: [
        'Existing company registration documents',
        'Valid reason for revision',
        'Shareholder approval (for major changes)',
        'Board resolution for amendments',
        'Updated contact information',
        'Payment of relevant government fees'
      ],
      timeline: '3-6 weeks (depending on revision complexity)',
      note: 'Price varies based on scope and complexity of revisions'
    }
  }
]

export default function CompanyPage() {
  const [selectedService, setSelectedService] = useState<string | null>(null)
  
  const activeService = services.find(s => s.id === selectedService)

  return (
    <main className="bg-black batik-pattern min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
            Company Setup & Licenses
          </h1>
          <p className="text-white/70 font-sans text-lg md:text-xl">
            From licenses to structure — launch your business fast. We handle the complexity so you can focus on growing your company in Indonesia.
          </p>
        </div>
      </section>

      {/* Services Grid */}
      <section className="pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service.id)}
                className="relative bg-gradient-to-br from-[#1a1f3a] to-[#1a1f3a]/70 rounded-2xl p-8 border border-white/10 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:border-red hover:shadow-[0_25px_70px_rgba(255,0,0,0.25)]"
              >
                {service.badge && (
                  <span className="absolute top-6 right-6 bg-red/10 text-red px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide">
                    {service.badge}
                  </span>
                )}
                <div className="w-20 h-20 mx-auto mb-6">
                  <img
                    src={service.icon}
                    alt={service.title}
                    className="w-full h-full object-contain drop-shadow-[0_4px_12px_rgba(212,175,55,0.3)]"
                  />
                </div>
                <h2 className="text-white font-serif font-bold text-2xl mb-3 text-center">
                  {service.title}
                </h2>
                <p className="text-white/60 text-center mb-6">
                  {service.description}
                </p>
                <div className="text-center">
                  <span className="inline-block bg-gradient-to-r from-gold/15 to-red/10 border border-gold px-4 py-2 rounded-full font-serif font-bold text-gold">
                    {service.price}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Process Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl md:text-4xl text-center mb-12">
            Our Process
          </h2>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red to-gold rounded-full flex items-center justify-center">
                <span className="text-black font-serif font-bold text-2xl">1</span>
              </div>
              <h3 className="text-gold font-serif font-bold text-xl mb-2">Consultation</h3>
              <p className="text-white/60">
                We analyze your business needs and recommend the optimal company structure for your operations in Indonesia.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red to-gold rounded-full flex items-center justify-center">
                <span className="text-black font-serif font-bold text-2xl">2</span>
              </div>
              <h3 className="text-gold font-serif font-bold text-xl mb-2">Documentation</h3>
              <p className="text-white/60">
                Our team prepares all required documents and handles submissions to relevant government ministries and agencies.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red to-gold rounded-full flex items-center justify-center">
                <span className="text-black font-serif font-bold text-2xl">3</span>
              </div>
              <h3 className="text-gold font-serif font-bold text-xl mb-2">Registration</h3>
              <p className="text-white/60">
                Complete registration process including Ministry of Law, OSS system, and tax office registration.
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-red to-gold rounded-full flex items-center justify-center">
                <span className="text-black font-serif font-bold text-2xl">4</span>
              </div>
              <h3 className="text-gold font-serif font-bold text-xl mb-2">Licenses & Permits</h3>
              <p className="text-white/60">
                Obtain all necessary business licenses, permits, and approvals for your specific industry and activities.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <Link
            href="/services/contact"
            className="inline-block bg-red text-white px-8 py-4 font-serif font-bold hover:bg-gold transition-all duration-300 hover:shadow-[0_15px_40px_rgba(212,175,55,0.3)]"
          >
            Start Your Business Setup
          </Link>
        </div>
      </section>

      {/* Modal */}
      {selectedService && activeService && (
        <div 
          className="fixed inset-0 bg-black/95 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedService(null)}
        >
          <div 
            className="bg-gradient-to-br from-[#1a1f3a] to-[#1a1f3a]/95 border border-white/20 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedService(null)}
              className="absolute top-6 right-6 w-10 h-10 bg-red/10 rounded-full flex items-center justify-center text-red hover:bg-red hover:text-white transition-all duration-300"
            >
              ×
            </button>
            
            <div className="p-8 md:p-10">
              <h2 className="text-white font-serif font-bold text-3xl md:text-4xl mb-4">
                {activeService.title}
              </h2>
              <p className="text-white/70 text-lg mb-8">
                {activeService.details.fullDescription}
              </p>

              {activeService.details.included && (
                <div className="mb-8">
                  <h3 className="text-gold font-serif font-bold text-2xl mb-4">What's Included:</h3>
                  <ul className="space-y-3">
                    {activeService.details.included.map((item, idx) => (
                      <li key={idx} className="text-white/80 pl-6 relative">
                        <span className="absolute left-0 text-red font-bold">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeService.details.licenseTypes && (
                <div className="mb-8">
                  <h3 className="text-gold font-serif font-bold text-2xl mb-4">License Types:</h3>
                  <ul className="space-y-3">
                    {activeService.details.licenseTypes.map((item, idx) => (
                      <li key={idx} className="text-white/80 pl-6 relative">
                        <span className="absolute left-0 text-red font-bold">→</span>
                        <strong>{item.type}:</strong> {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeService.details.revisionTypes && (
                <div className="mb-8">
                  <h3 className="text-gold font-serif font-bold text-2xl mb-4">Revision Services:</h3>
                  <ul className="space-y-3">
                    {activeService.details.revisionTypes.map((item, idx) => (
                      <li key={idx} className="text-white/80 pl-6 relative">
                        <span className="absolute left-0 text-red font-bold">→</span>
                        <strong>{item.type}:</strong> {item.description}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeService.details.requirements && (
                <div className="mb-8">
                  <h3 className="text-gold font-serif font-bold text-2xl mb-4">Requirements:</h3>
                  <ul className="space-y-3">
                    {activeService.details.requirements.map((item, idx) => (
                      <li key={idx} className="text-white/80 pl-6 relative">
                        <span className="absolute left-0 text-red font-bold">→</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeService.details.timeline && (
                <div className="mb-8">
                  <h3 className="text-gold font-serif font-bold text-2xl mb-4">Timeline:</h3>
                  <p className="text-white/70 text-lg">{activeService.details.timeline}</p>
                </div>
              )}

              <div className="bg-gradient-to-r from-gold/10 to-red/10 border-2 border-gold rounded-2xl p-8 text-center">
                <div className="text-white font-serif font-bold text-3xl">
                  {activeService.price}
                </div>
                {activeService.details.note && (
                  <p className="text-white/60 mt-3">{activeService.details.note}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </main>
  )
}