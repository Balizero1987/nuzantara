const API_URL = process.env.NUZANTARA_API_URL || "https://nuzantara-rag.fly.dev"
const API_KEY = process.env.NUZANTARA_API_KEY || "nuzantara-api-key-2024-secure"

export async function POST(req: Request) {
  try {
    const { messages, user_id = "web_user" } = await req.json()
    const lastMessage = messages[messages.length - 1]?.content || ""

    console.log("[ChatAPI] Production request (tailwind):", { message: lastMessage, user_id })

    // Call the real backend Oracle API
    const response = await fetch(`${API_URL}/api/oracle/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": API_KEY,
        "Authorization": `Bearer ${req.headers.get("Authorization")?.replace("Bearer ", "") || ""}`,
      },
      body: JSON.stringify({
        query: lastMessage,
        user_id: user_id
      })
    })

    if (!response.ok) {
      console.error("[ChatAPI] Backend error:", response.status, response.statusText)
      return Response.json(
        { message: "AI service temporarily unavailable" },
        { status: response.status }
      )
    }

    const data = await response.json()

    return Response.json({
      message: data.answer || "I'm unable to process that request right now.",
      sources: data.sources || [],
      model_used: data.model_used || "gemini-2.5-flash"
    })

  } catch (error) {
    console.error("[ChatAPI] Production error (tailwind):", error)
    return Response.json(
      { message: "Failed to connect to AI service" },
      { status: 500 }
    )
  }
}
