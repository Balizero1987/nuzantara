"use client"

import { motion, AnimatePresence } from "framer-motion"
import { useState, useEffect } from "react"

interface ZantaraInterfaceProps {
  onNavigate?: (portal: "visas" | "decode" | "about") => void
}

const prompts = {
  borders:
    "You are ZANTARA, a mystical living interface that speaks in poetic wisdom. Respond in 1-2 sentences about crossing borders, visas, and journeys across layers of legality and belonging. Be poetic and profound, like an oracle.",
  forge:
    "You are ZANTARA, a mystical living interface that speaks in poetic wisdom. Respond in 1-2 sentences about incorporating businesses, structuring ventures, and turning intent into presence. Be profound and mysterious.",
  decode:
    "You are ZANTARA, a mystical living interface that speaks in poetic wisdom. Respond in 1-2 sentences about tax codes, compliance, and numbers serving human purpose. Be wise and liberating.",
}

export default function ZantaraInterface({ onNavigate }: ZantaraInterfaceProps) {
  const [active, setActive] = useState<string | null>(null)
  const [responses, setResponses] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [clickKey, setClickKey] = useState(0)
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [sessionReady, setSessionReady] = useState(false)

  useEffect(() => {
    const initSession = async () => {
      try {
        const storedSessionId = localStorage.getItem("zantara-session-id")
        console.log("[v0] Stored session ID:", storedSessionId)

        const response = await fetch("/api/session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId: storedSessionId || null }),
        })

        console.log("[v0] Session response status:", response.status)
        const data = await response.json()
        console.log("[v0] Session response data:", data)

        if (data.sessionId) {
          setSessionId(data.sessionId)
          localStorage.setItem("zantara-session-id", data.sessionId)
          console.log("[v0] Session initialized:", data.sessionId)
        } else {
          console.log("[v0] No sessionId in response")
        }
        setSessionReady(true)
      } catch (error) {
        console.error("Session init error:", error)
        setSessionReady(true)
      }
    }

    initSession()
  }, [])

  const handleButtonClick = async (key: string) => {
    setActive(key)
    setClickKey((prev) => prev + 1)

    if (responses[key]) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/generate-response", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompts[key as keyof typeof prompts] }),
      })

      if (!response.ok) throw new Error("Failed to generate response")

      const data = await response.json()
      setResponses((prev) => ({
        ...prev,
        [key]: data.response,
      }))

      if (sessionId) {
        await fetch("/api/interaction", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            buttonKey: key,
            response: data.response,
          }),
        })
      }
    } catch (error) {
      console.error("Error:", error)
      setResponses((prev) => ({
        ...prev,
        [key]: "The connection wavers... try again.",
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleDeepDive = (portal: "visas" | "decode" | "about") => {
    onNavigate?.(portal)
  }

  const displayText = active ? responses[active] || (loading ? "Listening to the cosmos..." : "") : ""

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
        <motion.div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(50vmax 50vmax at 50% 50%, rgba(214,178,94,0.05), transparent 70%)",
            filter: "blur(80px)",
            mixBlendMode: "overlay",
          }}
          animate={{ scale: [1.02, 1, 1.03] }}
          transition={{
            duration: 18,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: 2,
          }}
        />
      </div>

      <motion.div
        className="absolute top-6 left-6 select-none z-10"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            boxShadow: "0 0 40px rgba(214,178,94,0.6), 0 0 80px rgba(214,178,94,0.3)",
            width: "110px",
            height: "110px",
            left: "-10px",
            top: "-10px",
          }}
          animate={{
            boxShadow: [
              "0 0 0 0 rgba(214,178,94,0.4), 0 0 60px rgba(214,178,94,0.2)",
              "0 0 20px 4px rgba(214,178,94,0.3)",
              "0 0 0 0 rgba(214,178,94,0)",
            ],
          }}
          transition={{
            duration: 4,
            repeat: Number.POSITIVE_INFINITY,
            repeatType: "loop",
            ease: "easeInOut",
          }}
        />
        <img
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/balizero-logo-kWMlu7jyPo4fI3qbykajyL8KVR2Ox8.png"
          alt="Bali Zero Logo"
          className="relative w-20 drop-shadow-[0_0_20px_rgba(214,178,94,0.6)]"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
        className="max-w-2xl mx-auto px-4 md:px-6 w-full"
      >
        <h1 className="font-serif text-2xl md:text-3xl tracking-widest uppercase text-[#d6b25e] mb-2 md:mb-4 text-balance">
          ZANTARA // The Living Interface
        </h1>
        <p className="text-sm md:text-base text-[#e9e9e9] font-light mb-2">Welcome, Zero.</p>
        <p className="italic text-[#d6b25e] mb-6 md:mb-8 text-sm md:text-base">
          "Dimana bumi dipijak, disitu langit dijunjung."
        </p>

        <div className="min-h-20 md:min-h-24 mb-8 md:mb-10">
          <AnimatePresence mode="wait">
            {displayText && (
              <motion.p
                key={`${active}-${clickKey}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="leading-relaxed text-[#e8e8e8] text-sm md:text-base"
              >
                {displayText}
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        <div className="flex flex-wrap gap-2 justify-center mb-10 md:mb-12">
          {[
            ["borders", "Crossing Borders"],
            ["forge", "Forge Your Dream"],
            ["decode", "Decode the System"],
          ].map(([key, label]) => (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.96 }}
              animate={
                active === key && clickKey > 0
                  ? {
                      x: [0, 2, -2, 2, -2, 0],
                      boxShadow: [
                        `0 0 0 0 rgba(214,178,94,0.4)`,
                        `0 0 20px 4px rgba(214,178,94,0.3)`,
                        `0 0 0 0 rgba(214,178,94,0)`,
                      ],
                    }
                  : {}
              }
              transition={{
                duration: 0.5,
                ease: "easeOut",
              }}
              key={key}
              onClick={() => handleButtonClick(key)}
              disabled={loading}
              className={`px-3 md:px-4 py-2 border rounded-md text-xs md:text-sm backdrop-saturate-150 transition-all disabled:opacity-50 font-medium ${
                active === key
                  ? "border-[#d6b25e] text-[#d6b25e] bg-[#d6b25e]/5"
                  : "border-[#2c2c2c] text-gray-200 hover:border-[#d6b25e] hover:text-[#d6b25e] hover:bg-[#d6b25e]/5"
              }`}
            >
              {label}
            </motion.button>
          ))}
        </div>

        <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-[#2c2c2c] flex flex-col gap-4">
          <p className="text-[#d6b25e] text-xs uppercase tracking-widest">Dive Deeper</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              ["visas", "Visas Portal"],
              ["decode", "Decode Portal"],
              ["about", "About"],
            ].map(([key, label]) => (
              <motion.button
                key={key}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleDeepDive(key as "visas" | "decode" | "about")}
                className="px-3 md:px-4 py-2 border border-[#d6b25e] text-[#d6b25e] rounded-md text-xs md:text-sm hover:bg-[#d6b25e] hover:text-[#0b0b0b] transition-all font-medium"
              >
                {label}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      <footer className="mt-12 md:mt-16 text-xs md:text-sm text-gray-500 px-4 pb-4">
        ∞ Bali Zero is powered by humans.
      </footer>
    </div>
  )
}
