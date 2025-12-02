import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { ZantaraSession, ZantaraContext } from "../api/zantara-integration"

export interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  timestamp: Date
  metadata?: {
    memory_used?: boolean
    rag_sources?: Array<{
      source: string
      relevance?: number
      preview?: string
    }>
    intent?: string
    model_used?: string
    execution_time_ms?: number
  }
}

export interface CRMContext {
  clientId: number
  clientName: string
  status: string
  practices?: Array<{
    id: number
    type: string
    status: string
  }>
  activeJourneys?: Array<{
    journeyId: string
    type: string
    progress: number
  }>
  complianceAlerts?: Array<{
    type: string
    severity: string
    dueDate: string
  }>
}

interface ChatState {
  // Messages
  messages: Message[]
  isStreaming: boolean
  streamingMessage: string

  // Session Management
  session: ZantaraSession | null
  isSessionInitialized: boolean

  // Context
  contextMetadata: Message["metadata"] | null
  crmContext: CRMContext | null
  zantaraContext: ZantaraContext | null

  // Backend Sync
  isSyncing: boolean
  lastSyncedAt: string | null
  pendingSync: boolean

  // Actions - Messages
  addMessage: (message: Message) => void
  updateStreamingMessage: (content: string) => void
  setStreaming: (isStreaming: boolean) => void
  clearMessages: () => void

  // Actions - Session
  setSession: (session: ZantaraSession) => void
  setSessionInitialized: (initialized: boolean) => void
  clearSession: () => void

  // Actions - Context
  setContextMetadata: (metadata: Message["metadata"]) => void
  setCRMContext: (context: CRMContext | null) => void
  setZantaraContext: (context: ZantaraContext | null) => void

  // Actions - Sync
  setSyncing: (syncing: boolean) => void
  markSynced: () => void
  setPendingSync: (pending: boolean) => void

  // Actions - Bulk
  loadMessages: (messages: Message[]) => void
  replaceMessages: (messages: Message[]) => void
}

export const useChatStore = create<ChatState>()(
  (persist as any)(
    (set: any, get: any) => ({
      // Initial State - Messages
      messages: [],
      isStreaming: false,
      streamingMessage: "",

      // Initial State - Session
      session: null,
      isSessionInitialized: false,

      // Initial State - Context
      contextMetadata: null,
      crmContext: null,
      zantaraContext: null,

      // Initial State - Sync
      isSyncing: false,
      lastSyncedAt: null,
      pendingSync: false,

      // Actions - Messages
      addMessage: (message: any) =>
        set((state: any) => ({
          messages: [...state.messages, message],
          pendingSync: true,
        })),

      updateStreamingMessage: (content: any) => set({ streamingMessage: content }),

      setStreaming: (isStreaming: any) =>
        set({
          isStreaming,
          streamingMessage: isStreaming ? get().streamingMessage : "",
        }),

      clearMessages: () =>
        set({
          messages: [],
          streamingMessage: "",
          contextMetadata: null,
          pendingSync: true,
        }),

      // Actions - Session
      setSession: (session: any) =>
        set({
          session,
          isSessionInitialized: true,
        }),

      setSessionInitialized: (initialized: any) =>
        set({ isSessionInitialized: initialized }),

      clearSession: () =>
        set({
          session: null,
          isSessionInitialized: false,
          messages: [],
          streamingMessage: "",
          contextMetadata: null,
          crmContext: null,
          zantaraContext: null,
        }),

      // Actions - Context
      setContextMetadata: (metadata: any) => set({ contextMetadata: metadata }),

      setCRMContext: (context: any) => set({ crmContext: context }),

      setZantaraContext: (context: any) =>
        set({
          zantaraContext: context,
          crmContext: context?.crmContext
            ? {
              clientId: context.crmContext.clientId,
              clientName: context.crmContext.clientName,
              status: context.crmContext.status,
              practices: context.crmContext.practices,
            }
            : get().crmContext,
        }),

      // Actions - Sync
      setSyncing: (syncing: any) => set({ isSyncing: syncing }),

      markSynced: () =>
        set({
          lastSyncedAt: new Date().toISOString(),
          pendingSync: false,
        }),

      setPendingSync: (pending: any) => set({ pendingSync: pending }),

      // Actions - Bulk
      loadMessages: (messages: any) =>
        set((state: any) => ({
          messages: [...state.messages, ...messages],
        })),

      replaceMessages: (messages: any) =>
        set({
          messages,
          pendingSync: false,
        }),
    }),
    {
      name: "zantara-chat-storage",
      partialize: (state: any) => ({
        messages: state.messages,
        session: state.session,
        crmContext: state.crmContext,
        lastSyncedAt: state.lastSyncedAt,
      }),
    }
  )
)

// Selectors for computed values
export const selectMessageCount = (state: ChatState) => state.messages.length

export const selectLastMessage = (state: ChatState) =>
  state.messages[state.messages.length - 1] || null

export const selectUserMessages = (state: ChatState) =>
  state.messages.filter((m) => m.role === "user")

export const selectAssistantMessages = (state: ChatState) =>
  state.messages.filter((m) => m.role === "assistant")

export const selectHasCRMContext = (state: ChatState) =>
  state.crmContext !== null

export const selectActiveAlerts = (state: ChatState) =>
  state.crmContext?.complianceAlerts?.filter(
    (a) => a.severity === "high" || a.severity === "critical"
  ) || []

export const selectConversationHistory = (state: ChatState) =>
  state.messages.map((m) => ({
    role: m.role,
    content: m.content,
  }))
