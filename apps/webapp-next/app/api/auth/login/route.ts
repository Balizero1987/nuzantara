import { NextResponse } from "next/server"

const RAG_BACKEND_URL = process.env.RAG_BACKEND_URL || process.env.NEXT_PUBLIC_RAG_BACKEND_URL || "https://nuzantara-rag.fly.dev"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, pin } = body

    if (!email || !pin) {
      return NextResponse.json({ error: "Email and PIN are required" }, { status: 400 })
    }

    // Proxy to backend-RAG
    const response = await fetch(`${RAG_BACKEND_URL}/api/auth/team/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, pin }),
    })

    const backendData = await response.json()

    if (!response.ok) {
      return NextResponse.json(
        { error: backendData.detail || backendData.message || "Authentication failed" },
        { status: response.status }
      )
    }

    // Unwrap data from backend response if wrapped
    // Backend returns { success: true, data: { token: ..., user: ... } }
    // Frontend expects { token: ..., user: ..., ... } directly
    if (backendData.success && backendData.data) {
      return NextResponse.json(backendData.data)
    }

    // If not wrapped, return as-is
    return NextResponse.json(backendData)
  } catch (error) {
    console.error("[v0] Login proxy error:", error)
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 })
  }
}
