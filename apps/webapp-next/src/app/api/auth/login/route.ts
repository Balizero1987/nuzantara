import { NextResponse } from "next/server"
import { createPublicClient } from "../../../../lib/api/client";

export async function POST(request: Request) {
  try {
    const { email, pin } = (await request.json()) as any

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
  } catch (error: any) {
    console.error("[AuthAPI] Production login error:", error)
    const status = error.status || 500
    const message = error.body?.detail || "Authentication service unavailable"
    return NextResponse.json({ error: message }, { status })
  }
}
