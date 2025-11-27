import { NextResponse } from "next/server"

// Mock user database
const MOCK_USERS = {
  "zero@balizero.com": {
    pin: "010719",
    user: {
      id: "1",
      email: "zero@balizero.com",
      name: "Zero Balizero",
      tier: "S",
      tier_display: "Executive",
    },
  },
}

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json()

    console.log("[v0] Mock login attempt:", { email, pin })

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Check credentials
    const user = MOCK_USERS[email as keyof typeof MOCK_USERS]

    if (!user || user.pin !== pin) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 })
    }

    // Generate mock JWT token
    const token = `mock_jwt_token_${Date.now()}`

    console.log("[v0] Mock login success:", user.user)

    return NextResponse.json({
      token,
      user: user.user,
      message: "Login successful",
    })
  } catch (error) {
    console.error("[v0] Mock login error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
