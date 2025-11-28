"use client"

import { useState, useEffect } from "react"

export function CheckInOut() {
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<Date | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const savedState = localStorage.getItem("zantara_checkin_state")
    if (savedState) {
      const { isCheckedIn: saved, checkInTime: savedTime } = JSON.parse(savedState)
      setIsCheckedIn(saved)
      setCheckInTime(savedTime ? new Date(savedTime) : null)
    }
  }, [])

  const handleCheckIn = async () => {
    setIsLoading(true)
    try {
      const now = new Date()

      // Call backend API to create calendar event
      // POST /api/productivity/calendar/schedule
      const response = await fetch("/api/productivity/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Work Session - Check In",
          start_time: now.toISOString(),
          duration_minutes: 480, // 8 hours default
          description: "Started work session via Zantara",
        }),
      })

      if (response.ok) {
        setIsCheckedIn(true)
        setCheckInTime(now)
        localStorage.setItem(
          "zantara_checkin_state",
          JSON.stringify({
            isCheckedIn: true,
            checkInTime: now.toISOString(),
          }),
        )
      }
    } catch (error) {
      console.error("[v0] Check-in error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCheckOut = async () => {
    setIsLoading(true)
    try {
      const now = new Date()
      const duration = checkInTime ? Math.round((now.getTime() - checkInTime.getTime()) / (1000 * 60)) : 0

      // In production, you'd update the existing calendar event
      // For now, just clear the state
      setIsCheckedIn(false)
      setCheckInTime(null)
      localStorage.removeItem("zantara_checkin_state")
    } catch (error) {
      console.error("[v0] Check-out error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatDuration = () => {
    if (!checkInTime) return ""
    const now = new Date()
    const diff = now.getTime() - checkInTime.getTime()
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    return `${hours}h ${minutes}m`
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
        disabled={isLoading}
        className={`
          px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300
          flex items-center gap-2 hover:scale-105 active:scale-95
          ${
            isCheckedIn
              ? "bg-red-500/20 border-2 border-red-500 text-red-400 hover:bg-red-500/30"
              : "bg-green-500/20 border-2 border-green-500 text-green-400 hover:bg-green-500/30"
          }
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isCheckedIn ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
              />
            )}
          </svg>
        )}
        <span>{isCheckedIn ? "Check Out" : "Check In"}</span>
      </button>

      {isCheckedIn && checkInTime && (
        <div className="text-xs text-gray-400 flex items-center gap-1 animate-pulse">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>{formatDuration()}</span>
        </div>
      )}
    </div>
  )
}
