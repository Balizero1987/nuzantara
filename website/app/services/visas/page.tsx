import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

export default function VisasPage() {
  return (
    <main className="batik-pattern min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <img 
              src="/sticker/visa-sticker.jpg" 
              alt="Visa Services"
              className="w-24 h-24 mx-auto object-contain"
            />
          </div>
          <h1 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-6">
            <span className="text-red">Visa Services</span>
          </h1>
          <p className="text-white/70 font-sans text-lg md:text-xl mb-8">
            Complete visa solutions for living and working in Indonesia
          </p>
        </div>
      </section>

      {/* Visit Visas (C) */}
      <section className="pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl mb-8">Visit Visas (C)</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">C1 Visit Visa</h3>
              <p className="text-white/70 mb-4">Perfect for tourism, visiting friends or family, and attending meetings or exhibitions.</p>
              <div className="text-red font-bold">Up to 180 days</div>
              <div className="text-white/60 text-sm mt-2">Initial e-visa valid 60 days</div>
            </div>
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">C2 Business Visa</h3>
              <p className="text-white/70 mb-4">Ideal for business activities, meetings, or shopping. Valid up to 180 days.</p>
              <div className="text-red font-bold">Business Activities</div>
              <div className="text-white/60 text-sm mt-2">Single entry visa</div>
            </div>
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">C7 Professional Visa</h3>
              <p className="text-white/70 mb-4">For invited professionals like chefs, yoga instructors, and photographers.</p>
              <div className="text-red font-bold">30 Days</div>
              <div className="text-white/60 text-sm mt-2">Event participation visa</div>
            </div>
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">C7AB Music Visa</h3>
              <p className="text-white/70 mb-4">For foreigners performing or displaying work related to music.</p>
              <div className="text-red font-bold">Musical Performance</div>
            </div>
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">C22A Academic Internship</h3>
              <p className="text-white/70 mb-4">For individuals engaging in internship activities to fulfill academic requirements.</p>
              <div className="text-red font-bold">60 or 180 Days</div>
            </div>
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">C22B Skills Development</h3>
              <p className="text-white/70 mb-4">For undertaking internship activities aimed at developing skills within a company.</p>
              <div className="text-red font-bold">Skills Development</div>
            </div>
          </div>
        </div>
      </section>

      {/* Multiple Entry Visas (D) */}
      <section className="pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl mb-8">Multiple Entry Visas (D)</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">D1 Visit Visa</h3>
              <p className="text-white/70 mb-4">Ideal for attending meetings, conventions, exhibitions, tourism, and visiting family.</p>
              <div className="text-red font-bold">1 or 2 Years</div>
              <div className="text-white/60 text-sm mt-2">Multiple entries</div>
            </div>
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">D2 Business Visa</h3>
              <p className="text-white/70 mb-4">Perfect for business activities, meetings, or shopping with multiple entries.</p>
              <div className="text-red font-bold">Multiple Entries</div>
            </div>
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">D12 Investment Investigation</h3>
              <p className="text-white/70 mb-4">For investigating starting business in Indonesia, permitting site visits and feasibility studies.</p>
              <div className="text-red font-bold">Pre-Investment</div>
            </div>
          </div>
        </div>
      </section>

      {/* KITAS Section */}
      <section className="pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl mb-8">KITAS (Work & Stay Permits)</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Working KITAS (E23)</h3>
              <p className="text-white/70 mb-4">Longer stay permit for foreign nationals working in Indonesia for 1 year.</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• 1 year validity</li>
                <li>• Multiple entry permit</li>
                <li>• Work authorization included</li>
              </ul>
              <div className="text-red font-bold">1 Year Validity</div>
            </div>
            
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Freelance KITAS (E23)</h3>
              <p className="text-white/70 mb-4">For freelancers and remote workers based in Bali. Linked with working permit (IMTA).</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• Work without specific employer</li>
                <li>• Up to 6 months validity</li>
                <li>• Includes IMTA work permit</li>
              </ul>
              <div className="text-red font-bold">Freelance Work</div>
            </div>

            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Investor KITAS (E28A)</h3>
              <p className="text-white/70 mb-4">For foreign investors who have invested through a PT PMA (foreign investment company).</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• 2 years validity</li>
                <li>• For PT PMA investors</li>
                <li>• Multiple entry</li>
              </ul>
              <div className="text-red font-bold">Investment</div>
            </div>

            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Dependent KITAS (E31B & E31E)</h3>
              <p className="text-white/70 mb-4">For dependent family members of KITAS and long-stay visa holders (including Golden Visa, Working, Investor and Kitap).</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• For family members</li>
                <li>• 1 or 2 years validity</li>
                <li>• Dependent on main permit holder</li>
              </ul>
              <div className="text-red font-bold">Family Permit</div>
            </div>

            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Retirement KITAS (E33F)</h3>
              <p className="text-white/70 mb-4">For foreign nationals aged 60 and above who want to enjoy retirement in this country.</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• Age 60 and above</li>
                <li>• 1 year validity</li>
                <li>• Multiple entry permit</li>
              </ul>
              <div className="text-red font-bold">Retirement</div>
            </div>

            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Spouse KITAS (E31A)</h3>
              <p className="text-white/70 mb-4">For foreign citizens who are married to Indonesian citizens.</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• 1 or 2 years validity</li>
                <li>• Multiple entry permit</li>
                <li>• Marriage certificate required</li>
              </ul>
              <div className="text-red font-bold">Spouse Permit</div>
            </div>
          </div>
        </div>
      </section>

      {/* KITAP Section */}
      <section className="pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-white font-serif font-bold text-3xl mb-8">KITAP (Permanent Residence)</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Investor KITAP</h3>
              <p className="text-white/70 mb-4">Permanent residence permit for long-term investors who have held investment KITAS for consecutive years.</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• Permanent residence</li>
                <li>• For long-term investors</li>
                <li>• Consecutive KITAS required</li>
              </ul>
              <div className="text-red font-bold">Permanent</div>
            </div>

            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Working KITAP</h3>
              <p className="text-white/70 mb-4">Permanent residence for foreigners who have held working KITAS for 4 consecutive years.</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• Permanent residence</li>
                <li>• 4 consecutive KITAS required</li>
                <li>• For established workers</li>
              </ul>
              <div className="text-red font-bold">Permanent</div>
            </div>

            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Family KITAP</h3>
              <p className="text-white/70 mb-4">For family members of Indonesian citizens or permanent residents.</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• Family based permit</li>
                <li>• For Indonesian citizen families</li>
                <li>• Permanent residence</li>
              </ul>
              <div className="text-red font-bold">Family Based</div>
            </div>

            <div className="bg-navy/20 rounded-lg p-6 border border-white/10">
              <h3 className="text-white font-serif font-bold text-xl mb-3">Retirement KITAP</h3>
              <p className="text-white/70 mb-4">Permanent residence for retirees who have held retirement KITAS for consecutive years.</p>
              <ul className="text-white/60 text-sm mb-3 space-y-1">
                <li>• Permanent residence</li>
                <li>• For established retirees</li>
                <li>• Consecutive retirement KITAS required</li>
              </ul>
              <div className="text-red font-bold">Retirement</div>
            </div>
          </div>
        </div>
      </section>
          
      {/* CTA */}
      <section className="pb-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h3 className="text-white font-serif font-bold text-2xl mb-4">Need Help with Your Visa Application?</h3>
          <p className="text-white/70 mb-8">Our expert team can guide you through the entire visa process</p>
          <Link
            href="/services/contact"
            className="inline-block bg-red text-black px-8 py-4 font-serif font-bold hover:bg-red/90 transition-colors hover:shadow-[0_0_30px_rgba(255,0,0,0.25)]"
          >
            Get Started with Visa Services
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}