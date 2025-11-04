import redis from "@/lib/redis"

export async function POST(request: Request) {
  try {
    const { sessionId, buttonKey, response } = await request.json()

    if (!sessionId) {
      return Response.json({ error: "No session ID" }, { status: 400 })
    }

    // Retrieve session
    const sessionData = await redis.get(`session:${sessionId}`)
    if (!sessionData) {
      return Response.json({ error: "Session not found" }, { status: 404 })
    }

    const session = typeof sessionData === "string" ? JSON.parse(sessionData) : sessionData

    // Add interaction to history
    const interaction = {
      buttonKey,
      response,
      timestamp: new Date().toISOString(),
    }

    session.interactions.push(interaction)

    if (buttonKey === "borders") {
      session.memory.lastBorderQuery = new Date().toISOString()
    } else if (buttonKey === "forge") {
      session.memory.lastForgeQuery = new Date().toISOString()
    } else if (buttonKey === "decode") {
      session.memory.lastDecodeQuery = new Date().toISOString()
    }

    // Save updated session
    await redis.set(`session:${sessionId}`, JSON.stringify(session), { ex: 86400 })

    return Response.json({ success: true, interaction })
  } catch (error) {
    console.error("[v0] Interaction error:", error)
    return Response.json({ error: "Failed to save interaction" }, { status: 500 })
  }
}
