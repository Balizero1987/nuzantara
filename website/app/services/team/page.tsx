import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"

interface TeamMember {
  initials: string
  name: string
  role: string
  hasImage?: boolean
  imagePath?: string
}

interface Department {
  name: string
  members: TeamMember[]
}

const teamData: Department[] = [
  {
    name: "Leadership",
    members: [
      { initials: "ZA", name: "Zainal Abidin", role: "Chief Executive Officer" },
      { initials: "RS", name: "Ruslana", role: "Board Member" }
    ]
  },
  {
    name: "Setup Team",
    members: [
      { initials: "AM", name: "Amanda", role: "Executive Consultant" },
      { initials: "AN", name: "Anton", role: "Executive Consultant" },
      { initials: "VI", name: "Vino", role: "Junior Consultant" },
      { initials: "KR", name: "Krisna", role: "Executive Consultant" },
      { initials: "AD", name: "Adit", role: "Crew Lead" },
      { initials: "AR", name: "Ari", role: "Specialist Consultant" },
      { initials: "DE", name: "Dea", role: "Executive Consultant" },
      { initials: "SU", name: "Surya", role: "Specialist Consultant" },
      { initials: "DM", name: "Damar", role: "Junior Consultant" },
      { initials: "MA", name: "Marta", role: "External Advisory" }
    ]
  },
  {
    name: "Tax Department",
    members: [
      { initials: "VE", name: "Veronika", role: "Tax Manager" },
      { initials: "AG", name: "Angel", role: "Tax Expert" },
      { initials: "KD", name: "Kadek", role: "Tax Consultant" },
      { initials: "DA", name: "Dewa Ayu", role: "Tax Consultant" },
      { initials: "FA", name: "Faisha", role: "Tax Care" },
      { initials: "OL", name: "Olena", role: "External Advisory" }
    ]
  },
  {
    name: "Reception",
    members: [
      { initials: "RI", name: "Rina", role: "Reception" }
    ]
  },
  {
    name: "Marketing",
    members: [
      { initials: "NI", name: "Nina", role: "Marketing Advisory - External" },
      { initials: "SH", name: "Sahira", role: "Marketing Specialist" },
      { initials: "", name: "Zero", role: "AI Bridge", hasImage: true, imagePath: "/sticker/team-zero.jpg" }
    ]
  }
]

export default function TeamPage() {
  return (
    <main className="bg-black batik-pattern min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-48 pb-16 px-4 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto text-center">
          <div className="w-44 h-44 mx-auto mb-8 rounded-2xl p-6 bg-gradient-to-br from-gold/10 to-red/5 border-2 border-gold/20 hover:scale-105 transition-transform duration-300">
            <img 
              src="/sticker/team-collaboration-sticker.png" 
              alt="Team Collaboration"
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-white font-serif font-bold text-5xl md:text-6xl lg:text-7xl mb-6">
            Our Team
          </h1>
          <p className="text-cream font-sans text-xl md:text-2xl mb-8 max-w-3xl mx-auto font-light">
            Meet the people behind Bali Zero — experienced professionals dedicated to making your Indonesian journey seamless and successful.
          </p>
        </div>
      </section>

      {/* Team Departments */}
      <section className="pb-24 px-4 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {teamData.map((department, deptIndex) => (
            <div key={deptIndex} className="mb-24">
              {/* Department Title */}
              <div className="relative text-center mb-12">
                <h2 className="text-gold font-serif font-bold text-3xl md:text-4xl uppercase tracking-wider">
                  {department.name}
                </h2>
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-4 w-24 h-1 bg-gradient-to-r from-red to-gold"></div>
              </div>

              {/* Team Grid - Different layouts for Leadership vs other departments */}
              <div className={
                department.name === "Leadership" 
                  ? "grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
                  : department.name === "Reception"
                  ? "flex justify-center"
                  : "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
              }>
                {department.members.map((member, index) => (
                  <div 
                    key={index} 
                    className={`
                      bg-gradient-to-br from-navy to-navy/70 border border-cream/15 rounded-2xl text-center 
                      transition-all duration-500 relative overflow-hidden group hover:-translate-y-2 hover:border-red 
                      hover:shadow-[0_20px_60px_rgba(255,0,0,0.25)]
                      ${department.name === "Leadership" ? "p-12" : "p-8"}
                      ${department.name === "Reception" ? "max-w-sm" : ""}
                    `}
                  >
                    {/* Top gradient bar on hover */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red to-gold transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500"></div>
                    
                    {/* Avatar */}
                    <div className={`
                      mx-auto mb-6 rounded-full bg-gradient-to-br from-red to-gold 
                      flex items-center justify-center font-serif font-black text-black 
                      border-4 border-cream/20 group-hover:scale-110 group-hover:shadow-[0_10px_30px_rgba(212,175,55,0.4)] 
                      transition-all duration-300 overflow-hidden
                      ${department.name === "Leadership" ? "w-36 h-36 text-4xl" : "w-28 h-28 text-3xl"}
                    `}>
                      {member.hasImage ? (
                        <img 
                          src={member.imagePath} 
                          alt={member.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        member.initials
                      )}
                    </div>
                    
                    {/* Name and Role */}
                    <h3 className={`
                      text-white font-serif font-bold mb-2
                      ${department.name === "Leadership" ? "text-3xl" : "text-2xl"}
                    `}>
                      {member.name}
                    </h3>
                    <p className={`
                      text-gold font-medium uppercase tracking-wide
                      ${department.name === "Leadership" ? "text-base" : "text-sm"}
                    `}>
                      {member.role}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Expertise Section */}
          <div className="mt-24 grid gap-8 md:grid-cols-2 max-w-4xl mx-auto">
            <div className="bg-gradient-to-br from-navy/40 to-navy/20 rounded-2xl p-10 border border-cream/15 hover:border-gold transition-colors duration-300">
              <h3 className="text-white font-serif font-bold text-3xl mb-6">Local Expertise</h3>
              <p className="text-cream/80 mb-6 text-lg">Deep understanding of Indonesian regulations and culture</p>
              <ul className="text-cream/60 space-y-3 text-base">
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>Local Indonesian Partners</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>Government Relations</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>Regulatory Expertise</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>Cultural Understanding</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-gradient-to-br from-navy/40 to-navy/20 rounded-2xl p-10 border border-cream/15 hover:border-gold transition-colors duration-300">
              <h3 className="text-white font-serif font-bold text-3xl mb-6">International Experience</h3>
              <p className="text-cream/80 mb-6 text-lg">Global perspective with local implementation</p>
              <ul className="text-cream/60 space-y-3 text-base">
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>International Business</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>Cross-Border Expertise</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>Multi-Language Support</span>
                </li>
                <li className="flex items-start">
                  <span className="text-gold mr-3">•</span>
                  <span>Global Best Practices</span>
                </li>
              </ul>
            </div>
          </div>
          
          {/* Team CTA */}
          <div className="text-center mt-20">
            <Link
              href="/services/contact"
              className="inline-block bg-red text-black px-10 py-5 font-serif font-bold text-lg hover:bg-red/90 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-105"
            >
              Work with Our Team
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}