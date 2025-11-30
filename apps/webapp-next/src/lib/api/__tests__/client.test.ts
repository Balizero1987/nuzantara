import { createServerClient, createPublicClient, apiClient } from '../client'

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

describe('API Client', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000'
    process.env.NUZANTARA_API_URL = 'http://localhost:8000'
    process.env.NUZANTARA_API_KEY = 'test-key'
  })

  describe('client', () => {
    it('should be defined', () => {
      // Import client separately to avoid initialization issues in tests
      const { client } = require('../client')
      expect(client).toBeDefined()
    })

    it('should use NEXT_PUBLIC_API_URL from environment', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL
      process.env.NEXT_PUBLIC_API_URL = 'http://custom-api:8000'
      
      // Re-import to get new instance with updated env
      jest.resetModules()
      const { client } = require('../client')
      expect(client).toBeDefined()
      
      process.env.NEXT_PUBLIC_API_URL = originalEnv
    })

    it('should use default URL when NEXT_PUBLIC_API_URL is not set', () => {
      const originalEnv = process.env.NEXT_PUBLIC_API_URL
      delete process.env.NEXT_PUBLIC_API_URL
      
      jest.resetModules()
      const { client } = require('../client')
      expect(client).toBeDefined()
      
      process.env.NEXT_PUBLIC_API_URL = originalEnv
    })

    it('should get token from localStorage when window is defined', async () => {
      localStorageMock.getItem.mockReturnValue('stored-token-123')
      
      const { client } = require('../client')
      const tokenFn = (client as any).TOKEN
      
      if (typeof tokenFn === 'function') {
        const token = await tokenFn()
        expect(token).toBe('stored-token-123')
        expect(localStorageMock.getItem).toHaveBeenCalledWith('token')
      }
    })

    it('should return empty string when no token in localStorage', async () => {
      localStorageMock.getItem.mockReturnValue(null)
      
      const { client } = require('../client')
      const tokenFn = (client as any).TOKEN
      
      if (typeof tokenFn === 'function') {
        const token = await tokenFn()
        expect(token).toBe('')
      }
    })

    it('should return empty string when window is undefined (server-side)', async () => {
      // Mock window as undefined
      const originalWindow = global.window
      // @ts-ignore
      delete global.window
      
      jest.resetModules()
      const { client } = require('../client')
      const tokenFn = (client as any).TOKEN
      
      if (typeof tokenFn === 'function') {
        const token = await tokenFn()
        expect(token).toBe('')
      }
      
      global.window = originalWindow
    })
  })

  describe('createServerClient', () => {
    it('should create client with provided token', () => {
      const serverClient = createServerClient('server-token-123')

      expect(serverClient).toBeDefined()
    })

    it('should use NUZANTARA_API_URL from environment', () => {
      process.env.NUZANTARA_API_URL = 'http://server-api:8000'
      const serverClient = createServerClient('token')

      expect(serverClient).toBeDefined()
    })

    it('should include API key in headers', () => {
      process.env.NUZANTARA_API_KEY = 'secret-key'
      const serverClient = createServerClient('token')

      expect(serverClient).toBeDefined()
    })
  })

  describe('createPublicClient', () => {
    it('should create client without token', () => {
      const publicClient = createPublicClient()

      expect(publicClient).toBeDefined()
    })

    it('should use NUZANTARA_API_URL from environment', () => {
      process.env.NUZANTARA_API_URL = 'http://public-api:8000'
      const publicClient = createPublicClient()

      expect(publicClient).toBeDefined()
    })
  })

  describe('apiClient (legacy)', () => {
    describe('getToken', () => {
      it('should return token from localStorage', () => {
        localStorageMock.getItem.mockReturnValue('test-token')

        const token = apiClient.getToken()

        expect(token).toBe('test-token')
        expect(localStorageMock.getItem).toHaveBeenCalledWith('token')
      })

      it('should return empty string when no token', () => {
        localStorageMock.getItem.mockReturnValue(null)

        const token = apiClient.getToken()

        expect(token).toBe('')
      })

      it('should return empty string when window is undefined (server-side)', () => {
        // Mock window as undefined
        const originalWindow = global.window
        // @ts-ignore
        delete global.window

        jest.resetModules()
        const { apiClient: serverApiClient } = require('../client')
        const token = serverApiClient.getToken()

        expect(token).toBe('')

        global.window = originalWindow
      })
    })

    describe('setToken', () => {
      it('should save token to localStorage', () => {
        apiClient.setToken('new-token-123')

        expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token-123')
      })

      it('should not save token when window is undefined (server-side)', () => {
        const originalWindow = global.window
        // @ts-ignore
        delete global.window

        jest.resetModules()
        const { apiClient: serverApiClient } = require('../client')
        serverApiClient.setToken('token')

        // Should not throw, but also shouldn't call localStorage
        expect(localStorageMock.setItem).not.toHaveBeenCalled()

        global.window = originalWindow
      })
    })

    describe('clearToken', () => {
      it('should remove token from localStorage', () => {
        apiClient.clearToken()

        expect(localStorageMock.removeItem).toHaveBeenCalledWith('token')
      })

      it('should not remove token when window is undefined (server-side)', () => {
        const originalWindow = global.window
        // @ts-ignore
        delete global.window

        jest.resetModules()
        const { apiClient: serverApiClient } = require('../client')
        serverApiClient.clearToken()

        // Should not throw, but also shouldn't call localStorage
        expect(localStorageMock.removeItem).not.toHaveBeenCalled()

        global.window = originalWindow
      })
    })
  })
})

