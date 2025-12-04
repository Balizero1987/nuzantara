/**
 * @jest-environment jsdom
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { 
  useChatStore,
  selectMessageCount,
  selectLastMessage,
  selectUserMessages,
  selectAssistantMessages,
  selectHasCRMContext,
  selectActiveAlerts,
  selectConversationHistory,
} from '../chat-store'

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
})

describe('useChatStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatStore.getState().clearMessages()
  })

  describe('Initial state', () => {
    it('should have initial empty state', () => {
      const state = useChatStore.getState()

      expect(state.messages).toEqual([])
      expect(state.isStreaming).toBe(false)
      expect(state.streamingMessage).toBe('')
      expect(state.contextMetadata).toBeNull()
    })
  })

  describe('addMessage', () => {
    it('should add a message to the messages array', () => {
      const message = {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      }

      useChatStore.getState().addMessage(message)

      const state = useChatStore.getState()
      expect(state.messages).toHaveLength(1)
      expect(state.messages[0]).toEqual(message)
    })

    it('should add multiple messages', () => {
      const message1 = {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      }
      const message2 = {
        id: '2',
        role: 'assistant' as const,
        content: 'Hi there!',
        timestamp: new Date(),
      }

      useChatStore.getState().addMessage(message1)
      useChatStore.getState().addMessage(message2)

      const state = useChatStore.getState()
      expect(state.messages).toHaveLength(2)
      expect(state.messages[0]).toEqual(message1)
      expect(state.messages[1]).toEqual(message2)
    })

    it('should preserve existing messages when adding new ones', () => {
      const message1 = {
        id: '1',
        role: 'user' as const,
        content: 'First',
        timestamp: new Date(),
      }
      const message2 = {
        id: '2',
        role: 'assistant' as const,
        content: 'Second',
        timestamp: new Date(),
      }

      useChatStore.getState().addMessage(message1)

      let state = useChatStore.getState()
      expect(state.messages).toHaveLength(1)

      useChatStore.getState().addMessage(message2)

      state = useChatStore.getState()
      expect(state.messages).toHaveLength(2)
      expect(state.messages[0]).toEqual(message1)
      expect(state.messages[1]).toEqual(message2)
    })
  })

  describe('updateStreamingMessage', () => {
    it('should update streaming message content', () => {
      useChatStore.getState().updateStreamingMessage('Hello')

      let state = useChatStore.getState()
      expect(state.streamingMessage).toBe('Hello')

      useChatStore.getState().updateStreamingMessage('Hello World')

      state = useChatStore.getState()
      expect(state.streamingMessage).toBe('Hello World')
    })

    it('should replace previous streaming message', () => {
      useChatStore.getState().updateStreamingMessage('First')

      let state = useChatStore.getState()
      expect(state.streamingMessage).toBe('First')

      useChatStore.getState().updateStreamingMessage('Second')

      state = useChatStore.getState()
      expect(state.streamingMessage).toBe('Second')
    })
  })

  describe('setStreaming', () => {
    it('should set isStreaming to true', () => {
      useChatStore.getState().setStreaming(true)

      const state = useChatStore.getState()
      expect(state.isStreaming).toBe(true)
    })

    it('should set isStreaming to false', () => {
      useChatStore.getState().setStreaming(true)
      useChatStore.getState().setStreaming(false)

      const state = useChatStore.getState()
      expect(state.isStreaming).toBe(false)
    })

    it('should clear streaming message when setting streaming to false', () => {
      useChatStore.getState().updateStreamingMessage('Streaming content')
      useChatStore.getState().setStreaming(true)

      let state = useChatStore.getState()
      expect(state.streamingMessage).toBe('Streaming content')

      useChatStore.getState().setStreaming(false)

      state = useChatStore.getState()
      expect(state.streamingMessage).toBe('')
    })

    it('should preserve streaming message when setting streaming to true', () => {
      useChatStore.getState().updateStreamingMessage('Existing content')
      useChatStore.getState().setStreaming(true)

      const state = useChatStore.getState()
      expect(state.streamingMessage).toBe('Existing content')
    })
  })

  describe('setContextMetadata', () => {
    it('should set context metadata', () => {
      const metadata = {
        memory_used: true,
        rag_sources: [
          {
            source: 'test-source',
            relevance: 0.95,
            preview: 'Test preview',
          },
        ],
        intent: 'question',
      }

      useChatStore.getState().setContextMetadata(metadata)

      const state = useChatStore.getState()
      expect(state.contextMetadata).toEqual(metadata)
    })

    it('should update existing metadata', () => {
      const metadata1 = {
        memory_used: true,
        intent: 'question',
      }
      const metadata2 = {
        memory_used: false,
        intent: 'answer',
      }

      useChatStore.getState().setContextMetadata(metadata1)

      let state = useChatStore.getState()
      expect(state.contextMetadata).toEqual(metadata1)

      useChatStore.getState().setContextMetadata(metadata2)

      state = useChatStore.getState()
      expect(state.contextMetadata).toEqual(metadata2)
    })
  })

  describe('clearMessages', () => {
    it('should clear all messages and reset state', () => {
      const message = {
        id: '1',
        role: 'user' as const,
        content: 'Hello',
        timestamp: new Date(),
      }

      useChatStore.getState().addMessage(message)
      useChatStore.getState().updateStreamingMessage('Streaming')
      useChatStore.getState().setStreaming(true)
      useChatStore.getState().setContextMetadata({ memory_used: true })

      let state = useChatStore.getState()
      expect(state.messages).toHaveLength(1)
      expect(state.streamingMessage).toBe('Streaming')
      expect(state.isStreaming).toBe(true)
      expect(state.contextMetadata).not.toBeNull()

      useChatStore.getState().clearMessages()

      state = useChatStore.getState()
      expect(state.messages).toEqual([])
      expect(state.streamingMessage).toBe('')
      expect(state.contextMetadata).toBeNull()
      expect(state.pendingSync).toBe(true)
    })
  })

  describe('Session Management', () => {
    it('should set session', () => {
      const session = {
        sessionId: 'test-session',
        userEmail: 'test@example.com',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
      }

      useChatStore.getState().setSession(session)

      const state = useChatStore.getState()
      expect(state.session).toEqual(session)
      expect(state.isSessionInitialized).toBe(true)
    })

    it('should set session initialized', () => {
      useChatStore.getState().setSessionInitialized(true)

      let state = useChatStore.getState()
      expect(state.isSessionInitialized).toBe(true)

      useChatStore.getState().setSessionInitialized(false)

      state = useChatStore.getState()
      expect(state.isSessionInitialized).toBe(false)
    })

    it('should clear session completely', () => {
      const session = {
        sessionId: 'test-session',
        userEmail: 'test@example.com',
        startedAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
        messageCount: 0,
      }

      useChatStore.getState().setSession(session)
      useChatStore.getState().addMessage({
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      })
      useChatStore.getState().setCRMContext({
        clientId: 123,
        clientName: 'Test Client',
        status: 'active',
      })

      useChatStore.getState().clearSession()

      const state = useChatStore.getState()
      expect(state.session).toBeNull()
      expect(state.isSessionInitialized).toBe(false)
      expect(state.messages).toEqual([])
      expect(state.streamingMessage).toBe('')
      expect(state.contextMetadata).toBeNull()
      expect(state.crmContext).toBeNull()
      expect(state.zantaraContext).toBeNull()
    })
  })

  describe('CRM Context', () => {
    it('should set CRM context', () => {
      const crmContext = {
        clientId: 123,
        clientName: 'Test Client',
        status: 'active',
        practices: [
          { id: 1, type: 'visa', status: 'active' },
        ],
      }

      useChatStore.getState().setCRMContext(crmContext)

      const state = useChatStore.getState()
      expect(state.crmContext).toEqual(crmContext)
    })

    it('should set CRM context to null', () => {
      useChatStore.getState().setCRMContext({
        clientId: 123,
        clientName: 'Test',
        status: 'active',
      })

      useChatStore.getState().setCRMContext(null)

      const state = useChatStore.getState()
      expect(state.crmContext).toBeNull()
    })

    it('should set Zantara context and extract CRM context', () => {
      const zantaraContext = {
        session: {
          sessionId: 'test',
          userEmail: 'test@example.com',
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
        },
        crmContext: {
          clientId: 456,
          clientName: 'Zantara Client',
          status: 'active',
          practices: [
            { id: 1, type: 'visa', status: 'active' },
          ],
        },
      }

      useChatStore.getState().setZantaraContext(zantaraContext)

      const state = useChatStore.getState()
      expect(state.zantaraContext).toEqual(zantaraContext)
      expect(state.crmContext).toEqual({
        clientId: 456,
        clientName: 'Zantara Client',
        status: 'active',
        practices: [
          { id: 1, type: 'visa', status: 'active' },
        ],
      })
    })

    it('should preserve existing CRM context when Zantara context has no CRM', () => {
      const existingCRM = {
        clientId: 123,
        clientName: 'Existing Client',
        status: 'active',
      }

      useChatStore.getState().setCRMContext(existingCRM)

      const zantaraContext = {
        session: {
          sessionId: 'test',
          userEmail: 'test@example.com',
          startedAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          messageCount: 0,
        },
      }

      useChatStore.getState().setZantaraContext(zantaraContext)

      const state = useChatStore.getState()
      expect(state.crmContext).toEqual(existingCRM)
    })
  })

  describe('Sync Management', () => {
    it('should set syncing state', () => {
      useChatStore.getState().setSyncing(true)

      let state = useChatStore.getState()
      expect(state.isSyncing).toBe(true)

      useChatStore.getState().setSyncing(false)

      state = useChatStore.getState()
      expect(state.isSyncing).toBe(false)
    })

    it('should mark as synced', () => {
      useChatStore.getState().setPendingSync(true)
      useChatStore.getState().markSynced()

      const state = useChatStore.getState()
      expect(state.pendingSync).toBe(false)
      expect(state.lastSyncedAt).toBeDefined()
      expect(state.lastSyncedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/)
    })

    it('should set pending sync', () => {
      useChatStore.getState().setPendingSync(true)

      let state = useChatStore.getState()
      expect(state.pendingSync).toBe(true)

      useChatStore.getState().setPendingSync(false)

      state = useChatStore.getState()
      expect(state.pendingSync).toBe(false)
    })
  })

  describe('Bulk Operations', () => {
    it('should load messages', () => {
      const message1 = {
        id: '1',
        role: 'user' as const,
        content: 'First',
        timestamp: new Date(),
      }

      useChatStore.getState().addMessage(message1)

      const messagesToLoad = [
        {
          id: '2',
          role: 'assistant' as const,
          content: 'Second',
          timestamp: new Date(),
        },
        {
          id: '3',
          role: 'user' as const,
          content: 'Third',
          timestamp: new Date(),
        },
      ]

      useChatStore.getState().loadMessages(messagesToLoad)

      const state = useChatStore.getState()
      expect(state.messages).toHaveLength(3)
      expect(state.messages[0]).toEqual(message1)
      expect(state.messages[1]).toEqual(messagesToLoad[0])
      expect(state.messages[2]).toEqual(messagesToLoad[1])
    })

    it('should replace messages', () => {
      useChatStore.getState().addMessage({
        id: '1',
        role: 'user',
        content: 'Old',
        timestamp: new Date(),
      })

      const newMessages = [
        {
          id: '2',
          role: 'user' as const,
          content: 'New 1',
          timestamp: new Date(),
        },
        {
          id: '3',
          role: 'assistant' as const,
          content: 'New 2',
          timestamp: new Date(),
        },
      ]

      useChatStore.getState().replaceMessages(newMessages)

      const state = useChatStore.getState()
      expect(state.messages).toEqual(newMessages)
      expect(state.pendingSync).toBe(false)
    })
  })

  describe('Selectors', () => {
    beforeEach(() => {
      useChatStore.getState().clearMessages()
    })

    it('selectMessageCount should return correct count', () => {
      const state = useChatStore.getState()
      expect(selectMessageCount(state)).toBe(0)

      useChatStore.getState().addMessage({
        id: '1',
        role: 'user',
        content: 'Test',
        timestamp: new Date(),
      })

      const newState = useChatStore.getState()
      expect(selectMessageCount(newState)).toBe(1)
    })

    it('selectLastMessage should return last message', () => {
      const state = useChatStore.getState()
      expect(selectLastMessage(state)).toBeNull()

      const message1 = {
        id: '1',
        role: 'user' as const,
        content: 'First',
        timestamp: new Date(),
      }
      const message2 = {
        id: '2',
        role: 'assistant' as const,
        content: 'Second',
        timestamp: new Date(),
      }

      useChatStore.getState().addMessage(message1)
      useChatStore.getState().addMessage(message2)

      const newState = useChatStore.getState()
      expect(selectLastMessage(newState)).toEqual(message2)
    })

    it('selectUserMessages should filter user messages', () => {
      useChatStore.getState().addMessage({
        id: '1',
        role: 'user',
        content: 'User 1',
        timestamp: new Date(),
      })
      useChatStore.getState().addMessage({
        id: '2',
        role: 'assistant',
        content: 'Assistant 1',
        timestamp: new Date(),
      })
      useChatStore.getState().addMessage({
        id: '3',
        role: 'user',
        content: 'User 2',
        timestamp: new Date(),
      })

      const state = useChatStore.getState()
      const userMessages = selectUserMessages(state)

      expect(userMessages).toHaveLength(2)
      expect(userMessages[0].content).toBe('User 1')
      expect(userMessages[1].content).toBe('User 2')
    })

    it('selectAssistantMessages should filter assistant messages', () => {
      useChatStore.getState().addMessage({
        id: '1',
        role: 'user',
        content: 'User 1',
        timestamp: new Date(),
      })
      useChatStore.getState().addMessage({
        id: '2',
        role: 'assistant',
        content: 'Assistant 1',
        timestamp: new Date(),
      })
      useChatStore.getState().addMessage({
        id: '3',
        role: 'assistant',
        content: 'Assistant 2',
        timestamp: new Date(),
      })

      const state = useChatStore.getState()
      const assistantMessages = selectAssistantMessages(state)

      expect(assistantMessages).toHaveLength(2)
      expect(assistantMessages[0].content).toBe('Assistant 1')
      expect(assistantMessages[1].content).toBe('Assistant 2')
    })

    it('selectHasCRMContext should return true when CRM context exists', () => {
      // Clear any existing CRM context first
      useChatStore.getState().setCRMContext(null)
      
      const state = useChatStore.getState()
      expect(selectHasCRMContext(state)).toBe(false)

      useChatStore.getState().setCRMContext({
        clientId: 123,
        clientName: 'Test',
        status: 'active',
      })

      const newState = useChatStore.getState()
      expect(selectHasCRMContext(newState)).toBe(true)
    })

    it('selectActiveAlerts should filter high and critical alerts', () => {
      const state = useChatStore.getState()
      expect(selectActiveAlerts(state)).toEqual([])

      useChatStore.getState().setCRMContext({
        clientId: 123,
        clientName: 'Test',
        status: 'active',
        complianceAlerts: [
          { type: 'tax', severity: 'high', dueDate: '2024-12-31' },
          { type: 'visa', severity: 'medium', dueDate: '2024-12-15' },
          { type: 'legal', severity: 'critical', dueDate: '2024-12-10' },
          { type: 'company', severity: 'low', dueDate: '2024-12-20' },
        ],
      })

      const newState = useChatStore.getState()
      const alerts = selectActiveAlerts(newState)

      expect(alerts).toHaveLength(2)
      expect(alerts[0].severity).toBe('high')
      expect(alerts[1].severity).toBe('critical')
    })

    it('selectConversationHistory should map messages correctly', () => {
      useChatStore.getState().addMessage({
        id: '1',
        role: 'user',
        content: 'Hello',
        timestamp: new Date(),
        metadata: { intent: 'test' },
      })
      useChatStore.getState().addMessage({
        id: '2',
        role: 'assistant',
        content: 'Hi!',
        timestamp: new Date(),
      })

      const state = useChatStore.getState()
      const history = selectConversationHistory(state)

      expect(history).toEqual([
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi!' },
      ])
    })
  })
})
