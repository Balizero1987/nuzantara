// src/app/chat/components/ChatHeader.tsx
"use client"

import type React from "react"
import { useRef } from "react"
import type { ChatHeaderProps } from "../types"

export function ChatHeader({
  user,
  avatarImage,
  isCheckedIn,
  crmContext,
  isSidebarOpen,
  onToggleSidebar,
  onCheckInOut,
  onAvatarUpload,
  onLogout,
}: ChatHeaderProps) {
  const avatarInputRef = useRef<HTMLInputElement>(null)

  return (
    <header className="flex items-center justify-between px-16 py-0 border-b border-gray-700/50 backdrop-blur-sm shrink-0 z-30 relative">
      <div className="flex items-center gap-3">
        {/* Menu Button */}
        <button
          onClick={onToggleSidebar}
          className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-300 hover:scale-110 group"
          aria-label="Menu"
        >
          <svg
            className={`w-6 h-6 transition-transform duration-300 ${isSidebarOpen ? "rotate-90" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
            />
          </svg>
        </button>

        {/* Check In/Out Button */}
        <button
          onClick={onCheckInOut}
          className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
            isCheckedIn
              ? "bg-green-500/20 border-2 border-green-500 text-green-400"
              : "bg-gray-700/50 border-2 border-gray-600 text-gray-400 hover:border-[#d4af37]"
          }`}
          title={isCheckedIn ? "Check Out" : "Check In"}
        >
          {isCheckedIn ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          )}
        </button>

        {/* CRM Context Badge */}
        {crmContext && (
          <div
            className="flex items-center gap-2 px-3 py-1.5 bg-[#d4af37]/10 border border-[#d4af37]/30 rounded-full text-xs"
            title={`CRM Client: ${crmContext.clientName} (${crmContext.status})`}
          >
            <svg className="w-4 h-4 text-[#d4af37]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-[#d4af37] font-medium truncate max-w-[100px]">
              {crmContext.clientName}
            </span>
            {crmContext.practices && crmContext.practices.length > 0 && (
              <span className="bg-[#d4af37]/20 text-[#d4af37] px-1.5 py-0.5 rounded-full text-[10px]">
                {crmContext.practices.length} pratiche
              </span>
            )}
          </div>
        )}
      </div>

      {/* Logo */}
      <img src="/images/logo_zan.svg" alt="ZANTARA" className="h-24 w-auto mx-auto" />

      {/* Right Section */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/*"
            onChange={onAvatarUpload}
            className="hidden"
          />
          <button
            onClick={() => avatarInputRef.current?.click()}
            className="w-10 h-10 rounded-full overflow-hidden transition-all duration-300 hover:scale-110 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-600"
            title="Click to upload avatar"
          >
            {avatarImage ? (
              <img src={avatarImage} alt="User" className="w-full h-full object-cover" />
            ) : (
              <img src="/logo-zantara.svg" alt="ZANTARA" className="w-10 h-10 object-contain p-1" />
            )}
          </button>
          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a2a2a] animate-pulse" />
        </div>

        <button
          onClick={onLogout}
          className="text-sm hover:text-[#d4af37] transition-colors font-serif flex items-center gap-1 group"
        >
          <span>Logout</span>
          <svg
            className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
