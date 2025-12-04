// src/app/chat/components/ChatMessages.tsx
"use client"

import { useRef, useEffect } from "react"
import { MarkdownRenderer } from "@/components/chat/MarkdownRenderer"
import { ThinkingIndicator } from "@/components/chat/ThinkingIndicator"
import type { ChatMessagesProps } from "../types"

export function ChatMessages({ messages, streamingContent, isLoading, avatarImage }: ChatMessagesProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, streamingContent])

  return (
    <>
      <div className="max-w-5xl mx-auto space-y-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-start gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"} animate-message-fade-in`}
          >
            {msg.role === "user" && (
              <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-br from-purple-600 via-purple-500 to-indigo-600 shadow-lg flex-shrink-0 flex items-center justify-center">
                {avatarImage ? (
                  <img src={avatarImage} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
            )}

            {msg.role === "assistant" && (
              <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
                <img src="/images/logo_zan.svg" alt="Zantara AI" className="w-10 h-10 object-contain" />
              </div>
            )}

            <div className="flex flex-col gap-1 max-w-[75%]">
              <div className={`bg-gray-500/20 backdrop-blur-sm px-4 py-2.5 shadow-lg border border-gray-400/30 ${
                msg.role === "user" ? "rounded-2xl rounded-br-md" : "rounded-2xl rounded-bl-md"
              }`}>
                <div className="text-white text-base leading-relaxed">
                  <MarkdownRenderer content={msg.content} />
                </div>
              </div>
              <span className={`text-xs text-gray-500 px-2 ${msg.role === "user" ? "text-right" : "text-left"}`}>
                {new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Streaming Message */}
      {streamingContent && (
        <div className="flex items-start gap-3 justify-start animate-message-fade-in">
          <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
            <img src="/images/logo_zan.svg" alt="Zantara AI" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex-1 max-w-[75%]">
            <div className="bg-gray-500/20 backdrop-blur-sm px-4 py-2.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
              <div className="text-white text-base leading-relaxed">
                <MarkdownRenderer content={streamingContent + " ▍"} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading Indicator */}
      {isLoading && !streamingContent && (
        <div className="flex items-start gap-3 justify-start">
          <div className="w-10 h-10 rounded-full flex-shrink-0 overflow-hidden bg-white/10 flex items-center justify-center">
            <img src="/images/logo_zan.svg" alt="Zantara AI" className="w-10 h-10 object-contain" />
          </div>
          <div className="flex-1 max-w-[75%]">
            <div className="bg-gray-500/20 backdrop-blur-sm px-4 py-2.5 rounded-2xl rounded-bl-md shadow-lg border border-gray-400/30">
              <ThinkingIndicator />
            </div>
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </>
  )
}
