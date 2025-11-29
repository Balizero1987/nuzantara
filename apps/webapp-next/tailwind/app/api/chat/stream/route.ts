import { NextResponse } from "next/server"

const API_URL = process.env.NUZANTARA_API_URL || "https://nuzantara-rag.fly.dev"
const API_KEY = process.env.NUZANTARA_API_KEY || "nuzantara-api-key-2024-secure"

export async function POST(request: Request) {
  try {
    const { message, user_id = "web_user" } = await request.json()

    console.log("[ChatAPI] Production stream request (tailwind):", { message, user_id })

    // Call the real backend API
    const response = await fetch(`${API_URL}/bali-zero/chat-stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "Authorization": `Bearer ${request.headers.get("Authorization")?.replace("Bearer ", "") || ""}`,
      },
      body: JSON.stringify({
        query: message,
        user_id: user_id,
        stream: true
      })
    })

    if (!response.ok) {
      console.error("[ChatAPI] Backend error:", response.status, response.statusText)
      return NextResponse.json(
        { error: "Backend service unavailable" },
        { status: response.status }
      )
    }

    // Return the streaming response from backend
    return new Response(response.body, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    })

  } catch (error) {
    console.error("[ChatAPI] Production stream error (tailwind):", error)
    return NextResponse.json(
      { error: "Failed to connect to AI service" },
      { status: 500 }
    )
  }
}
