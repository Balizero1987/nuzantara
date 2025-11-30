import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/api/client"
import { CalendarEvent } from "@/lib/api/generated"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, start_time, duration_minutes, attendees } = body

    // Extract token from Authorization header
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || ""

    // Call the real backend API using generated client
    const client = createServerClient(token)

    // Note: The generated client method name is verbose due to auto-generation
    const event: CalendarEvent = {
      title: title,
      start_time: start_time,
      duration_minutes: duration_minutes || 60,
      attendees: attendees || []
    }

    const response = await client.productivity.scheduleMeetingApiProductivityCalendarSchedulePost({
      requestBody: event
    })

    return NextResponse.json({
      status: "success",
      data: response
    })
  } catch (error: any) {
    console.error("[v0] Calendar schedule error:", error)
    const status = error.status || 500
    const message = error.body?.detail || "Failed to create calendar event"
    return NextResponse.json({ error: message }, { status })
  }
}
