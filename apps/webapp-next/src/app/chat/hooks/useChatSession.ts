// src/app/chat/hooks/useChatSession.ts
"use client"

import { useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api/client"
import { zantaraAPI } from "@/lib/api/zantara-integration"
import { useChatStore } from "@/lib/store/chat-store"
import { AUTH_TOKEN_KEY } from "@/lib/constants"

export function useChatSession() {
  const router = useRouter()
  const [isInitialized, setIsInitialized] = useState(false)

  const {
    setSession,
    replaceMessages,
    setCRMContext,
    setSessionInitialized,
  } = useChatStore()

  const initializeSession = useCallback(async () => {
    if (isInitialized) return

    try {
      console.log('[ChatPage] Initializing ZANTARA session...')

      const newSession = await zantaraAPI.initSession()
      setSession(newSession)

      const backendHistory = await zantaraAPI.loadConversationHistory(50)
      if (backendHistory.length > 0) {
        console.log('[ChatPage] Loaded', backendHistory.length, 'messages from backend')
        const formattedMessages = backendHistory.map((m: any, idx: number) => ({
          id: `msg_${idx}_${Date.now()}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(),
        }))
        replaceMessages(formattedMessages)
      }

      if (newSession.crmClientId) {
        const crmCtx = await zantaraAPI.getCRMContext(newSession.userEmail)
        if (crmCtx) {
          setCRMContext({
            clientId: crmCtx.clientId,
            clientName: crmCtx.clientName,
            status: crmCtx.status,
            practices: crmCtx.practices,
          })
        }
      }

      setSessionInitialized(true)
      setIsInitialized(true)
      console.log('[ChatPage] ZANTARA session initialized:', {
        sessionId: newSession.sessionId,
        hasCRM: !!newSession.crmClientId,
      })
    } catch (error) {
      console.error('[ChatPage] Failed to initialize session:', error)
      setIsInitialized(true)
    }
  }, [isInitialized, setSession, replaceMessages, setCRMContext, setSessionInitialized])

  const checkAndMigrateToken = useCallback(() => {
    let token = apiClient.getToken()

    if (!token && typeof globalThis !== 'undefined' && 'localStorage' in globalThis) {
      const oldKeys = ['token', 'zantara_token', 'zantara_session_token']
      for (const oldKey of oldKeys) {
        const oldToken = globalThis.localStorage.getItem(oldKey)
        if (oldToken) {
          console.log(`[ChatPage] Migrating token from ${oldKey} to ${AUTH_TOKEN_KEY}`)
          globalThis.localStorage.setItem(AUTH_TOKEN_KEY, oldToken)
          globalThis.localStorage.removeItem(oldKey)
          token = oldToken
          break
        }
      }
    }

    return token
  }, [])

  useEffect(() => {
    const token = checkAndMigrateToken()

    if (!token) {
      const timeoutId = setTimeout(() => {
        const retryToken = checkAndMigrateToken()
        if (!retryToken) {
          console.log('[ChatPage] No token found after retry, redirecting to login')
          router.push("/login")
          return
        }
        initializeSession()
      }, 100)
      return () => clearTimeout(timeoutId)
    }

    initializeSession()
  }, [checkAndMigrateToken, initializeSession, router])

  return { isInitialized }
}
