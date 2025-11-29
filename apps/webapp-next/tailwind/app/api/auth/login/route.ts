import { NextResponse } from "next/server"

const API_URL = process.env.NUZANTARA_API_URL || "https://nuzantara-rag.fly.dev"
const API_KEY = process.env.NUZANTARA_API_KEY || "nuzantara-api-key-2024-secure"

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json()

    console.log("[AuthAPI] Production login attempt:", { email })

    // Call the real backend authentication API
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
      },
      body: JSON.stringify({
        email,
        pin,
      })
    })

    if (!response.ok) {
      console.error("[AuthAPI] Backend auth error:", response.status, response.statusText)
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    const data = await response.json()

    console.log("[AuthAPI] Production login success:", { email, user: data.user })

    return NextResponse.json({
      token: data.token,
      user: data.user,
      message: "Login successful",
    })
  } catch (error) {
    console.error("[AuthAPI] Production login error:", error)
    return NextResponse.json({ error: "Authentication service unavailable" }, { status: 500 })
  }
}
