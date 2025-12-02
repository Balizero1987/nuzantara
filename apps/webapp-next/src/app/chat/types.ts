// src/app/chat/types.ts
import type { Message, CRMContext } from "@/lib/store/chat-store"

// Re-export from chat-store for backward compatibility
export type { Message, CRMContext }

export interface ChatHeaderProps {
  user: any
  avatarImage: string | null
  isCheckedIn: boolean
  crmContext: CRMContext | null
  isSidebarOpen: boolean
  onToggleSidebar: () => void
  onCheckInOut: () => void
  onAvatarUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onLogout: () => void
}

export interface ChatSidebarProps {
  isOpen: boolean
  previousChats: PreviousChat[]
  onNewChat: () => void
  onSelectChat: (chatId: number) => void
  onClose: () => void
}

export interface ChatMessagesProps {
  messages: Message[]
  streamingContent: string
  isLoading: boolean
  avatarImage: string | null
}

export interface ChatInputProps {
  input: string
  isLoading: boolean
  uploadPreview: string | null
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void
  onSubmit: (e: React.FormEvent) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void
  onClearPreview: () => void
  onOpenImageModal: () => void
}

export interface ImageModalProps {
  isOpen: boolean
  imagePrompt: string
  isGenerating: boolean
  onClose: () => void
  onPromptChange: (value: string) => void
  onGenerate: () => void
}

export interface WelcomeScreenProps {}

export interface PreviousChat {
  id: number
  title: string
  date: string
}
