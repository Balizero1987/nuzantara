import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, start_time, duration_minutes, description } = body

    // In production, this would call your FastAPI backend:
    // const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/productivity/calendar/schedule`, {
    //   method: "POST",
    //   headers: {
    //     "Content-Type": "application/json",
    //     "Authorization": `Bearer ${token}`
    //   },
    //   body: JSON.stringify({ title, start_time, duration_minutes, description })
    // })

    // Mock successful response
    return NextResponse.json({
      status: "success",
      data: {
        event_id: `evt_${Date.now()}`,
        title,
        start_time,
        duration_minutes,
        created_at: new Date().toISOString(),
      },
    })
  } catch (error) {
    console.error("[v0] Calendar schedule error:", error)
    return NextResponse.json({ error: "Failed to create calendar event" }, { status: 500 })
  }
}
