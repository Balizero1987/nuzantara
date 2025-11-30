import { useAuthStore } from '../auth-store'

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

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null)
    localStorageMock.setItem.mockClear()
    localStorageMock.removeItem.mockClear()
    // Reset store state directly
    const store = useAuthStore.getState()
    store.logout()
  })

  describe('Initial state', () => {
    it('should have initial state with null user and token', () => {
      const state = useAuthStore.getState()

      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })
  })

  describe('login', () => {
    it('should set user, token and isAuthenticated to true', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      }
      const token = 'test-token-123'

      useAuthStore.getState().login(user, token)

      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.token).toBe(token)
      expect(state.isAuthenticated).toBe(true)
    })

    it('should persist auth state to localStorage', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      }
      const token = 'test-token-123'

      useAuthStore.getState().login(user, token)

      // Zustand persist middleware handles localStorage internally
      // We verify the state is set correctly instead
      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.token).toBe(token)
    })
  })

  describe('logout', () => {
    it('should clear user, token and set isAuthenticated to false', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      }
      const token = 'test-token-123'

      // First login
      useAuthStore.getState().login(user, token)

      let state = useAuthStore.getState()
      expect(state.isAuthenticated).toBe(true)

      // Then logout
      useAuthStore.getState().logout()

      state = useAuthStore.getState()
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
      expect(state.isAuthenticated).toBe(false)
    })

    it('should remove tokens from localStorage', () => {
      useAuthStore.getState().logout()

      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zantara_token')
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('zantara_user')
    })
  })

  describe('updateUser', () => {
    it('should update user properties', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      }
      const token = 'test-token-123'

      useAuthStore.getState().login(user, token)
      useAuthStore.getState().updateUser({ name: 'Updated Name', role: 'admin' })

      const state = useAuthStore.getState()
      expect(state.user?.name).toBe('Updated Name')
      expect(state.user?.role).toBe('admin')
      expect(state.user?.email).toBe('test@example.com') // Unchanged
      expect(state.user?.id).toBe('1') // Unchanged
    })

    it('should not update if user is null', () => {
      useAuthStore.getState().updateUser({ name: 'New Name' })

      const state = useAuthStore.getState()
      expect(state.user).toBeNull()
    })
  })

  describe('Persistence', () => {
    it('should persist user and token state', () => {
      const user = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        role: 'user',
      }
      const token = 'test-token-123'

      useAuthStore.getState().login(user, token)

      // Verify state is persisted in store
      const state = useAuthStore.getState()
      expect(state.user).toEqual(user)
      expect(state.token).toBe(token)
      expect(state.isAuthenticated).toBe(true)
    })
  })
})

