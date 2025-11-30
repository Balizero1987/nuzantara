import { create } from "zustand"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metadata?: {
    memory_used?: boolean
    rag_sources?: Array<{
      source: string
      relevance: number
      preview?: string
    }>
    intent?: string
  }
}

interface ChatState {
  messages: Message[]
  isStreaming: boolean
  streamingMessage: string
  contextMetadata: Message["metadata"] | null

  addMessage: (message: Message) => void
  updateStreamingMessage: (content: string) => void
  setStreaming: (isStreaming: boolean) => void
  setContextMetadata: (metadata: Message["metadata"]) => void
  clearMessages: () => void
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  isStreaming: false,
  streamingMessage: "",
  contextMetadata: null,

  addMessage: (message) =>
    set((state) => ({
      messages: [...state.messages, message],
    })),

  updateStreamingMessage: (content) => set({ streamingMessage: content }),

  setStreaming: (isStreaming) => set({ isStreaming }),

  setContextMetadata: (metadata) => set({ contextMetadata: metadata }),

  clearMessages: () => set({ messages: [], streamingMessage: "", contextMetadata: null }),
}))
