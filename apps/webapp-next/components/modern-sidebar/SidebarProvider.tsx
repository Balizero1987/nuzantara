'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

type SidebarState = 'expanded' | 'collapsed'
type SidebarContextType = {
  state: SidebarState
  open: boolean
  setOpen: (open: boolean) => void
  openMobile: boolean
  setOpenMobile: (open: boolean) => void
  isMobile: boolean
  toggleSidebar: () => void
}

const SidebarContext = React.createContext<SidebarContextType | null>(null)

export function useSidebar() {
  const context = React.useContext(SidebarContext)
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider.')
  }
  return context
}

export interface SidebarProviderProps {
  children: React.ReactNode
  defaultOpen?: boolean
  className?: string
}

export function SidebarProvider({
  children,
  defaultOpen = true,
  className
}: SidebarProviderProps) {
  const [open, setOpen] = React.useState(defaultOpen)
  const [openMobile, setOpenMobile] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)
  const [state, setState] = React.useState<SidebarState>(
    defaultOpen ? 'expanded' : 'collapsed'
  )

  // Handle mobile detection
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setOpenMobile(false)
      }
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Update state based on open prop
  React.useEffect(() => {
    setState(open ? 'expanded' : 'collapsed')
  }, [open])

  const toggleSidebar = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(prev => !prev)
    } else {
      setOpen(prev => !prev)
    }
  }, [isMobile])

  const contextValue: SidebarContextType = React.useMemo(() => ({
    state,
    open,
    setOpen,
    openMobile,
    setOpenMobile,
    isMobile,
    toggleSidebar,
  }), [state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar])

  return (
    <SidebarContext.Provider value={contextValue}>
      <div className={cn('relative', className)}>
        {children}
      </div>
    </SidebarContext.Provider>
  )
}