/**
 * @jest-environment jsdom
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals'
import { useChatStore } from '../chat-store'

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
    })
  })
})
