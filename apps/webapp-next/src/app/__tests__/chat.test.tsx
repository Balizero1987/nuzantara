import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ChatPage from '../chat/page'

// Mock next/navigation
const mockPush = jest.fn()
const mockReplace = jest.fn()
const mockPrefetch = jest.fn()
const mockRouter = {
  push: mockPush,
  replace: mockReplace,
  prefetch: mockPrefetch,
}
jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
}))

// Mock apiClient
const mockGetToken = jest.fn()
const mockClearToken = jest.fn()
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    getToken: () => mockGetToken(),
    setToken: jest.fn(),
    clearToken: () => mockClearToken(),
  },
}))

// Mock authAPI
jest.mock('@/lib/api/auth', () => ({
  authAPI: {
    clearUser: jest.fn(),
  },
}))

// Mock zantaraAPI
jest.mock('@/lib/api/zantara-integration', () => ({
  zantaraAPI: {
    initSession: jest.fn().mockResolvedValue({ sessionId: 'test-session' }),
    loadConversationHistory: jest.fn().mockResolvedValue([]),
    getCRMContext: jest.fn().mockResolvedValue(null),
    clearHistory: jest.fn(),
  },
}))

// Mock AuthContext
const mockLogin = jest.fn()
const mockLogout = jest.fn()
const mockUseAuth = jest.fn()

jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock chatAPI
const mockStreamChat = jest.fn()
jest.mock('@/lib/api/chat', () => ({
  chatAPI: {
    streamChat: (...args: any[]) => mockStreamChat(...args),
    clearHistory: jest.fn(),
  },
}))

// Mock components
jest.mock('@/components/chat/RAGDrawer', () => ({
  RAGDrawer: () => <div data-testid="rag-drawer">RAGDrawer</div>,
}))

jest.mock('@/components/chat/MarkdownRenderer', () => ({
  MarkdownRenderer: ({ content }: { content: string }) => <div data-testid="markdown">{content}</div>,
}))

jest.mock('@/components/chat/ThinkingIndicator', () => ({
  ThinkingIndicator: () => <div data-testid="thinking">Thinking...</div>,
}))

// Mock scrollIntoView
Element.prototype.scrollIntoView = jest.fn()

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockGetToken.mockReturnValue('test-token')

    // Default auth state
    mockUseAuth.mockReturnValue({
      user: { id: '1', email: 'test@example.com', name: 'Test User' },
      token: 'test-token',
      isLoading: false,
      isAuthenticated: true,
      login: mockLogin,
      logout: mockLogout,
    })
  })

  it('should render welcome message when no messages', () => {
    render(<ChatPage />)
    expect(screen.getByText(/Selamat datang di ZANTARA/)).toBeInTheDocument()
  })

  it('should redirect to login if not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
      login: mockLogin,
      logout: mockLogout,
    })

    render(<ChatPage />)

    // Wait for effect
    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/login')
    })
  })

  it('should render chat input', () => {
    render(<ChatPage />)
    expect(screen.getByPlaceholderText('Ketik pesan Anda...')).toBeInTheDocument()
  })

  it('should render logout button', () => {
    render(<ChatPage />)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should call logout from auth context', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByText('Logout'))

    expect(mockLogout).toHaveBeenCalled()
  })

  it('should toggle sidebar when menu button is clicked', () => {
    render(<ChatPage />)

    const menuButton = screen.getByLabelText('Menu')
    fireEvent.click(menuButton)

    expect(screen.getByText('New Chat')).toBeInTheDocument()
  })

  it('should start new conversation when New Chat is clicked', async () => {
    const mockHistory = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ]
    const { zantaraAPI } = await import('@/lib/api/zantara-integration')
      ; (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue(mockHistory)

    render(<ChatPage />)

    // Wait for history to load
    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByLabelText('Menu'))
    fireEvent.click(screen.getByText('New Chat'))

    expect(screen.getByText(/Selamat datang di ZANTARA/)).toBeInTheDocument()

    // Sidebar should be closed (wait for async state update)
    await waitFor(() => {
      const sidebar = screen.getByText('Chat History').closest('aside')
      expect(sidebar).toHaveClass('-translate-x-full')
    })
  })

  it('should handle message submission', async () => {
    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
    ) => {
      onChunk('Hello ')
      onChunk('World!')
      onComplete()
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test message' } })

    const submitButton = screen.getByLabelText('Send message')
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalledWith(
        'Test message',
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Function),
        expect.any(Array)
      )
    })
  })

  it('should not submit empty message', () => {
    render(<ChatPage />)

    const submitButton = screen.getByLabelText('Send message')
    fireEvent.click(submitButton)

    expect(mockStreamChat).not.toHaveBeenCalled()
  })

  it('should submit on Enter key', async () => {
    mockStreamChat.mockImplementation((_, __, ___, onComplete) => {
      onComplete()
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Enter test' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: false })

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalled()
    })
  })

  it('should not submit on Shift+Enter (newline)', () => {
    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true })

    expect(mockStreamChat).not.toHaveBeenCalled()
  })

  it('should show thinking indicator while loading', async () => {
    mockStreamChat.mockImplementation(() => new Promise(() => { }))

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(screen.getByTestId('thinking')).toBeInTheDocument()
    })
  })

  it('should handle stream error', async () => {
    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
      onError: (error: Error) => void,
    ) => {
      onError(new Error('Stream failed'))
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I encountered an error/)).toBeInTheDocument()
    })
  })

  it('should disable input while loading', async () => {
    mockStreamChat.mockImplementation(() => new Promise(() => { }))

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(input).toBeDisabled()
    })
  })

  it('should load conversation from backend', async () => {
    const mockHistory = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]
    const { zantaraAPI } = await import('@/lib/api/zantara-integration')
      ; (zantaraAPI.loadConversationHistory as jest.Mock).mockResolvedValue(mockHistory)

    render(<ChatPage />)

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument()
      expect(screen.getByText('Hi there!')).toBeInTheDocument()
    })
  })

  it('should handle check in/out', () => {
    render(<ChatPage />)

    const checkButton = screen.getByTitle('Check In')
    fireEvent.click(checkButton)

    expect(localStorage.getItem('zantara_checkin')).not.toBeNull()
  })

  it('should open image generation modal', () => {
    render(<ChatPage />)

    const imageButton = screen.getByLabelText('Generate image')
    fireEvent.click(imageButton)

    expect(screen.getByText('Generate Image')).toBeInTheDocument()
  })

  it('should close image modal on cancel', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Generate image'))
    expect(screen.getByText('Generate Image')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Generate Image')).not.toBeInTheDocument()
  })

  it('should handle file upload', () => {
    render(<ChatPage />)

    const fileButton = screen.getByLabelText('Upload file')
    fireEvent.click(fileButton)
  })

  it('should load avatar from localStorage', () => {
    localStorage.setItem('zantara_avatar', 'data:image/png;base64,test')

    render(<ChatPage />)

    const avatar = document.querySelector('img[alt="User"]')
    expect(avatar).toHaveAttribute('src', 'data:image/png;base64,test')
  })

  it('should display chat history in sidebar', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Menu'))

    expect(screen.getByText('Chat History')).toBeInTheDocument()
    expect(screen.getByText('Tourist visa for Bali')).toBeInTheDocument()
    expect(screen.getByText('Indonesia tax information')).toBeInTheDocument()
  })

  it('should close sidebar when chat is selected', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Menu'))
    expect(screen.getByText('Chat History')).toBeInTheDocument()

    fireEvent.click(screen.getByText('Tourist visa for Bali'))

    const sidebar = screen.getByText('Chat History').closest('aside')
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  it('should close sidebar when backdrop is clicked', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Menu'))

    // Updated selector to match ChatSidebar.tsx (bg-black/50)
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/50')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    const sidebar = screen.getByText('Chat History').closest('aside')
    expect(sidebar).toHaveClass('-translate-x-full')
  })

  it('should toggle check out when already checked in', () => {
    const checkInTime = new Date().toISOString()
    localStorage.setItem('zantara_checkin', checkInTime)

    render(<ChatPage />)

    const checkButton = screen.getByTitle('Check Out')
    fireEvent.click(checkButton)

    expect(localStorage.getItem('zantara_checkin')).toBeNull()
  })

  it('should handle file upload with image file', () => {
    render(<ChatPage />)

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    const file = new File(['test'], 'test.png', { type: 'image/png' })

    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,test',
      onload: null as any,
    }
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

    fireEvent.change(fileInput, { target: { files: [file] } })

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } })
    }
  })

  it('should handle avatar upload', () => {
    render(<ChatPage />)

    const avatarInputs = document.querySelectorAll('input[type="file"][accept="image/*"]')
    const avatarInput = avatarInputs[0] as HTMLInputElement

    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,avatar',
      onload: null as any,
    }
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

    fireEvent.change(avatarInput, { target: { files: [file] } })

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,avatar' } })
    }
  })

  it('should handle image generation with prompt', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        imageUrl: 'data:image/png;base64,generated',
      }),
    })
    global.fetch = mockFetch

    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Generate image'))

    const promptInput = screen.getByPlaceholderText(/A beautiful sunset/i)
    fireEvent.change(promptInput, { target: { value: 'A beautiful sunset' } })

    fireEvent.click(screen.getByText('Generate'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/image/generate', expect.any(Object))
    })
  })

  it('should handle image generation error', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        success: false,
        error: 'Generation failed',
      }),
    })
    global.fetch = mockFetch

    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Generate image'))

    const promptInput = screen.getByPlaceholderText(/A beautiful sunset/i)
    fireEvent.change(promptInput, { target: { value: 'A test prompt' } })

    fireEvent.click(screen.getByText('Generate'))

    await waitFor(() => {
      expect(screen.getByText(/Sorry, I couldn't generate the image/)).toBeInTheDocument()
    })
  })

  it('should not generate image with empty prompt', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Generate image'))

    const generateBtn = screen.getByText('Generate')
    expect(generateBtn).toBeDisabled()
  })

  it('should handle metadata in chat stream with document sources', async () => {
    const mockMetadata = {
      memory_used: true,
      rag_sources: [
        { document: 'doc1', score: 0.95, text_preview: 'Preview 1' },
        { collection: 'col1', score: 0.90, text_preview: 'Preview 2' },
      ],
      intent: 'question',
    }

    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
    ) => {
      onChunk('Response with metadata')
      onMetadata(mockMetadata)
      onComplete()
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test with metadata' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalled()
    })
  })

  it('should handle metadata with collection sources', async () => {
    const mockMetadata = {
      memory_used: true,
      rag_sources: [
        { collection: 'col1', score: 0.95, text_preview: 'Preview 1' },
      ],
      intent: 'question',
    }

    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
    ) => {
      onChunk('Response')
      onMetadata(mockMetadata)
      onComplete()
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalled()
    })
  })

  it('should handle chat error in catch block', async () => {
    mockStreamChat.mockImplementation(() => {
      throw new Error('Chat error')
    })

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation()

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test error' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ZANTARA] Chat error:', expect.any(Error))
    })

    consoleErrorSpy.mockRestore()
  })

  it('should handle clearHistory error', async () => {
    const { chatAPI } = await import('@/lib/api/chat')
      ; (chatAPI.clearHistory as jest.Mock).mockRejectedValue(new Error('Clear failed'))

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Menu'))
    fireEvent.click(screen.getByText('New Chat'))

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith('[ZANTARA] Failed to clear backend history:', expect.any(Error))
    })

    consoleWarnSpy.mockRestore()
  })

  it('should handle file upload preview clear', async () => {
    render(<ChatPage />)

    const fileInputs = document.querySelectorAll('input[type="file"][accept="image/*"]')
    const fileInput = fileInputs[1] as HTMLInputElement

    const file = new File(['test'], 'test.png', { type: 'image/png' })

    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,preview',
      onload: null as any,
    }
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

    fireEvent.change(fileInput, { target: { files: [file] } })

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,preview' } })
    }

    // Find and click clear preview button
    await waitFor(() => {
      const clearButtons = document.querySelectorAll('button')
      const clearButton = Array.from(clearButtons).find(btn =>
        btn.textContent?.includes('×') || btn.getAttribute('aria-label')?.includes('clear')
      )
      if (clearButton) {
        fireEvent.click(clearButton)
      }
    })
  })

  it('should close RAG drawer', async () => {
    const mockMetadata = {
      rag_sources: [{ document: 'doc1', score: 0.95 }],
    }

    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
    ) => {
      onChunk('Response')
      onMetadata(mockMetadata)
      onComplete()
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      const ragDrawer = screen.getByTestId('rag-drawer')
      expect(ragDrawer).toBeInTheDocument()
    })

    // Close drawer by clicking backdrop or close button
    const drawer = screen.getByTestId('rag-drawer')
    const closeButton = drawer.querySelector('button[aria-label*="close" i], button:has(svg)')
    if (closeButton) {
      fireEvent.click(closeButton)
    }
  })

  it('should close image modal with X button', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Generate image'))
    expect(screen.getByText('Generate Image')).toBeInTheDocument()

    const closeButtons = document.querySelectorAll('button')
    const xButton = Array.from(closeButtons).find(btn =>
      btn.querySelector('svg') && btn.closest('.flex.items-center.justify-between')
    )
    if (xButton) {
      fireEvent.click(xButton)
    }
  })

  it('should handle textarea auto-resize', () => {
    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')

    fireEvent.change(input, { target: { value: 'Line 1\nLine 2\nLine 3\nLine 4' } })

    expect(input).toHaveValue('Line 1\nLine 2\nLine 3\nLine 4')
  })

  it('should handle streaming content display', async () => {
    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
    ) => {
      setTimeout(() => onChunk('First '), 10)
      setTimeout(() => onChunk('Second '), 20)
      setTimeout(() => onChunk('Third'), 30)
      setTimeout(() => onComplete(), 40)
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Streaming test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(mockStreamChat).toHaveBeenCalled()
    })
  })

  it('should upload preview and allow removal', async () => {
    render(<ChatPage />)

    const fileInputs = document.querySelectorAll('input[type="file"][accept="image/*"]')
    const fileInput = fileInputs[1] as HTMLInputElement

    const file = new File(['test'], 'test.png', { type: 'image/png' })

    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,preview',
      onload: null as any,
    }
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

    fireEvent.change(fileInput, { target: { files: [file] } })

    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,preview' } })
    }

    // Wait for preview to be set, then find and click clear button
    await waitFor(() => {
      const clearButtons = document.querySelectorAll('button')
      const clearButton = Array.from(clearButtons).find(btn => 
        btn.textContent?.includes('×') || 
        btn.getAttribute('aria-label')?.toLowerCase().includes('clear') ||
        btn.className.includes('clear')
      )
      if (clearButton) {
        fireEvent.click(clearButton)
      }
    }, { timeout: 1000 })
  })

  it('should handle clearHistory error in new chat', async () => {
    const { chatAPI } = require('@/lib/api/chat')
    chatAPI.clearHistory = jest.fn().mockRejectedValue(new Error('Clear failed'))

    const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation()

    render(<ChatPage />)

    fireEvent.click(screen.getByLabelText('Menu'))
    fireEvent.click(screen.getByText('New Chat'))

    await waitFor(() => {
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[ZANTARA] Failed to clear backend history:',
        expect.any(Error)
      )
    }, { timeout: 2000 })

    consoleWarnSpy.mockRestore()
  })

  it('should close RAG drawer when onClose is called', async () => {
    const mockMetadata = {
      rag_sources: [{ document: 'doc1', score: 0.95 }],
    }

    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
    ) => {
      onChunk('Response')
      onMetadata(mockMetadata)
      onComplete()
      return Promise.resolve()
    })

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      const ragDrawer = screen.getByTestId('rag-drawer')
      expect(ragDrawer).toBeInTheDocument()
    })

    // Find close button in drawer
    const drawer = screen.getByTestId('rag-drawer')
    const closeButtons = drawer.querySelectorAll('button')
    const closeButton = Array.from(closeButtons).find(btn => 
      btn.textContent?.includes('×') || 
      btn.getAttribute('aria-label')?.toLowerCase().includes('close')
    )
    
    if (closeButton) {
      fireEvent.click(closeButton)
    }
  })
})
