"use client"

export function HeroSection() {
  return (
    <section className="pt-56 md:pt-64 lg:pt-72 pb-16 px-4 md:px-6 lg:px-8 bg-black">
      <div className="max-w-7xl mx-auto lg:px-[8%]">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <h1 className="text-white font-serif font-bold leading-tight">
              <span className="text-balance block text-5xl md:text-6xl lg:text-7xl animate-fade-in">
                Unlock{" "}
                <span className="text-red">I</span>
                <span className="text-white">n</span>
                <span className="text-red">d</span>
                <span className="text-white">o</span>
                <span className="text-red">n</span>
                <span className="text-white">e</span>
                <span className="text-red">s</span>
                <span className="text-white">i</span>
                <span className="text-red">a</span>.
              </span>
              <span className="text-white block text-4xl md:text-5xl lg:text-6xl mt-2 animate-fade-in-delay">Unleash Potential.</span>
            </h1>

            <p className="text-white/80 font-sans font-light text-lg md:text-xl leading-loose max-w-lg">
              Powered by ZANTARA Intelligence, we deliver premium business insights and AI-driven analysis for leaders
              who shape tomorrow.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button className="bg-red text-black px-8 py-3 font-serif font-bold tracking-tight hover:bg-gold transition-all duration-500 hover:shadow-[0_0_30px_rgba(212,175,55,0.6)]">
                Explore Insights
              </button>
              <button className="border border-white text-white px-8 py-3 font-serif font-bold tracking-tight hover:bg-white/10 transition-colors">
                Learn More
              </button>
            </div>
          </div>

          {/* Right Visual - Animated Video */}
          <div className="relative h-96 md:h-full min-h-96">
            <div className="absolute inset-0 bg-gradient-to-br from-red/30 via-transparent to-blue-500/20 rounded-lg overflow-hidden">
              <video
                key="hero-video-2"
                src="/ruota2.mp4"
                autoPlay
                loop
                muted
                playsInline
                preload="auto"
                className="w-full h-full object-contain vibrant-image"
                onLoadedData={(e) => {
                  const video = e.currentTarget;
                  video.play().catch(err => console.log("Video autoplay blocked:", err));
                }}
              />
              <div className="absolute inset-0 bg-black/20"></div>

              {/* Watermark cover */}
              <div className="absolute bottom-0 right-0 w-32 h-12 bg-gradient-to-tl from-black via-black/90 to-transparent z-10"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Gradiente verticale per transizione scroll - sipario che si apre */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-b from-transparent via-black/50 to-black pointer-events-none"></div>
    </section>
  )
}
