"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { chatAPI } from "@/lib/api/chat"
import { authAPI } from "@/lib/api/auth"
import { apiClient } from "@/lib/api/client"
import { RAGDrawer } from "@/components/chat/RAGDrawer"
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
    const token = apiClient.getToken()
    if (!token) {
      router.push("/")
    }
  }, [router])

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
    let metadata = undefined

    try {
      await chatAPI.streamChat(
        userMessage,
        (chunk) => {
          accumulatedContent += chunk
          setStreamingContent(accumulatedContent)
        },
        (meta) => {
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
        (error) => {
          console.error("[v0] Chat stream error:", error)
          setStreamingContent("")
          setIsLoading(false)
          const errorMessage: ChatMessage = {
            role: "assistant",
            content: "Sorry, I encountered an error. Please try again.",
          }
          setMessages((prev) => [...prev, errorMessage])
        },
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
      handleSubmit(e as any)
    }
  }

  const handleLogout = () => {
    apiClient.clearToken()
    authAPI.clearUser()
    router.push("/")
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
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || "",
          },
          body: JSON.stringify({
            instances: [{ prompt: imagePrompt }],
            parameters: {
              sampleCount: 1,
              aspectRatio: "1:1",
            },
          }),
        },
      )

      const data = await response.json()
      if (data.predictions?.[0]?.bytesBase64Encoded) {
        const imageData = `data:image/png;base64,${data.predictions[0].bytesBase64Encoded}`
        setGeneratedImage(imageData)
      }
    } catch (error) {
      console.error("[v0] Image generation error:", error)
      alert("Failed to generate image. Please try again.")
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
            className={`fixed left-0 top-0 h-full w-80 bg-[#1a1a1a]/95 backdrop-blur-md border-r border-gray-800/50 transform transition-transform duration-300 ease-in-out z-40 ${
              isSidebarOpen ? "translate-x-0" : "-translate-x-full"
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

      <div className={`flex flex-col min-h-screen transition-all duration-300 ${isSidebarOpen ? "ml-80" : "ml-0"}`}>
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-gray-700/50 backdrop-blur-sm sticky top-0 z-30">
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
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                isCheckedIn
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

          <div className="flex items-center gap-3 animate-pulse-glow -my-16 scale-[3] mx-auto">
            <img
              src="/logo-zantara.svg"
              alt="ZANTARA"
              className="h-8 w-auto drop-shadow-[0_0_10px_rgba(212,175,55,0.3)]"
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
                className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 shadow-[0_0_20px_rgba(147,51,234,0.5)] hover:shadow-[0_0_30px_rgba(147,51,234,0.7)] transition-all duration-300 hover:scale-110 flex items-center justify-center"
                title="Click to upload avatar"
              >
                {avatarImage ? (
                  <img src={avatarImage || "/placeholder.svg"} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
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

        <main className="flex-1 overflow-y-auto px-4 py-6 max-h-[calc(100vh-180px)]">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center text-center space-y-3 py-16">
              <h1 className="text-3xl md:text-4xl font-bold tracking-wide animate-fade-in-down relative">
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
                    <div className="w-14 h-14 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.6),inset_0_2px_10px_rgba(255,255,255,0.3)] animate-pulse-subtle" />
                  )}

                  <div className="flex flex-col gap-1 max-w-[75%]">
                    {msg.role === "user" ? (
                      <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-br-md shadow-lg border border-gray-400/30">
                        <p className="text-white text-base leading-relaxed whitespace-pre-wrap font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
                          {msg.content}
                        </p>
                      </div>
                    ) : (
                      <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
                        <p className="text-white text-base leading-relaxed whitespace-pre-wrap font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
                          {msg.content}
                        </p>
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
              <div className="w-14 h-14 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.6),inset_0_2px_10px_rgba(255,255,255,0.3)] animate-pulse" />

              <div className="flex-1 max-w-[75%]">
                <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
                  <p className="text-white text-base leading-relaxed whitespace-pre-wrap font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif]">
                    {streamingContent}
                    <span className="inline-block w-2 h-4 bg-[#d4af37] ml-1 animate-pulse" />
                  </p>
                </div>
              </div>
            </div>
          )}

          {isLoading && !streamingContent && (
            <div className="flex items-start gap-3 justify-start">
              {/* Loading indicator avatar also uses gemstone gradient */}
              <div className="w-14 h-14 rounded-full flex-shrink-0 bg-gradient-to-br from-purple-400 via-violet-500 to-purple-600 shadow-[0_0_20px_rgba(139,92,246,0.6),inset_0_2px_10px_rgba(255,255,255,0.3)] animate-pulse" />

              <div className="flex-1 max-w-[75%]">
                <div className="bg-gray-500/20 backdrop-blur-sm px-3 py-1.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                    <span className="text-sm text-gray-400 animate-pulse">Zantara sta pensando...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </main>

        <div className="sticky bottom-0 border-t border-white/5 p-4 backdrop-blur-sm">
          <div className="max-w-3xl mx-auto">
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
                  <div className="relative flex items-end gap-2 rounded-3xl bg-gray-600/30 backdrop-blur-sm p-3 border border-gray-500/20">
                    <div className="relative flex-1">
                      <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Ketik pesan Anda..."
                        className="w-full bg-transparent border-none outline-none resize-none text-white placeholder-gray-500 text-base leading-relaxed font-[system-ui,-apple-system,BlinkMacSystemFont,'Segoe_UI',sans-serif] pr-24"
                        rows={1}
                        disabled={isLoading}
                        style={{ minHeight: "24px", maxHeight: "120px" }}
                      />
                      <div className="absolute bottom-1 right-1 text-[10px] text-gray-500/60 pointer-events-none select-none">
                        <span>Enter • Shift+Enter</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowImageModal(true)}
                      disabled={isGeneratingImage}
                      className="flex-shrink-0 p-2.5 rounded-xl bg-purple-600/40 hover:bg-purple-600/60 text-purple-200 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40"
                      title="Generate Image"
                    >
                      {isGeneratingImage ? (
                        <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      type="button"
                      className="flex-shrink-0 p-2.5 rounded-xl bg-gray-700/40 hover:bg-gray-600/50 text-gray-300 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
                      title="Attach file"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </button>

                    <button
                      type="submit"
                      disabled={isLoading || !input.trim()}
                      className="relative flex-shrink-0 w-11 h-11 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-300 hover:scale-110 active:scale-95 overflow-hidden"
                      style={{
                        background:
                          "linear-gradient(145deg, #f4d03f 0%, #d4af37 30%, #b8941f 60%, #d4af37 80%, #f4d03f 100%)",
                        boxShadow:
                          "0 6px 20px rgba(212, 175, 55, 0.5), 0 2px 8px rgba(212, 175, 55, 0.3), inset 0 1px 0 rgba(255,255,255,0.4), inset 0 -3px 6px rgba(0,0,0,0.3)",
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-transparent to-black/20" />
                      <div className="absolute inset-[2px] rounded-lg bg-gradient-to-br from-yellow-300/20 to-transparent" />
                      <span
                        className="relative text-2xl font-bold bg-gradient-to-br from-gray-800 via-gray-900 to-black bg-clip-text text-transparent flex items-center justify-center h-full"
                        style={{
                          filter: "drop-shadow(0 1px 1px rgba(255,255,255,0.5))",
                          transform: "translateY(-1px)",
                        }}
                      >
                        ∞
                      </span>
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
