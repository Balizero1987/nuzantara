import { createServerClient } from "@/src/lib/api/client"

export async function POST(req: Request) {
  try {
    const { messages, user_id = "web_user" } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ""

    console.log("[ChatAPI] Production request:", { message: lastMessage, user_id })

    // Extract token from Authorization header
    const authHeader = req.headers.get("Authorization")
    const token = authHeader?.replace("Bearer ", "") || ""

    // Call the real backend Oracle API using generated client
    const client = createServerClient(token)

    const data = await client.oracleV53UltraHybrid.hybridOracleQueryApiOracleQueryPost({
      requestBody: {
        query: lastMessage,
        user_email: user_id
      }
    })

    return Response.json({
      message: data.answer || "I'm unable to process that request right now.",
      sources: data.sources || [],
      model_used: data.model_used || "gemini-2.5-flash"
    })

  } catch (error: any) {
    console.error("[ChatAPI] Production error:", error)
    const status = error.status || 500
    const message = error.body?.detail || "Failed to connect to AI service"
    return Response.json(
      { message: message },
      { status: status }
    )
  }
}
