// src/app/chat/page.tsx - REFACTORED VERSION
// Original: 909 lines → Now: ~200 lines
"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { useChatStore } from "@/lib/store/chat-store"
import { chatAPI } from "@/lib/api/chat"
import { RAGDrawer } from "@/components/chat/RAGDrawer"
import type { ChatMetadata } from "@/lib/api/types"

// Local components
import { ChatHeader } from "./components/ChatHeader"
import { ChatSidebar } from "./components/ChatSidebar"
import { ChatMessages } from "./components/ChatMessages"
import { ChatInput } from "./components/ChatInput"
import { ImageGenerationModal } from "./components/ImageGenerationModal"
import { WelcomeScreen } from "./components/WelcomeScreen"

// Hooks
import { useChatSession } from "./hooks/useChatSession"
import { useImageGeneration } from "./hooks/useImageGeneration"
import { useTokenRefresh } from "./hooks/useTokenRefresh"

export default function ChatPage() {
  const router = useRouter()
  const { user, logout, isAuthenticated, isLoading: isAuthLoading } = useAuth()

  // Chat state
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [avatarImage, setAvatarImage] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMetadata, setDrawerMetadata] = useState<ChatMetadata | undefined>(undefined)

  // Mock chat history
  const [previousChats] = useState([
    { id: 1, title: "Tourist visa for Bali", date: "2 hours ago" },
    { id: 2, title: "Indonesia tax information", date: "Yesterday" },
    { id: 3, title: "Company registration in Jakarta", date: "3 days ago" },
    { id: 4, title: "Work permit application", date: "1 week ago" },
  ])

  // Zustand store
  const { messages, addMessage, clearMessages, crmContext } = useChatStore()

  // Custom hooks
  const { isInitialized } = useChatSession()
  const {
    showImageModal,
    imagePrompt,
    isGeneratingImage,
    setShowImageModal,
    setImagePrompt,
    handleGenerateImage
  } = useImageGeneration()

  // Token refresh hook - automatically refreshes token before expiry
  useTokenRefresh({
    enabled: isAuthenticated,
    onExpiryWarning: (minutesLeft) => {
      console.log(`[ZANTARA] Token expires in ${minutesLeft} minutes`)
    },
  })

  // Auth redirect
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.push("/login")
    }
  }, [isAuthLoading, isAuthenticated, router])

  // Load avatar and check-in state from localStorage
  useEffect(() => {
    const savedAvatar = localStorage.getItem("zantara_avatar")
    if (savedAvatar) setAvatarImage(savedAvatar)

    const savedCheckIn = localStorage.getItem("zantara_checkin")
    if (savedCheckIn) setIsCheckedIn(true)
  }, [])

  // Submit handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")
    addMessage({
      id: `user_${Date.now()}`,
      role: "user",
      content: userMessage,
      timestamp: new Date()
    })
    setIsLoading(true)
    setStreamingContent("")

    let accumulatedContent = ""
    let metadata: ChatMetadata | undefined

    // Prepare conversation history (max 200 messages, filter errors)
    const history = messages
      .map((m) => ({ role: m.role, content: m.content }))
      .filter(msg => msg.content !== "Sorry, I encountered an error. Please try again.")
      .slice(-200)

    try {
      await chatAPI.streamChat(
        userMessage,
        (chunk) => {
          accumulatedContent += chunk
          setStreamingContent(accumulatedContent)
        },
        (meta) => {
          metadata = meta
        },
        () => {
          addMessage({
            id: `assistant_${Date.now()}`,
            role: "assistant",
            content: accumulatedContent,
            timestamp: new Date(),
            metadata: metadata ? {
              memory_used: metadata.memory_used,
              rag_sources: metadata.rag_sources?.map(s => ({
                source: s.document || s.collection,
                relevance: s.score,
                preview: s.text_preview,
              })),
              intent: metadata.intent,
            } : undefined,
          })
          setStreamingContent("")
          setIsLoading(false)
        },
        () => {
          addMessage({
            id: `error_${Date.now()}`,
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
            timestamp: new Date()
          })
          setStreamingContent("")
          setIsLoading(false)
        },
        history
      )
    } catch (error) {
      console.error("[ZANTARA] Chat error:", error)
      setStreamingContent("")
      setIsLoading(false)
    }
  }

  // Keyboard handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  // Avatar upload handler
  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setAvatarImage(result)
        localStorage.setItem("zantara_avatar", result)
      }
      reader.readAsDataURL(file)
    }
  }

  // Check in/out handler
  const handleCheckInOut = () => {
    if (isCheckedIn) {
      setIsCheckedIn(false)
      localStorage.removeItem("zantara_checkin")
    } else {
      setIsCheckedIn(true)
      localStorage.setItem("zantara_checkin", new Date().toISOString())
    }
  }

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

  // New chat handler
  const handleNewChat = async () => {
    clearMessages()
    try {
      await chatAPI.clearHistory()
    } catch (error) {
      console.warn("[ZANTARA] Failed to clear backend history:", error)
    }
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] text-white font-sans flex flex-col">
      {/* Sidebar */}
      <ChatSidebar
        isOpen={isSidebarOpen}
        previousChats={previousChats}
        onNewChat={handleNewChat}
        onSelectChat={(id) => {
          console.log("Selected:", id)
          setIsSidebarOpen(false)
        }}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content */}
      <div className={`flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
        {/* Header */}
        <ChatHeader
          user={user}
          avatarImage={avatarImage}
          isCheckedIn={isCheckedIn}
          crmContext={crmContext}
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          onCheckInOut={handleCheckInOut}
          onAvatarUpload={handleAvatarUpload}
          onLogout={logout}
        />

        {/* Golden Divider */}
        <div
          className="h-px w-full"
          style={{
            backgroundImage: 'url(/images/image_art/zantara_divider_dark_transparent.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        {/* Messages Area */}
        <main className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <WelcomeScreen />
          ) : (
            <ChatMessages
              messages={messages}
              streamingContent={streamingContent}
              isLoading={isLoading}
              avatarImage={avatarImage}
            />
          )}
        </main>

        {/* Input Area */}
        <ChatInput
          input={input}
          isLoading={isLoading}
          uploadPreview={uploadPreview}
          onInputChange={(e) => setInput(e.target.value)}
          onSubmit={handleSubmit}
          onKeyDown={handleKeyDown}
          onFileUpload={handleFileUpload}
          onClearPreview={() => setUploadPreview(null)}
          onOpenImageModal={() => setShowImageModal(true)}
        />
      </div>

      {/* Image Generation Modal */}
      <ImageGenerationModal
        isOpen={showImageModal}
        imagePrompt={imagePrompt}
        isGenerating={isGeneratingImage}
        onClose={() => setShowImageModal(false)}
        onPromptChange={setImagePrompt}
        onGenerate={handleGenerateImage}
      />

      {/* RAG Drawer */}
      <RAGDrawer
        metadata={drawerMetadata}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
      />
    </div>
  )
}
