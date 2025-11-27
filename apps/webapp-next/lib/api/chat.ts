import type { ChatMetadata } from "./types"

export const chatAPI = {
  async streamChat(
    message: string,
    onChunk: (chunk: string) => void,
    onMetadata: (metadata: ChatMetadata) => void,
    onComplete: () => void,
    onError: (error: Error) => void,
  ): Promise<void> {
    const token = typeof window !== "undefined" ? localStorage.getItem("zantara_token") : null
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://nuzantara-rag.fly.dev"

    try {
      const userEmail = typeof window !== "undefined" ? localStorage.getItem("zantara_user_email") || "user@nuzantara.com" : "user@nuzantara.com"

      const response = await fetch(`${apiUrl}/bali-zero/chat-stream?query=${encodeURIComponent(message)}&user_email=${encodeURIComponent(userEmail)}&user_role=member`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("No reader available")
      }

      let buffer = ""
      let metadataParsed = false

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          onComplete()
          break
        }

        buffer += decoder.decode(value, { stream: true })

        // Parse metadata block first
        if (!metadataParsed && buffer.includes("[METADATA]")) {
          const metadataMatch = buffer.match(/\[METADATA\](.*?)\[METADATA\]/)
          if (metadataMatch) {
            try {
              const metadata = JSON.parse(metadataMatch[1])
              onMetadata(metadata)
              buffer = buffer.replace(/\[METADATA\].*?\[METADATA\]/, "")
              metadataParsed = true
            } catch (e) {
              console.error("[v0] Failed to parse metadata:", e)
            }
          }
        }

        // Stream remaining content
        if (metadataParsed && buffer) {
          onChunk(buffer)
          buffer = ""
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  },
}
