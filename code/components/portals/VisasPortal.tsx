"use client"

import { motion } from "framer-motion"

interface VisasPortalProps {
  onNavigate: (portal: "home" | "visas" | "decode" | "about") => void
}

export default function VisasPortal({ onNavigate }: VisasPortalProps) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden text-center bg-[#0b0b0b] text-gray-100 font-sans tracking-[0.3px]">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(70vmax 70vmax at 20% 30%, rgba(214,178,94,0.12), transparent 60%), radial-gradient(70vmax 70vmax at 80% 70%, rgba(214,178,94,0.08), transparent 65%)",
            filter: "blur(60px)",
            mixBlendMode: "screen",
          }}
          animate={{ scale: [1, 1.03, 1.02, 1] }}
          transition={{
            duration: 24,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-2xl mx-auto px-4 md:px-6 w-full py-8"
      >
        <h1 className="font-serif text-3xl md:text-4xl tracking-widest uppercase text-[#d6b25e] mb-6 md:mb-8 text-balance">
          Crossing Borders
        </h1>

        <div className="space-y-6 md:space-y-8 mb-10 md:mb-12">
          <p className="leading-relaxed text-[#e8e8e8] text-sm md:text-base text-pretty">
            Visas are more than documents—they are the keys to transformation. We navigate the labyrinth of immigration
            law, work permits, and residency requirements with precision and wisdom.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {[
              { title: "Work Permits", desc: "Navigate employment authorization across borders." },
              { title: "Residency", desc: "Establish legal presence in your chosen homeland." },
              { title: "Investment Visas", desc: "Bridge capital and opportunity globally." },
              { title: "Digital Nomad", desc: "Freedom to work from anywhere, legally." },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="p-4 md:p-6 border border-[#2c2c2c] rounded-md hover:border-[#d6b25e] hover:bg-[#d6b25e]/5 transition-all cursor-pointer"
              >
                <p className="text-[#d6b25e] font-semibold mb-2 text-sm md:text-base">{item.title}</p>
                <p className="text-xs md:text-sm text-gray-400">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => onNavigate("home")}
          className="px-6 py-2 border border-[#d6b25e] text-[#d6b25e] rounded-md hover:bg-[#d6b25e] hover:text-[#0b0b0b] transition-all font-medium text-sm md:text-base"
        >
          Back to Home
        </motion.button>
      </motion.div>

      <footer className="mt-12 md:mt-16 text-xs md:text-sm text-gray-500 px-4 pb-4">
        ∞ Bali Zero is powered by humans.
      </footer>
    </div>
  )
}
