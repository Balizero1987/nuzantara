"use client"

import { useState, useEffect } from "react"
import { calendarAPI } from "@/lib/api/calendar"

export function CalendarWidget() {
  const [events, setEvents] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadEvents()
  }, [])

  const loadEvents = async () => {
    try {
      const data = await calendarAPI.listEvents(5)
      setEvents(data)
    } catch (error) {
      console.error("[v0] Failed to load calendar events:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-1/2 mb-3"></div>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-gray-700/50 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
      <h3 className="text-sm font-semibold text-white/90 mb-3">Upcoming Events</h3>

      {events.length === 0 ? (
        <p className="text-xs text-white/50">No upcoming events</p>
      ) : (
        <div className="space-y-2">
          {events.map((event, index) => (
            <div key={index} className="p-2 bg-gray-700/30 rounded-lg border border-gray-600/30">
              <p className="text-xs font-medium text-white/90">{event.title}</p>
              <p className="text-[10px] text-white/50 mt-1">
                {new Date(event.start_time).toLocaleString("en-US", {
                  month: "short",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
