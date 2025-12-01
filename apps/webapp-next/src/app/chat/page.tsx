"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { chatAPI } from "@/lib/api/chat"
import { authAPI } from "@/lib/api/auth"
import { apiClient } from "@/lib/api/client"
import { RAGDrawer } from "@/components/chat/RAGDrawer"
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer"
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator"
import type { ChatMessage, ChatMetadata } from "@/lib/api/types"

export default function ChatPage() {
  const router = useRouter()
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [uploadPreview, setUploadPreview] = useState<string | null>(null)
  const [avatarImage, setAvatarImage] = useState<string | null>(null)
  const [isCheckedIn, setIsCheckedIn] = useState(false)
  const [checkInTime, setCheckInTime] = useState<Date | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [drawerMetadata, setDrawerMetadata] = useState<ChatMetadata | undefined>(undefined)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [isGeneratingImage, setIsGeneratingImage] = useState(false)
  const [showImageModal, setShowImageModal] = useState(false)
  const [generatedImage, setGeneratedImage] = useState<string | null>(null)
  const [imagePrompt, setImagePrompt] = useState("")

  const [previousChats, setPreviousChats] = useState([
    { id: 1, title: "Tourist visa for Bali", date: "2 hours ago" },
    { id: 2, title: "Indonesia tax information", date: "Yesterday" },
    { id: 3, title: "Company registration in Jakarta", date: "3 days ago" },
    { id: 4, title: "Work permit application", date: "1 week ago" },
  ])

  useEffect(() => {
    // Check for token - try multiple possible storage keys with retry mechanism
    const checkToken = () => {
      const token = apiClient.getToken() ||
        (typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage.getItem('token') : null) ||
        (typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage.getItem('zantara_token') : null) ||
        (typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? globalThis.localStorage.getItem('zantara_session_token') : null)
      return token
    }

    let token = checkToken()

    // If token not found immediately, wait a bit and retry (for navigation from login)
    if (!token) {
      setTimeout(() => {
        token = checkToken()
        console.log('[ChatPage] Token check (retry):', {
          apiClient: apiClient.getToken() ? 'found' : 'not found',
          localStorage_token: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('token') ? 'found' : 'not found',
          zantara_token: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('zantara_token') ? 'found' : 'not found',
          zantara_session_token: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('zantara_session_token') ? 'found' : 'not found',
          allKeys: typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? Object.keys(globalThis.localStorage).filter(k => k.toLowerCase().includes('token')) : []
        })

        if (!token) {
          console.log('[ChatPage] No token found after retry, redirecting to login')
          router.push("/login")
          return
        }
      }, 100)
    }

    console.log('[ChatPage] Token check:', {
      apiClient: apiClient.getToken() ? 'found' : 'not found',
      localStorage_token: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('token') ? 'found' : 'not found',
      zantara_token: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('zantara_token') ? 'found' : 'not found',
      zantara_session_token: typeof globalThis !== 'undefined' && 'localStorage' in globalThis && globalThis.localStorage.getItem('zantara_session_token') ? 'found' : 'not found',
      allKeys: typeof globalThis !== 'undefined' && 'localStorage' in globalThis ? Object.keys(globalThis.localStorage).filter(k => k.toLowerCase().includes('token')) : []
    })

    if (!token) {
      // Don't redirect immediately, wait for retry
      return
    }

    // Load conversation history from localStorage
    const savedMessages = localStorage.getItem("zantara_conversation")
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages)
        setMessages(parsed)
      } catch (e) {
        console.error("Failed to load conversation history:", e)
      }
    }
  }, [router])

  // Save conversation history to localStorage whenever messages change
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("zantara_conversation", JSON.stringify(messages))
    }
  }, [messages])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  useEffect(() => {
    const savedAvatar = localStorage.getItem("zantara_avatar")
    if (savedAvatar) {
      setAvatarImage(savedAvatar)
    }
    const savedCheckIn = localStorage.getItem("zantara_checkin")
    if (savedCheckIn) {
      setIsCheckedIn(true)
      setCheckInTime(new Date(savedCheckIn))
    }
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage = input.trim()
    setInput("")

    const newUserMessage: ChatMessage = { role: "user", content: userMessage }
    setMessages((prev) => [...prev, newUserMessage])
    setIsLoading(true)
    setStreamingContent("")

    let accumulatedContent = ""
    let metadata: ChatMetadata | undefined = undefined

    // Prepare conversation history (max 100 turns = 200 messages)
    // Keep only the last 200 messages to ensure context window management
    const conversationHistory = messages
      .slice(-200) // Last 200 messages = 100 user + 100 assistant turns
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    try {
      await chatAPI.streamChat(
        userMessage,
        (chunk: string) => {
          accumulatedContent += chunk
          setStreamingContent(accumulatedContent)
        },
        (meta: ChatMetadata) => {
          console.log("[v0] Metadata received:", meta)
          metadata = meta
        },
        () => {
          const aiMessage: ChatMessage = {
            role: "assistant",
            content: accumulatedContent,
            metadata,
          }
          setMessages((prev) => [...prev, aiMessage])
          setStreamingContent("")
          setIsLoading(false)
        },
        (error: Error) => {
          console.error("[v0] Chat stream error:", error)
          setStreamingContent("")
          setIsLoading(false)
          const errorMessage: ChatMessage = {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          }
          setMessages((prev) => [...prev, errorMessage])
        },
        conversationHistory
      )
    } catch (error) {
      console.error("[v0] Chat error:", error)
      setStreamingContent("")
      setIsLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      handleSubmit(e as any)
    }
  }

  const handleLogout = () => {
    apiClient.clearToken()
    authAPI.clearUser()
    router.push("/")
  }

  const handleNewConversation = () => {
    setMessages([])
    localStorage.removeItem("zantara_conversation")
    console.log("[Chat] Started new conversation")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader()
      reader.onload = (e) => setUploadPreview(e.target?.result as string)
      reader.readAsDataURL(file)
    }
  }

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

  const handleCheckInOut = () => {
    if (isCheckedIn) {
      setIsCheckedIn(false)
      setCheckInTime(null)
      localStorage.removeItem("zantara_checkin")
    } else {
      const now = new Date()
      setIsCheckedIn(true)
      setCheckInTime(now)
      localStorage.setItem("zantara_checkin", now.toISOString())
    }
  }

  const handleGenerateImage = async () => {
    if (!imagePrompt.trim()) return

    setIsGeneratingImage(true)
    try {
      const token = apiClient.getToken()

      // Use Next.js Proxy instead of direct backend call
      const response = await fetch('/api/image/generate', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt: imagePrompt,
          number_of_images: 1,
          aspect_ratio: "1:1",
          safety_filter_level: "block_some",
          person_generation: "allow_adult",
        }),
      })

      const data = await response.json()
      if (data.success && data.images?.length > 0) {
        setGeneratedImage(data.images[0])
      } else {
        throw new Error(data.error || "No images generated")
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error("[v0] Image generation error:", error)
      alert(`Failed to generate image: ${error.message}`)
    } finally {
      setIsGeneratingImage(false)
      setShowImageModal(false)
      setImagePrompt("")
    }
  }

  const handleNewChat = () => {
    setMessages([])
    setIsSidebarOpen(false)
  }

  const handleSelectChat = (chatId: number) => {
    // Mock: in production would load chat from backend
    console.log("[v0] Selected chat:", chatId)
    setIsSidebarOpen(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1a1a1a] via-[#2a2a2a] to-[#1a1a1a] text-white font-sans flex flex-col">
      {isSidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300"
            onClick={() => setIsSidebarOpen(false)}
          />

          <aside
            className={`fixed left-0 top-0 h-full w-80 bg-[#1a1a1a]/95 backdrop-blur-md border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out z-40 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"
              }`}
          >
            <div className="p-6 h-full flex flex-col">
              <button
                onClick={handleNewChat}
                className="w-full bg-gradient-to-r from-[#d4af37] to-[#f0c75e] hover:from-[#f0c75e] hover:to-[#d4af37] text-black py-3 rounded-xl font-bold text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-[0_0_20px_rgba(212,175,55,0.4)] mb-6"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Chat
              </button>

              <div className="flex-1 overflow-y-auto">
                <h3 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Chat History</h3>
                <div className="space-y-2">
                  {previousChats.map((chat) => (
                    <button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat.id)}
                      className="w-full px-4 py-3 bg-gray-800/40 hover:bg-gray-700/60 rounded-xl text-left transition-all duration-200 border border-gray-700/30 hover:border-[#d4af37]/30 group hover:scale-[1.02]"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm truncate group-hover:text-[#d4af37] transition-colors">
                            {chat.title}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">{chat.date}</div>
                        </div>
                        <svg
                          className="w-4 h-4 text-gray-600 group-hover:text-[#d4af37] transition-colors flex-shrink-0"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      <div className={`flex flex-col h-screen transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 backdrop-blur-sm shrink-0 z-30 relative">
          {/* Corner Decoration Top Right */}
          <div
            className="absolute top-0 right-0 w-12 h-12 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'url(/images/image_art/zantara_ornate_corner_transparent.png)',
              backgroundSize: 'contain',
              backgroundPosition: 'top right',
              backgroundRepeat: 'no-repeat'
            }}
          />
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-gray-700/50 rounded-lg transition-all duration-300 hover:scale-110 group"
              aria-label="Menu"
            >
              <svg
                className={`w-6 h-6 transition-transform duration-300 ${isSidebarOpen ? "rotate-90" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={isSidebarOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}
                />
              </svg>
            </button>

            <button
              onClick={handleCheckInOut}
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${isCheckedIn
                ? "bg-green-500/20 border-2 border-green-500 text-green-400"
                : "bg-gray-700/50 border-2 border-gray-600 text-gray-400 hover:border-[#d4af37]"
                }`}
              title={isCheckedIn ? "Check Out" : "Check In"}
            >
              {isCheckedIn ? (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              )}
            </button>
          </div>

          <div className="animate-pulse-glow -my-32 scale-[2.69] mx-auto">
            <img
              src="/logo-zantara.svg"
              alt="ZANTARA"
              className="h-16 w-auto drop-shadow-[0_0_20px_rgba(212,175,55,0.6)]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="w-14 h-14 rounded-full overflow-hidden transition-all duration-300 hover:scale-110 flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-600"
                title="Click to upload avatar"
              >
                {avatarImage ? (
                  <img src={avatarImage} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                      clipRule="evenodd"
                    />
                  </svg>
                )}
              </button>
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-[#2a2a2a] animate-pulse" />
            </div>
            {/* </CHANGE> */}
            <button
              onClick={handleLogout}
              className="text-sm hover:text-[#d4af37] transition-colors font-serif flex items-center gap-1 group"
            >
              <span>Logout</span>
              <svg
                className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </header>

        {/* Golden Divider */}
        <div
          className="h-px w-full"
          style={{
            backgroundImage: 'url(/images/image_art/zantara_divider_dark_transparent.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />

        <main className="flex-1 overflow-y-auto px-4 py-6">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-16 relative">
              {/* AI Brain Background */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: 'url(/images/image_art/zantara_brain_transparent.png)',
                  backgroundSize: 'contain',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
              <h1 className="text-3xl md:text-4xl font-bold tracking-wide animate-fade-in-down relative z-10">
                <span className="text-white">Selamat datang di ZANTARA</span>
              </h1>

              <div className="relative py-4 w-full max-w-xl animate-fade-in">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-transparent via-yellow-200 to-transparent shadow-[0_0_20px_rgba(254,240,138,0.8),0_0_40px_rgba(254,240,138,0.4)]" />
              </div>

              <div className="space-y-0 animate-fade-in-up">
                <p className="text-xl md:text-2xl text-gray-300 italic font-serif leading-relaxed">
                  Semoga kehadiran kami membawa cahaya dan kebijaksanaan
                </p>
                <p className="text-lg md:text-xl text-gray-400 italic font-serif">dalam perjalanan Anda</p>
              </div>

              <p className="text-sm text-gray-500 animate-fade-in animation-delay-400 mt-2">
                Mulai percakapan dengan mengetik pesan Anda di bawah
              </p>
            </div>
          ) : (
            <div className="max-w-5xl mx-auto space-y-6">
              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-message-fade-in`}
                >
                  {msg.role === "user" && (
                    <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 shadow-lg flex-shrink-0 flex items-center justify-center">
                      {avatarImage ? (
                        <img
                          src={avatarImage || "/placeholder.svg"}
                          alt="User"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                  )}

                  {msg.role === "assistant" && (
                    <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden">
                      <img
                        src="/images/zantara_avatar.png"
                        alt="Zantara AI"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-1 max-w-[75%]">
                    {msg.role === "user" ? (
                      <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-br-md shadow-lg border border-gray-400/30">
                        <div className="text-white text-base leading-relaxed">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
                        <div className="text-white text-base leading-relaxed">
                          <MarkdownRenderer content={msg.content} />
                        </div>
                      </div>
                    )}

                    <span className={`text-xs text-gray-500 px-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                      {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {streamingContent && (
            <div className="flex items-start gap-3 justify-start animate-message-fade-in">
              <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden">
                <img
                  src="/images/zantara_avatar.png"
                  alt="Zantara AI"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 max-w-[75%]">
                <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
                  <div className="text-white text-base leading-relaxed">
                    <MarkdownRenderer content={streamingContent + " ▍"} />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="flex items-start gap-3 justify-start">
              {/* Zantara avatar durante il loading */}
              <div className="w-14 h-14 rounded-full flex-shrink-0 overflow-hidden">
                <img
                  src="/images/zantara_avatar.png"
                  alt="Zantara AI"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 max-w-[75%]">
                <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
                  <ThinkingIndicator />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <div className="shrink-0 border-t border-white/5 p-4 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto">
            {uploadPreview && (
              <div className="px-6 pt-4 pb-2 animate-fade-in">
                <div className="relative inline-block group">
                  <img
                    src={uploadPreview || "/placeholder.svg"}
                    alt="Upload preview"
                    className="h-20 w-20 object-cover rounded-lg border-2 border-gray-600 shadow-lg"
                  />
                  <button
                    onClick={() => setUploadPreview(null)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg transition-all opacity-0 group-hover:opacity-100 hover:scale-110"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="relative group">
                <div className="relative rounded-3xl p-[1px]">
                  <div className="relative flex items-end gap-5 rounded-3xl bg-gray-600/30 backdrop-blur-sm p-8 border border-gray-500/20">
                    <div className="relative flex-1">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan Anda..."
                        className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 text-base leading-relaxed font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]"
                        rows={1}
                        disabled={isLoading}
                        style={{ minHeight: "40px", maxHeight: "120px" }}
                      />
                      <div className="absolute bottom-2 right-2 text-[11px] text-gray-500/60 pointer-events-none select-none">
                        <span>Enter • Shift+Enter</span>
                      </div>
                    </div>

                    {/* Send Button - 120px */}
                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 active:scale-95"
                      aria-label="Send message"
                    >
                      <img
                        src="/images/sendb.pdf.svg"
                        alt=""
                        className="w-30 h-30 object-contain"
                      />
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {showImageModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-gradient-to-br from-purple-900/90 via-indigo-900/90 to-purple-900/90 rounded-3xl shadow-2xl border-2 border-purple-400/30 p-8 max-w-lg w-full animate-scale-in backdrop-blur-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-white bg-gradient-to-r from-purple-200 to-pink-200 bg-clip-text text-transparent">
                Generate Magical Image
              </h3>
              <button
                onClick={() => setShowImageModal(false)}
                className="text-white/60 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="relative">
                <textarea
                  value={imagePrompt}
                  onChange={(e) => setImagePrompt(e.target.value)}
                  placeholder="Describe your imagination... A dragon flying over a crystal city, an astronaut riding a unicorn..."
                  className="w-full px-4 py-3 bg-black/30 border border-purple-400/30 rounded-2xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-purple-400/50 resize-none h-32 backdrop-blur-sm"
                  autoFocus
                />
                <div className="absolute bottom-2 right-2 text-xs text-white/40">{imagePrompt.length} chars</div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowImageModal(false)}
                  className="flex-1 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-all duration-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerateImage}
                  disabled={!imagePrompt.trim() || isGeneratingImage}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isGeneratingImage ? (
                    <>
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                        />
                      </svg>
                      Creating...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
                        />
                      </svg>
                      Generate
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="mt-4 p-3 bg-purple-500/10 rounded-lg border border-purple-400/20">
              <p className="text-xs text-purple-200/80">
                Powered by Google Imagen AI - Your imagination brought to life with cutting-edge generative technology
              </p>
            </div>
          </div>
        </div>
      )}

      <RAGDrawer metadata={drawerMetadata} isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />
    </div>
  )
}
