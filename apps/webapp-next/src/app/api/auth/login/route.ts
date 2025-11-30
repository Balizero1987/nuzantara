import { NextResponse } from "next/server"
import { createPublicClient } from "@/lib/api/client"

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json()

    console.log("[AuthAPI] Production login attempt:", { email })

    // Call the real backend authentication API using generated client
    const client = createPublicClient()
    const data = await client.identity.teamLoginApiAuthTeamLoginPost({
      requestBody: { email, pin }
    })

    console.log("[AuthAPI] Production login success:", { email, user: data.user })

    return NextResponse.json({
      token: data.token,
      user: data.user,
      message: "Login successful",
    })
  } catch (error: unknown) {
    console.error("[AuthAPI] Production login error:", error)
    // Handle API client errors with status and body
    const apiError = error as { status?: number; body?: { detail?: string } }
    const status = apiError.status || 500
    const message = apiError.body?.detail || "Authentication service unavailable"
    return NextResponse.json({ error: message }, { status })
  }
}
