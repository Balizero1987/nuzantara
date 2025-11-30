'use client'

import * as React from 'react'
import { Search, Sparkles, Clock, Hash } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SearchSuggestion {
  id: string
  type: 'chat' | 'command' | 'history'
  title: string
  subtitle?: string
  icon: React.ReactNode
  action: () => void
}

interface SidebarSearchProps {
  className?: string
  onChatSelect?: (chatId: string) => void
}

// Mock data - sostituire con dati reali dal backend
const mockChats = [
  { id: '1', title: 'Project Planning Discussion', preview: 'Discussing Q1 roadmap...', timestamp: '2 hours ago' },
  { id: '2', title: 'Code Review Session', preview: 'Reviewing PR #123...', timestamp: '1 day ago' },
  { id: '3', title: 'Architecture Decision', preview: 'Database schema changes...', timestamp: '3 days ago' },
]

const mockCommands = [
  { id: 'new-chat', title: 'New Chat', subtitle: 'Start a fresh conversation', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'image-gen', title: 'Generate Image', subtitle: 'Create AI images', icon: <Hash className="w-4 h-4" /> },
  { id: 'voice-chat', title: 'Voice Chat', subtitle: 'Talk with AI', icon: <Clock className="w-4 h-4" /> },
]

export function SidebarSearch({ className, onChatSelect }: SidebarSearchProps) {
  const [query, setQuery] = React.useState('')
  const [suggestions, setSuggestions] = React.useState<SearchSuggestion[]>([])
  const [isOpen, setIsOpen] = React.useState(false)

  React.useEffect(() => {
    if (!query.trim()) {
      setSuggestions([])
      setIsOpen(false)
      return
    }

    const filtered: SearchSuggestion[] = []

    // Filter chats
    mockChats.forEach(chat => {
      if (chat.title.toLowerCase().includes(query.toLowerCase()) ||
        chat.preview.toLowerCase().includes(query.toLowerCase())) {
        filtered.push({
          id: chat.id,
          type: 'chat',
          title: chat.title,
          subtitle: chat.preview,
          icon: <Clock className="w-4 h-4" />,
          action: () => {
            onChatSelect?.(chat.id)
            setQuery('')
            setIsOpen(false)
          }
        })
      }
    })

    // Filter commands
    mockCommands.forEach(cmd => {
      if (cmd.title.toLowerCase().includes(query.toLowerCase())) {
        filtered.push({
          ...cmd,
          type: 'command',
          action: () => {
            setQuery('')
            setIsOpen(false)
            // Esegui comando
            console.log('Execute command:', cmd.id)
          }
        })
      }
    })

    setSuggestions(filtered.slice(0, 5)) // Limit to 5 suggestions
    setIsOpen(filtered.length > 0)
  }, [query, onChatSelect])

  const handleKeyDown = React.useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setQuery('')
      setIsOpen(false)
    }
  }, [])

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(query.length > 0 && suggestions.length > 0)}
          placeholder="Search chats, commands..."
          className="w-full pl-10 pr-4 py-2.5 bg-[#2a2a2a] text-white text-sm rounded-lg border border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#d4af37]/50 focus:border-[#d4af37] placeholder-gray-500 transition-all"
        />
      </div>

      {/* Search Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-xl z-50 max-h-64 overflow-y-auto">
          <div className="p-1">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={suggestion.action}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#3a3a3a] rounded-md transition-colors group"
              >
                <div className="text-gray-400 group-hover:text-[#d4af37] transition-colors">
                  {suggestion.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {suggestion.title}
                  </div>
                  {suggestion.subtitle && (
                    <div className="text-gray-400 text-xs truncate">
                      {suggestion.subtitle}
                    </div>
                  )}
                </div>
                {suggestion.type === 'command' && (
                  <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono bg-[#3a3a3a] text-gray-400 rounded border border-gray-600">
                    ⌘{suggestion.id.charAt(0).toUpperCase()}
                  </kbd>
                )}
              </button>
            ))}
          </div>

          {suggestions.length === 0 && query && (
            <div className="p-4 text-center text-gray-400 text-sm">
              No results found for &quot;{query}&quot;
            </div>
          )}
        </div>
      )}

      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  )
}