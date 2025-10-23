export function HeroSection() {
  return (
    <section className="relative pt-32 pb-20 px-4 md:px-6 lg:px-8 bg-black overflow-hidden">
      {/* Subtle navy gradient overlay for depth */}
      <div className="absolute inset-0 gradient-overlay-navy pointer-events-none"></div>

      {/* Batik pattern background (subtle Indonesian touch) */}
      <div className="absolute inset-0 batik-pattern opacity-30 pointer-events-none"></div>

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content - Indonesian Welcome */}
          <div className="space-y-8">
            {/* Indonesian Greeting */}
            <div className="inline-block">
              <span className="text-[#e8d5b7] font-serif font-medium text-sm tracking-wide">
                Selamat Datang! 🙏
              </span>
            </div>

            {/* Main Headline - "From Zero to Infinity" */}
            <div className="space-y-4">
              <h1 className="text-[#f5f5f5] font-serif font-bold text-5xl md:text-6xl lg:text-7xl leading-tight">
                Your Indonesia Journey
              </h1>

              {/* Infinity Symbol with Gold Accent */}
              <div className="flex items-center gap-4">
                <div className="h-px flex-1 bg-gradient-to-r from-[#FF0000] to-transparent"></div>
                <span className="text-[#D4AF37] font-serif font-bold text-2xl md:text-3xl tracking-wider">
                  From Zero to Infinity ∞
                </span>
                <div className="h-px flex-1 bg-gradient-to-l from-[#FF0000] to-transparent"></div>
              </div>
            </div>

            {/* Warm, Conversational Subheading */}
            <p className="text-[#f5f5f5]/80 font-sans text-lg md:text-xl leading-relaxed max-w-lg">
              Whether you're starting your first visa, building a company in Bali,
              or searching for your new home in Nusantara — every great journey starts at Zero.
            </p>

            {/* Powered by ZANTARA (subtle mention) */}
            <p className="text-[#e8d5b7]/60 font-sans text-sm italic">
              Guided by ZANTARA Intelligence — your warm companion with Indonesian soul
            </p>

            {/* CTAs - Warm & Action-oriented */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="group bg-[#FF0000] text-black px-8 py-4 font-serif font-bold hover:bg-[#FF0000]/90 transition-all duration-300 glow-red-subtle hover:glow-red-medium">
                <span className="flex items-center gap-2">
                  Start Your Journey
                  <span className="group-hover:translate-x-1 transition-transform">→</span>
                </span>
              </button>
              <button className="border-2 border-[#e8d5b7] text-[#e8d5b7] px-8 py-4 font-serif font-bold hover:bg-[#e8d5b7]/10 transition-all duration-300">
                Explore Insights
              </button>
            </div>

            {/* Trust Indicators (Subtle) */}
            <div className="pt-6 flex items-center gap-6 text-[#f5f5f5]/50 text-sm font-sans">
              <div className="flex items-center gap-2">
                <span className="text-[#FF0000]">✓</span>
                <span>1000+ Journeys Guided</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#FF0000]">✓</span>
                <span>Based in Bali</span>
              </div>
            </div>
          </div>

          {/* Right Visual - Hero Image Placeholder */}
          <div className="relative h-96 md:h-full min-h-[500px]">
            {/* Dark overlay container with red glow */}
            <div className="absolute inset-0 rounded-lg overflow-hidden glow-red-subtle">
              {/* Placeholder for hero image (will be replaced with ImagineArt generated image) */}
              <img
                src="/placeholder.svg"
                alt="Bali ricefield terraces at sunrise - Your Indonesia Journey"
                className="w-full h-full object-cover"
              />

              {/* Gradient overlay for text readability */}
              <div className="absolute inset-0 gradient-overlay-dark"></div>

              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity shimmer pointer-events-none"></div>

              {/* Optional: Overlay quote/text on image */}
              <div className="absolute bottom-8 left-8 right-8">
                <p className="text-[#f5f5f5] font-serif text-xl md:text-2xl italic">
                  "In Bali, we don't just process visas — we welcome you home."
                </p>
                <p className="text-[#e8d5b7] text-sm mt-2 font-sans">— ZANTARA</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
