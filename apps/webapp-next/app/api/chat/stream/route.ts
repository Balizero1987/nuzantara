import { NextResponse } from "next/server"

const API_URL = process.env.NUZANTARA_API_URL || "https://nuzantara-rag.fly.dev"
const API_KEY = process.env.NUZANTARA_API_KEY || "nuzantara-api-key-2024-secure"

export async function POST(request: Request) {
  try {
    const message = (await request.json()).message
    const user_id = "web_user" // TODO: Extract from token or request

    const authHeader = request.headers.get("Authorization")
    console.log("[ChatAPI] Stream request. Auth Header:", authHeader ? `${authHeader.substring(0, 15)}...` : "Missing")

    // Call the real backend API (Backend expects GET for streaming)
    const params = new URLSearchParams({
      query: message,
      // user_id removed as it's not in OracleQueryRequest and handled by auth/backend logic
      stream: "true"
    })

    const response = await fetch(`${API_URL}/bali-zero/chat-stream?${params.toString()}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "Authorization": `Bearer ${request.headers.get("Authorization")?.replace("Bearer ", "") || ""}`,
      },
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
    console.error("[ChatAPI] Production stream error:", error)
    return NextResponse.json(
      { error: "Failed to connect to AI service" },
      { status: 500 }
    )
  }
}
