import type { ChatMetadata } from "./types"

export const chatAPI = {
  async streamChat(
    message: string,
    onChunk: (chunk: string) => void,
    onMetadata: (metadata: ChatMetadata) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("zantara_session_token") : null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nuzantara-rag.fly.dev"

    console.log("[ChatAPI] Using API URL:", apiUrl)
    console.log("[ChatAPI] Token present:", !!token)

    try {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("zantara_user_email") || "user@nuzantara.com" : "user@nuzantara.com"
      const apiKey = process.env.NEXT_PUBLIC_API_KEY || "zantara-secret-2024"

      const headers: Record<string, string> = {
        "X-API-Key": apiKey,
        "Content-Type": "application/json",
      }

      if (token) {
        headers["Authorization"] = `Bearer ${token}`
      }

      console.log("[ChatAPI] Fetching stream...")
      const response = await fetch(`${apiUrl}/bali-zero/chat-stream?query=${encodeURIComponent(message)}&user_email=${encodeURIComponent(userEmail)}&user_role=member`, {
        method: "GET",
        headers: headers,
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication failed. Please log in again.")
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Process buffer line by line
        const lines = buffer.split("\n\n")
        buffer = lines.pop() || "" // Keep the last incomplete chunk in buffer

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const dataStr = line.slice(6)
            try {
              const event = JSON.parse(dataStr)

              switch (event.type) {
                case "metadata":
                  onMetadata(event.data)
                  break
                case "token":
                  if (event.data) {
                    onChunk(event.data)
                  }
                  break
                case "done":
                  // Will be handled by loop exit, but good to know
                  break
                case "error":
                  throw new Error(event.data || "Unknown streaming error")
              }
            } catch (e) {
              console.warn("[ChatAPI] Failed to parse SSE event:", e, line)
            }
          }
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  },
}
