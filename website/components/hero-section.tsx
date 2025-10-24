export function HeroSection() {
  return (
    <section className="pt-56 md:pt-64 lg:pt-80 pb-20 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6">
            <h1 className="text-white font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-tight">
              <span className="text-balance">Unlock Indonesia.</span>
              <br />
              <span className="text-red">Build Infinity.</span>
            </h1>

            <p className="text-white/80 font-sans text-lg md:text-xl leading-relaxed max-w-lg">
              Powered by ZANTARA Intelligence, we deliver premium business insights and AI-driven analysis for leaders
              who shape tomorrow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="bg-red text-black px-8 py-3 font-serif font-bold hover:bg-red/90 transition-colors hover:shadow-[0_0_30px_rgba(255,0,0,0.5)]">
                Explore Insights
              </button>
              <button className="border border-white text-white px-8 py-3 font-serif font-bold hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Right Visual */}
          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-red/20 to-transparent rounded-lg overflow-hidden">
              <img
                src="/abstract-business-intelligence-dashboard.jpg"
                alt="Business Intelligence Dashboard"
                className="w-full h-full object-cover opacity-80"
              />
              <div className="absolute inset-0 bg-black/40"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
