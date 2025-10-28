"use client"

import type React from "react"
import { LiveChatWidget } from "@/components/live-chat-widget"
import { LocaleProvider } from "@/components/language-switcher"

export function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LocaleProvider>
      {children}
      <LiveChatWidget />
    </LocaleProvider>
  )
}