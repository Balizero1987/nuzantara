"use client"

import { useRef, useEffect } from "react"
import Link from "next/link"

export function ThresholdSection() {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Auto-play video when component mounts
    video.play()
  }, [])

  return (
    <section className="py-16 md:py-24 px-4 md:px-6 lg:px-8 bg-black relative overflow-hidden border-t border-white/10">
      {/* Background Effect */}
      <div className="absolute inset-0 bg-gradient-radial from-red/5 via-transparent to-transparent opacity-50" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Title */}
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-white font-serif font-bold text-4xl md:text-5xl lg:text-6xl mb-4">
            The <span className="text-red">Threshold</span>
          </h2>
          <p className="text-white/70 font-sans text-lg md:text-xl max-w-2xl mx-auto">
            Cross into a world where expertise meets excellence. 
            Your gateway to Indonesian business mastery.
          </p>
        </div>

        {/* Video Container */}
        <div className="max-w-5xl mx-auto">
          <div className="relative rounded-lg overflow-hidden shadow-2xl">
            {/* Video */}
            <video
              ref={videoRef}
              className="w-full h-auto"
              loop
              muted
              playsInline
              autoPlay
            >
              <source src="/Threshold.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>

            {/* Ambient Glow Effect */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-2 border-red/30 rounded-lg animate-pulse" />
            </div>
          </div>

          {/* CTA Button */}
          <div className="text-center mt-12">
            <Link
              href="/services/home"
              className="inline-block border-2 border-red text-red px-10 py-4 font-serif font-bold text-lg tracking-tight hover:bg-red hover:text-black transition-all duration-500 hover:shadow-[0_0_30px_rgba(255,0,0,0.7)] rounded-sm"
            >
              Enter The Threshold
            </Link>
            <p className="text-white/60 font-sans text-sm mt-4">
              Explore our comprehensive services
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
