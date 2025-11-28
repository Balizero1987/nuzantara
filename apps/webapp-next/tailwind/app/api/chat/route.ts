export async function POST(req: Request) {
  try {
    const { messages } = await req.json()
    const lastMessage = messages[messages.length - 1]

    // Mock AI response - replace this with your backend API call
    const mockResponses = [
      "Zantara Core online. How can I assist you today?",
      "I'm processing your request. The system is operating at optimal capacity.",
      "Based on your query, I recommend checking the Mission Control dashboard for real-time updates.",
      "All systems are nominal. What would you like to know about Zantara AI?",
    ]

    const response = mockResponses[Math.floor(Math.random() * mockResponses.length)]

    // Simulate processing delay
    await new Promise((resolve) => setTimeout(resolve, 500))

    return Response.json({ message: response })
  } catch (error) {
    console.error("[v0] Chat API error:", error)
    return Response.json({ message: "Error processing request" }, { status: 500 })
  }
}
