"use client"

import type React from "react"

import { motion, AnimatePresence } from "framer-motion"
import { useState } from "react"
import ZantaraInterface from "./ZantaraInterface"
import VisasPortal from "./portals/VisasPortal"
import DecodePortal from "./portals/DecodePortal"
import AboutPortal from "./portals/AboutPortal"

type Portal = "home" | "visas" | "decode" | "about"

export default function ZantaraPortal() {
  const [currentPortal, setCurrentPortal] = useState<Portal>("home")

  const portals: Record<Portal, { component: React.ReactNode; label: string }> = {
    home: { component: <ZantaraInterface onNavigate={setCurrentPortal} />, label: "ZANTARA" },
    visas: { component: <VisasPortal onNavigate={setCurrentPortal} />, label: "Crossing Borders" },
    decode: { component: <DecodePortal onNavigate={setCurrentPortal} />, label: "Decode the System" },
    about: { component: <AboutPortal onNavigate={setCurrentPortal} />, label: "About" },
  }

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentPortal}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.6, ease: "easeInOut" }}
      >
        {portals[currentPortal].component}
      </motion.div>
    </AnimatePresence>
  )
}
