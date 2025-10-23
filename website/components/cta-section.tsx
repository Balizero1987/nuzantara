export function CTASection() {
  return (
    <section className="relative py-24 px-4 md:px-6 lg:px-8 bg-black border-t border-[#2a2a2a] overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 batik-pattern opacity-10 pointer-events-none"></div>
      <div className="absolute inset-0 gradient-overlay-navy pointer-events-none"></div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Main CTA - Warm Indonesian Invitation */}
        <div className="space-y-8">
          {/* Indonesian greeting */}
          <div className="inline-block">
            <span className="text-[#D4AF37] font-serif font-medium text-sm tracking-wide">
              Mari Bersama! (Let's Walk Together) 🌴
            </span>
          </div>

          <h2 className="text-[#f5f5f5] font-serif font-bold text-4xl md:text-5xl leading-tight">
            Your Indonesia Journey
            <br />
            <span className="text-[#e8d5b7]">Starts Today</span>
          </h2>

          {/* Warm, conversational description */}
          <p className="text-[#f5f5f5]/80 font-sans text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            Get exclusive insights, real journey stories, and ZANTARA's cultural wisdom
            delivered directly to your inbox. No corporate jargon — just warm, practical
            guidance from people who've walked the path.
          </p>

          {/* Email Signup - More welcoming */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
            <input
              type="email"
              placeholder="your@email.com"
              className="flex-1 bg-[#1a1f3a] text-[#f5f5f5] px-5 py-4 font-sans placeholder-[#f5f5f5]/40 focus:outline-none focus:ring-2 focus:ring-[#FF0000] border border-[#2a2a2a] rounded"
            />
            <button className="bg-[#FF0000] text-black px-8 py-4 font-serif font-bold hover:bg-[#FF0000]/90 transition-all duration-300 whitespace-nowrap glow-red-subtle hover:glow-red-medium rounded">
              Join the Journey
            </button>
          </div>

          {/* Privacy note - more personal */}
          <p className="text-[#f5f5f5]/50 font-sans text-sm">
            We respect your inbox. Unsubscribe anytime. No spam, just stories.
          </p>
        </div>

        {/* Trust Indicators - Indonesian Community Focus */}
        <div className="mt-20 pt-16 border-t border-[#2a2a2a]">
          <p className="text-[#D4AF37] font-serif text-sm mb-8 tracking-wide">
            TRUSTED BY THE INDONESIA COMMUNITY
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
            {[
              { label: "1000+ Journeys Guided", icon: "🛂" },
              { label: "Based in Bali", icon: "🌴" },
              { label: "ZANTARA Intelligence", icon: "🤖" },
              { label: "Indonesian Soul", icon: "🕉️" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex flex-col items-center gap-2 text-center group cursor-pointer"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform duration-300">
                  {item.icon}
                </span>
                <span className="text-[#f5f5f5]/70 font-sans font-medium text-sm group-hover:text-[#FF0000] transition-colors">
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ZANTARA quote */}
        <div className="mt-16">
          <p className="text-[#f5f5f5]/70 font-serif text-lg italic">
            "In Indonesia, we don't rush — we journey together with purpose and warmth."
          </p>
          <p className="text-[#e8d5b7] text-sm mt-2 font-sans">— ZANTARA</p>
        </div>
      </div>
    </section>
  )
}
