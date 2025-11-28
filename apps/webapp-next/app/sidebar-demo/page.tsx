"use client"

import * as React from 'react'
import { ModernSidebar } from '@/components/modern-sidebar'
import { MessageSquare, Send, Paperclip, Mic } from 'lucide-react'

export default function SidebarDemoPage() {
  const [selectedChat, setSelectedChat] = React.useState<string | null>('1')
  const [messages, setMessages] = React.useState<Array<{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: string
  }>>([
    {
      id: '1',
      role: 'assistant',
      content: 'Hello! I\'m your AI assistant. How can I help you today?',
      timestamp: '10:30 AM'
    },
    {
      id: '2',
      role: 'user',
      content: 'Can you help me plan my project?',
      timestamp: '10:31 AM'
    },
    {
      id: '3',
      role: 'assistant',
      content: 'I\'d be happy to help you plan your project! Let me break down the key areas we should consider:\n\n1. **Project Goals & Objectives**\n   - What are you trying to achieve?\n   - Success metrics\n   - Timeline constraints\n\n2. **Resource Planning**\n   - Team composition\n   - Budget considerations\n   - Technical requirements\n\n3. **Risk Assessment**\n   - Potential obstacles\n   - Mitigation strategies\n   - Contingency plans\n\nWhat specific aspect would you like to dive deeper into?',
      timestamp: '10:32 AM'
    }
  ])

  const [newMessage, setNewMessage] = React.useState('')

  const handleChatSelect = React.useCallback((chatId: string) => {
    setSelectedChat(chatId)
    // Qui potresti caricare i messaggi del chat selezionato
    console.log('Selected chat:', chatId)
  }, [])

  const handleNewChat = React.useCallback(() => {
    setSelectedChat(null)
    setMessages([])
    console.log('Starting new chat')
  }, [])

  const handleSendMessage = React.useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    const userMessage = {
      id: Date.now().toString(),
      role: 'user' as const,
      content: newMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    setMessages(prev => [...prev, userMessage])
    setNewMessage('')

    // Simula risposta AI
    setTimeout(() => {
      const aiMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant' as const,
        content: `I understand you said: "${newMessage}". Let me help you with that...`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
      setMessages(prev => [...prev, aiMessage])
    }, 1000)
  }, [newMessage])

  return (
    <div className="h-screen flex bg-[#0a0a0a]">
      {/* Modern Sidebar */}
      <ModernSidebar
        onChatSelect={handleChatSelect}
        onNewChat={handleNewChat}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-[#1a1a1a] p-4 relative">
          {/* Golden Divider */}
          <div
            className="absolute bottom-0 left-0 right-0 h-px"
            style={{
              backgroundImage: 'url(/images/image_art/zantara_divider_dark_transparent.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          />
          <div className="flex items-center justify-between relative">
            {/* Corner Decoration Top Right */}
            <div
              className="absolute top-0 right-0 w-8 h-8 opacity-30"
              style={{
                backgroundImage: 'url(/images/image_art/zantara_ornate_corner_transparent.png)',
                backgroundSize: 'contain',
                backgroundPosition: 'top right',
                backgroundRepeat: 'no-repeat'
              }}
            />
            <div>
              <h1 className="text-xl font-semibold text-white">
                {selectedChat ? 'Chat Conversation' : 'New Chat'}
              </h1>
              <p className="text-sm text-gray-400">
                AI Assistant • GPT-4 Turbo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-[#2a2a2a] rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-gray-300">Online</span>
              </div>
            </div>
          </div>
        </header>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center relative">
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
              <div className="w-16 h-16 bg-gradient-to-br from-[#d4af37] to-[#f0c75e] rounded-2xl flex items-center justify-center mb-4 relative z-10 -mt-2">
                <MessageSquare className="w-10 h-10 text-black" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">
                Start a new conversation
              </h2>
              <p className="text-gray-400 mb-6 max-w-md">
                Ask me anything! I can help with planning, analysis, creative work, coding, and much more.
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors text-sm">
                  📊 Plan a project
                </button>
                <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors text-sm">
                  💡 Brainstorm ideas
                </button>
                <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors text-sm">
                  🔍 Analyze data
                </button>
                <button className="px-4 py-2 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-white rounded-lg transition-colors text-sm">
                  ✍️ Write content
                </button>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-3xl p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-[#d4af37] to-[#f0c75e] text-black'
                      : 'bg-[#2a2a2a] text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  <div className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-black/70' : 'text-gray-400'
                  }`}>
                    {message.timestamp}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-800 bg-[#1a1a1a] p-4">
          <form onSubmit={handleSendMessage} className="flex items-end gap-3">
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-4 py-3 bg-[#2a2a2a] text-white rounded-xl border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] placeholder-gray-500 resize-none"
                  rows={1}
                  style={{ minHeight: '48px', maxHeight: '120px' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="p-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-400 rounded-xl transition-colors"
              >
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-400 rounded-xl transition-colors flex items-center justify-center"
              >
                <img
                  src="/images/create_image.png"
                  alt="Create Image"
                  className="w-5 h-5"
                />
              </button>
              <button
                type="button"
                className="p-2.5 bg-[#2a2a2a] hover:bg-[#3a3a3a] text-gray-400 rounded-xl transition-colors"
              >
                <Mic className="w-5 h-5" />
              </button>
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="p-2.5 bg-gradient-to-r from-[#d4af37] to-[#f0c75e] hover:from-[#f0c75e] hover:to-[#d4af37] text-black rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)] flex items-center justify-center"
              >
                <img
                  src="/images/infinity_button.png"
                  alt="Send"
                  className="w-5 h-5"
                />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}