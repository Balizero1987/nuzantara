export function CTASection() {
  return (
    <section className="py-20 px-4 md:px-6 lg:px-8 bg-black border-t border-white/10">
      <div className="max-w-4xl mx-auto text-center">
        {/* Main CTA */}
        <div className="space-y-6">
          <h2 className="text-white font-serif font-bold text-4xl md:text-5xl leading-tight">
            Stay Ahead of the Curve
          </h2>

          <p className="text-white/70 font-sans text-lg md:text-xl leading-relaxed">
            Get exclusive access to premium insights, research reports, and AI-powered analysis delivered directly to
            your inbox.
          </p>

          {/* Email Signup */}
          <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto mt-8">
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-black border border-white/20 text-white px-4 py-3 font-sans placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white"
            />
            <button className="bg-white text-black px-6 py-3 font-serif font-bold hover:bg-white/90 transition-colors whitespace-nowrap hover:shadow-[0_0_30px_rgba(255,255,255,0.6)]">
              Subscribe
            </button>
          </div>

          <p className="text-white/50 font-sans text-sm">We respect your privacy. Unsubscribe at any time.</p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-16 pt-16 border-t border-white/10">
          <p className="text-white/50 font-sans text-sm mb-6">TRUSTED BY LEADING ORGANIZATIONS</p>
          <div className="flex flex-wrap justify-center gap-8 items-center">
            {["Fortune 500", "Tech Leaders", "Startups", "Investors"].map((org) => (
              <div key={org} className="text-white/40 font-sans font-medium">
                {org}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
