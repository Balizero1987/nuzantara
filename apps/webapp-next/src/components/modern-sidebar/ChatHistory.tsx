'use client'

import * as React from 'react'
import {
  MessageSquare,
  Clock,
  Star,
  Trash2,
  MoreHorizontal,
  Plus,
  Sparkles,
  Brain,
  Image as ImageIcon,
  FileText,
  Mic,
  Archive
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChatMessage {
  id: string
  title: string
  lastMessage: string
  timestamp: string
  isPinned?: boolean
  type: 'text' | 'image' | 'file' | 'voice'
  messageCount: number
}

interface ChatHistoryProps {
  className?: string
  onChatSelect?: (chatId: string) => void
  onNewChat?: () => void
}

// Mock data - sostituire con dati reali dal backend
const mockChats: ChatMessage[] = [
  {
    id: '1',
    title: 'Project Planning Discussion',
    lastMessage: 'Let\'s review the Q1 roadmap and prioritize...',
    timestamp: '2 hours ago',
    isPinned: true,
    type: 'text',
    messageCount: 23
  },
  {
    id: '2',
    title: 'Code Review Session',
    lastMessage: 'The PR looks good, just minor suggestions...',
    timestamp: '1 day ago',
    type: 'text',
    messageCount: 15
  },
  {
    id: '3',
    title: 'Logo Design Ideas',
    lastMessage: 'Here are the AI-generated logo concepts...',
    timestamp: '3 days ago',
    type: 'image',
    messageCount: 8
  },
  {
    id: '4',
    title: 'Voice Meeting Notes',
    lastMessage: '[Transcribed] Today we discussed the API...',
    timestamp: '1 week ago',
    type: 'voice',
    messageCount: 34
  },
  {
    id: '5',
    title: 'Architecture Documentation',
    lastMessage: 'Find attached the system design doc...',
    timestamp: '2 weeks ago',
    type: 'file',
    messageCount: 12
  }
]

// Helper function - defined outside component
const getChatIcon = (type: ChatMessage['type']) => {
  switch (type) {
    case 'image':
      return <ImageIcon className="w-4 h-4" />
    case 'file':
      return <FileText className="w-4 h-4" />
    case 'voice':
      return <Mic className="w-4 h-4" />
    default:
      return <MessageSquare className="w-4 h-4" />
  }
}

export function ChatHistory({ className, onChatSelect, onNewChat }: ChatHistoryProps) {
  const [chats, setChats] = React.useState<ChatMessage[]>(mockChats)
  const [selectedChatId, setSelectedChatId] = React.useState<string | null>('1')

  const handleChatSelect = React.useCallback((chatId: string) => {
    setSelectedChatId(chatId)
    onChatSelect?.(chatId)
  }, [onChatSelect])

  const togglePin = React.useCallback((chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, isPinned: !chat.isPinned }
        : chat
    ))
  }, [])

  const deleteChat = React.useCallback((chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setChats(prev => prev.filter(chat => chat.id !== chatId))
    if (selectedChatId === chatId) {
      setSelectedChatId(null)
    }
  }, [selectedChatId])

  const formatTimestamp = (timestamp: string) => {
    return timestamp
  }

  // Separate pinned and regular chats
  const pinnedChats = chats.filter(chat => chat.isPinned)
  const regularChats = chats.filter(chat => !chat.isPinned)

  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* New Chat Button */}
      <button
        onClick={onNewChat}
        className="flex items-center gap-2 w-full p-3 mb-2 bg-gradient-to-r from-[#d4af37] to-[#f0c75e] text-black font-medium rounded-lg hover:from-[#f0c75e] hover:to-[#d4af37] transition-all duration-200 shadow-lg hover:shadow-[0_0_15px_rgba(212,175,55,0.4)]"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm">New Chat</span>
      </button>

      {/* AI Quick Actions */}
      <div className="px-3 mb-4">
        <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">
          AI Quick Actions
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button className="flex flex-col items-center gap-1 p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors group">
            <Brain className="w-4 h-4 text-gray-400 group-hover:text-[#d4af37] transition-colors" />
            <span className="text-xs text-gray-300">Analyze</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors group">
            <Sparkles className="w-4 h-4 text-gray-400 group-hover:text-[#d4af37] transition-colors" />
            <span className="text-xs text-gray-300">Generate</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors group">
            <ImageIcon className="w-4 h-4 text-gray-400 group-hover:text-[#d4af37] transition-colors" />
            <span className="text-xs text-gray-300">Create</span>
          </button>
          <button className="flex flex-col items-center gap-1 p-2 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors group">
            <Archive className="w-4 h-4 text-gray-400 group-hover:text-[#d4af37] transition-colors" />
            <span className="text-xs text-gray-300">Organize</span>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto px-3 relative">
        {/* Subtle Background Pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: 'url(/images/image_art/zantara_data_flow_transparent.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        />
        {pinnedChats.length > 0 && (
          <div className="mb-4">
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Star className="w-3 h-3" />
              Pinned Chats
            </div>
            <div className="space-y-1">
              {pinnedChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChatId === chat.id}
                  onSelect={() => handleChatSelect(chat.id)}
                  onTogglePin={togglePin}
                  onDelete={deleteChat}
                />
              ))}
            </div>
          </div>
        )}

        {regularChats.length > 0 && (
          <div>
            <div className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Recent Chats
            </div>
            <div className="space-y-1">
              {regularChats.map((chat) => (
                <ChatItem
                  key={chat.id}
                  chat={chat}
                  isSelected={selectedChatId === chat.id}
                  onSelect={() => handleChatSelect(chat.id)}
                  onTogglePin={togglePin}
                  onDelete={deleteChat}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

interface ChatItemProps {
  chat: ChatMessage
  isSelected: boolean
  onSelect: () => void
  onTogglePin: (chatId: string, e: React.MouseEvent) => void
  onDelete: (chatId: string, e: React.MouseEvent) => void
}

function ChatItem({ chat, isSelected, onSelect, onTogglePin, onDelete }: ChatItemProps) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'relative group flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all duration-200',
        isSelected
          ? 'bg-[#3a3a3a] border border-[#d4af37]/30'
          : 'hover:bg-[#2a2a2a] border border-transparent'
      )}
    >
      {/* Chat Icon */}
      <div className={cn(
        'flex items-center justify-center w-8 h-8 rounded-md mt-0.5',
        isSelected ? 'bg-[#d4af37]/20 text-[#d4af37]' : 'bg-[#404040] text-gray-400'
      )}>
        {getChatIcon(chat.type)}
      </div>

      {/* Chat Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <h3 className={cn(
            'text-sm font-medium truncate',
            isSelected ? 'text-white' : 'text-gray-300'
          )}>
            {chat.title}
          </h3>
          {chat.isPinned && (
            <Star className="w-3 h-3 text-[#d4af37] fill-current flex-shrink-0" />
          )}
        </div>
        <p className="text-xs text-gray-400 truncate mb-1">
          {chat.lastMessage}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{chat.messageCount} messages</span>
          <span>•</span>
          <span>{chat.timestamp}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
        <button
          onClick={(e) => onTogglePin(chat.id, e)}
          className="p-1 rounded hover:bg-[#404040] transition-colors"
        >
          <Star className={cn(
            'w-3 h-3',
            chat.isPinned ? 'text-[#d4af37] fill-current' : 'text-gray-400'
          )} />
        </button>
        <button
          onClick={(e) => onDelete(chat.id, e)}
          className="p-1 rounded hover:bg-[#404040] transition-colors"
        >
          <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-400 transition-colors" />
        </button>
      </div>
    </div>
  )
}