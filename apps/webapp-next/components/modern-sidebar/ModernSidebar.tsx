'use client'

import * as React from 'react'
import {
  Menu,
  X,
  Settings,
  User,
  HelpCircle,
  LogOut,
  Zap,
  Shield,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { SidebarProvider, useSidebar } from './SidebarProvider'
import { SidebarSearch } from './SidebarSearch'
import { ChatHistory } from './ChatHistory'

interface ModernSidebarProps {
  className?: string
  children?: React.ReactNode
  onChatSelect?: (chatId: string) => void
  onNewChat?: () => void
}

function SidebarContent({ className, onChatSelect, onNewChat }: ModernSidebarProps) {
  const { open, openMobile, setOpenMobile, isMobile } = useSidebar()
  const [showUserMenu, setShowUserMenu] = React.useState(false)

  const handleChatSelect = React.useCallback((chatId: string) => {
    onChatSelect?.(chatId)
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [onChatSelect, isMobile, setOpenMobile])

  const handleNewChat = React.useCallback(() => {
    onNewChat?.()
    if (isMobile) {
      setOpenMobile(false)
    }
  }, [onNewChat, isMobile, setOpenMobile])

  const sidebarClasses = cn(
    'fixed top-0 left-0 h-full bg-[#1a1a1a] border-r border-gray-800 transition-all duration-300 z-50 flex flex-col',
    !isMobile && open ? 'w-80' : !isMobile ? 'w-16' : 'w-80',
    isMobile && (openMobile ? 'translate-x-0' : '-translate-x-full'),
    className
  )

  const isCollapsed = !isMobile && !open

  return (
    <>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div
          className={sidebarClasses}
          style={{
            backgroundImage: 'url(/images/image_art/Bali_zero_hq_Subtle_geometric_pattern,_golden_lines_on_dark_background,_minima_3d95f5d2-0f4e-477c-bc1f-a6f750466cce.png)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundBlend: 'overlay'
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            {!isCollapsed ? (
              <div className="flex items-center gap-3">
                <img
                  src="/images/zantara_avatar.png"
                  alt="Zantara AI"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-white font-bold text-sm">Zantara AI</h1>
                  <p className="text-gray-400 text-xs">Assistant Pro</p>
                </div>
              </div>
            ) : (
              <img
                src="/images/zantara_avatar.png"
                alt="Zantara AI"
                className="w-10 h-10 rounded-full object-cover mx-auto"
              />
            )}

            {/* Toggle Button */}
            <button
              onClick={() => setOpenMobile(!openMobile)}
              className="p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
            >
              <Menu className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Search */}
          {!isCollapsed && (
            <div className="p-4">
              <SidebarSearch onChatSelect={handleChatSelect} />
            </div>
          )}

          {/* Chat History */}
          {!isCollapsed && (
            <div className="flex-1 overflow-hidden">
              <ChatHistory
                onChatSelect={handleChatSelect}
                onNewChat={handleNewChat}
              />
            </div>
          )}

          {/* Bottom Actions - Collapsed */}
          {isCollapsed && (
            <div className="p-3 space-y-2">
              <button className="w-full aspect-square flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors group">
                <Menu className="w-5 h-5 text-gray-400 group-hover:text-[#d4af37]" />
              </button>
              <button className="w-full aspect-square flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors group">
                <Settings className="w-5 h-5 text-gray-400 group-hover:text-[#d4af37]" />
              </button>
              <button className="w-full aspect-square flex items-center justify-center rounded-lg hover:bg-[#2a2a2a] transition-colors group">
                <HelpCircle className="w-5 h-5 text-gray-400 group-hover:text-[#d4af37]" />
              </button>
            </div>
          )}

          {/* Bottom Section - Expanded */}
          {!isCollapsed && (
            <div className="border-t border-gray-800 p-4 space-y-3">
              {/* AI Status */}
              <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
                <div className="relative">
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-ping absolute inset-0"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white font-medium">AI Assistant Online</div>
                  <div className="text-xs text-gray-400">GPT-4 Turbo • Fast response</div>
                </div>
                <Zap className="w-4 h-4 text-[#d4af37]" />
              </div>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-full flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg hover:bg-[#3a3a3a] transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="text-sm text-white font-medium">Admin User</div>
                    <div className="text-xs text-gray-400">Pro Plan • Active</div>
                  </div>
                  <ChevronDown className={cn(
                    'w-4 h-4 text-gray-400 transition-transform',
                    showUserMenu && 'rotate-180'
                  )} />
                </button>

                {/* User Dropdown */}
                {showUserMenu && (
                  <div className="absolute bottom-full left-0 right-0 mb-2 bg-[#2a2a2a] border border-gray-700 rounded-lg shadow-xl z-50">
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-[#3a3a3a] transition-colors rounded-t-lg">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Profile</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-[#3a3a3a] transition-colors">
                      <Settings className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Settings</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-[#3a3a3a] transition-colors">
                      <Shield className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Privacy</span>
                    </button>
                    <button className="w-full flex items-center gap-3 p-3 hover:bg-[#3a3a3a] transition-colors">
                      <HelpCircle className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">Help</span>
                    </button>
                    <div className="border-t border-gray-700">
                      <button className="w-full flex items-center gap-3 p-3 hover:bg-[#3a3a3a] transition-colors rounded-b-lg text-red-400">
                        <LogOut className="w-4 h-4" />
                        <span className="text-sm">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <>
          {/* Mobile Sidebar */}
          <div
            className={sidebarClasses}
            style={{
              backgroundImage: 'url(/images/image_art/Bali_zero_hq_Subtle_geometric_pattern,_golden_lines_on_dark_background,_minima_3d95f5d2-0f4e-477c-bc1f-a6f750466cce.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundBlend: 'overlay'
            }}
          >
            {/* Mobile Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-800">
              <div className="flex items-center gap-3">
                <img
                  src="/images/zantara_avatar.png"
                  alt="Zantara AI"
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div>
                  <h1 className="text-white font-bold text-sm">Zantara AI</h1>
                  <p className="text-gray-400 text-xs">Assistant Pro</p>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={() => setOpenMobile(false)}
                className="p-1.5 rounded-lg hover:bg-[#2a2a2a] transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Mobile Search */}
            <div className="p-4">
              <SidebarSearch onChatSelect={handleChatSelect} />
            </div>

            {/* Mobile Chat History */}
            <div className="flex-1 overflow-hidden">
              <ChatHistory
                onChatSelect={handleChatSelect}
                onNewChat={handleNewChat}
              />
            </div>

            {/* Mobile Bottom */}
            <div className="border-t border-gray-800 p-4 space-y-3">
              <div className="flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
                <div className="relative">
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-pulse"></div>
                  <div className="w-2 h-2 bg-[#d4af37] rounded-full animate-ping absolute inset-0"></div>
                </div>
                <div className="flex-1">
                  <div className="text-xs text-white font-medium">AI Assistant Online</div>
                  <div className="text-xs text-gray-400">GPT-4 Turbo • Fast response</div>
                </div>
                <Zap className="w-4 h-4 text-[#d4af37]" />
              </div>

              <button className="w-full flex items-center gap-3 p-3 bg-[#2a2a2a] rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="text-sm text-white font-medium">Admin User</div>
                  <div className="text-xs text-gray-400">Pro Plan • Active</div>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Backdrop */}
          {openMobile && (
            <div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              onClick={() => setOpenMobile(false)}
            />
          )}
        </>
      )}
    </>
  )
}

export function ModernSidebar(props: ModernSidebarProps) {
  return (
    <SidebarProvider>
      <SidebarContent {...props} />
    </SidebarProvider>
  )
}

export { useSidebar } from './SidebarProvider'