export interface User {
  id: string
  email: string
  name: string
  role: string
  avatar?: string | null
  createdAt?: string
  updatedAt?: string
  tier?: "S" | "A" | "B" | "C" | "D"
  created_at?: string
}

export interface LoginRequest {
  email: string
  pin: string
}

/**
 * Normalized login response for application use.
 * This abstracts over different backend response formats:
 * - app__modules__identity__router__LoginResponse (identity module)
 * - app__routers__auth__LoginResponse (auth router)
 * See auth.ts for the mapping logic.
 */
export interface LoginResponse {
  token: string
  user: User
  expiresIn?: number
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  metadata?: ChatMetadata
}

export interface ChatMetadata {
  memory_used: boolean
  rag_sources?: RAGSource[]
  intent?: string
  timestamp?: string
}

export interface RAGSource {
  collection: string
  document: string
  score: number
  text_preview?: string
}

export interface ChatRequest {
  message: string
  conversation_id?: string
}

export interface ChatResponse {
  message: string
  metadata?: ChatMetadata
  conversation_id: string
}
