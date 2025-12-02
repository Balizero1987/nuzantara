export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  avatar?: string | null;
  createdAt?: string;
  updatedAt?: string;
  tier?: 'S' | 'A' | 'B' | 'C' | 'D';
  created_at?: string;
}

export interface LoginRequest {
  email: string;
  pin: string;
}

export interface LoginResponse {
  token: string;
  user: User;
  expiresIn?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  metadata?: ChatMetadata;
}

export interface ChatMetadata {
  memory_used: boolean;
  rag_sources?: RAGSource[];
  intent?: string;
  timestamp?: string;
  model_used?: string;
  sources?: Array<{
    source: string;
    relevance: number;
    preview?: string;
  }>;
}

export interface RAGSource {
  collection: string;
  document: string;
  score: number;
  text_preview?: string;
}

export interface ChatRequest {
  message: string;
  conversation_id?: string;
}

export interface ChatResponse {
  message: string;
  metadata?: ChatMetadata;
  conversation_id: string;
}
