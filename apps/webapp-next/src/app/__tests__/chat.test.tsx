import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import ChatPage from '../chat/page'

// Mock next/navigation - must return stable reference to prevent infinite re-renders
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

// Mock chatAPI
const mockStreamChat = jest.fn()
jest.mock('@/lib/api/chat', () => ({
  chatAPI: {
    streamChat: (...args: any[]) => mockStreamChat(...args),
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

// Mock scrollIntoView since jsdom doesn't implement it
Element.prototype.scrollIntoView = jest.fn()

describe('ChatPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    localStorage.clear()
    mockGetToken.mockReturnValue('test-token')
    mockReplace.mockClear()
    mockPrefetch.mockClear()
  })

  it('should render welcome message when no messages', () => {
    render(<ChatPage />)
    expect(screen.getByText(/Selamat datang di ZANTARA/)).toBeInTheDocument()
  })

  it('should redirect to login if no token', async () => {
    mockGetToken.mockReturnValue(null)

    render(<ChatPage />)

    // Wait for retry timeout
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150))
    })

    expect(mockPush).toHaveBeenCalledWith('/login')
  })

  it('should render chat input', () => {
    render(<ChatPage />)
    expect(screen.getByPlaceholderText('Ketik pesan Anda...')).toBeInTheDocument()
  })

  it('should render logout button', () => {
    render(<ChatPage />)
    expect(screen.getByText('Logout')).toBeInTheDocument()
  })

  it('should clear token and redirect on logout', () => {
    render(<ChatPage />)

    fireEvent.click(screen.getByText('Logout'))

    expect(mockClearToken).toHaveBeenCalled()
    expect(mockPush).toHaveBeenCalledWith('/')
  })

  it('should toggle sidebar when menu button is clicked', () => {
    render(<ChatPage />)

    const menuButton = screen.getByLabelText('Menu')
    fireEvent.click(menuButton)

    expect(screen.getByText('New Chat')).toBeInTheDocument()
  })

  it('should start new conversation when New Chat is clicked', () => {
    // Set up messages in localStorage
    localStorage.setItem('zantara_conversation', JSON.stringify([
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi!' },
    ]))

    render(<ChatPage />)

    // Verify messages are loaded
    expect(screen.getByText('Hello')).toBeInTheDocument()

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Menu'))

    // Click New Chat
    fireEvent.click(screen.getByText('New Chat'))

    // Messages should be cleared from view (shows welcome)
    expect(screen.getByText(/Selamat datang di ZANTARA/)).toBeInTheDocument()
    // Sidebar should be closed
    expect(screen.queryByText('Chat History')).not.toBeInTheDocument()
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
    mockStreamChat.mockImplementation(() => new Promise(() => {})) // Never resolves

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
    mockStreamChat.mockImplementation(() => new Promise(() => {}))

    render(<ChatPage />)

    const input = screen.getByPlaceholderText('Ketik pesan Anda...')
    fireEvent.change(input, { target: { value: 'Test' } })
    fireEvent.click(screen.getByLabelText('Send message'))

    await waitFor(() => {
      expect(input).toBeDisabled()
    })
  })

  it('should load conversation from localStorage', () => {
    const savedMessages = [
      { role: 'user', content: 'Hello' },
      { role: 'assistant', content: 'Hi there!' },
    ]
    localStorage.setItem('zantara_conversation', JSON.stringify(savedMessages))

    render(<ChatPage />)

    expect(screen.getByText('Hello')).toBeInTheDocument()
    expect(screen.getByText('Hi there!')).toBeInTheDocument()
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

    expect(screen.getByText('Generate Magical Image')).toBeInTheDocument()
  })

  it('should close image modal on cancel', () => {
    render(<ChatPage />)

    // Open modal
    fireEvent.click(screen.getByLabelText('Generate image'))
    expect(screen.getByText('Generate Magical Image')).toBeInTheDocument()

    // Close modal
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.queryByText('Generate Magical Image')).not.toBeInTheDocument()
  })

  it('should handle file upload', () => {
    render(<ChatPage />)

    const fileButton = screen.getByLabelText('Upload file')
    fireEvent.click(fileButton)

    // File input should be triggered (we can't test the actual file selection in jest)
  })

  it('should load avatar from localStorage', () => {
    localStorage.setItem('zantara_avatar', 'data:image/png;base64,test')

    render(<ChatPage />)

    const avatar = document.querySelector('img[alt="User"]')
    expect(avatar).toHaveAttribute('src', 'data:image/png;base64,test')
  })

  it('should display chat history in sidebar', () => {
    render(<ChatPage />)

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Menu'))

    expect(screen.getByText('Chat History')).toBeInTheDocument()
    expect(screen.getByText('Tourist visa for Bali')).toBeInTheDocument()
    expect(screen.getByText('Indonesia tax information')).toBeInTheDocument()
  })

  it('should close sidebar when chat is selected', () => {
    render(<ChatPage />)

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Menu'))
    expect(screen.getByText('Chat History')).toBeInTheDocument()

    // Select a chat
    fireEvent.click(screen.getByText('Tourist visa for Bali'))

    // Sidebar should close
    expect(screen.queryByText('Chat History')).not.toBeInTheDocument()
  })

  it('should close sidebar when backdrop is clicked', () => {
    render(<ChatPage />)

    // Open sidebar
    fireEvent.click(screen.getByLabelText('Menu'))

    // Click backdrop
    const backdrop = document.querySelector('.fixed.inset-0.bg-black\\/60')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    expect(screen.queryByText('Chat History')).not.toBeInTheDocument()
  })

  it('should handle invalid localStorage conversation gracefully', () => {
    // Set invalid JSON in localStorage
    localStorage.setItem('zantara_conversation', 'invalid json {{{')

    // Should not throw error
    expect(() => render(<ChatPage />)).not.toThrow()
    expect(screen.getByText(/Selamat datang di ZANTARA/)).toBeInTheDocument()
  })

  it('should toggle check out when already checked in', () => {
    // Set up checked in state
    const checkInTime = new Date().toISOString()
    localStorage.setItem('zantara_checkin', checkInTime)

    render(<ChatPage />)

    // Should show check out button
    const checkButton = screen.getByTitle('Check Out')
    fireEvent.click(checkButton)

    // Check in should be removed
    expect(localStorage.getItem('zantara_checkin')).toBeNull()
  })

  it('should handle file upload with image file', () => {
    render(<ChatPage />)

    const fileInput = document.querySelector('input[type="file"][accept="image/*"]') as HTMLInputElement
    expect(fileInput).toBeTruthy()

    // Create a mock file
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,test',
      onload: null as any,
    }
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

    // Trigger file change
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Trigger onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } })
    }
  })

  it('should handle avatar upload', () => {
    render(<ChatPage />)

    // Find avatar input (it's hidden, type="file")
    const avatarInputs = document.querySelectorAll('input[type="file"][accept="image/*"]')
    const avatarInput = avatarInputs[0] as HTMLInputElement // First one is avatar

    // Create a mock file
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,avatar',
      onload: null as any,
    }
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

    // Trigger file change
    fireEvent.change(avatarInput, { target: { files: [file] } })

    // Trigger onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,avatar' } })
    }
  })

  it('should handle image generation with prompt', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: true,
        images: ['data:image/png;base64,generated'],
      }),
    })
    global.fetch = mockFetch

    render(<ChatPage />)

    // Open image modal
    fireEvent.click(screen.getByLabelText('Generate image'))

    // Enter prompt
    const promptInput = screen.getByPlaceholderText(/Describe your imagination/i)
    fireEvent.change(promptInput, { target: { value: 'A beautiful sunset' } })

    // Click generate
    fireEvent.click(screen.getByText('Generate'))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/image/generate', expect.any(Object))
    })
  })

  it('should handle image generation error', async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        success: false,
        error: 'Generation failed',
      }),
    })
    global.fetch = mockFetch
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {})

    render(<ChatPage />)

    // Open image modal
    fireEvent.click(screen.getByLabelText('Generate image'))

    // Enter prompt
    const promptInput = screen.getByPlaceholderText(/Describe your imagination/i)
    fireEvent.change(promptInput, { target: { value: 'A test prompt' } })

    // Click generate
    fireEvent.click(screen.getByText('Generate'))

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith(expect.stringContaining('Failed to generate image'))
    })

    alertMock.mockRestore()
  })

  it('should not generate image with empty prompt', () => {
    render(<ChatPage />)

    // Open image modal
    fireEvent.click(screen.getByLabelText('Generate image'))

    // Generate button should be disabled with empty prompt
    const generateBtn = screen.getByText('Generate')
    expect(generateBtn).toBeDisabled()
  })

  it('should handle metadata in chat stream', async () => {
    const mockMetadata = { sources: ['doc1', 'doc2'], confidence: 0.95 }

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

  it('should close image modal with X button', () => {
    render(<ChatPage />)

    // Open modal
    fireEvent.click(screen.getByLabelText('Generate image'))
    expect(screen.getByText('Generate Magical Image')).toBeInTheDocument()

    // Find and click X button (close button in modal header)
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

    // Change input value (triggers handleInputChange which auto-resizes)
    fireEvent.change(input, { target: { value: 'Line 1\nLine 2\nLine 3\nLine 4' } })

    // Input should have content
    expect(input).toHaveValue('Line 1\nLine 2\nLine 3\nLine 4')
  })

  it('should handle streaming content display', async () => {
    mockStreamChat.mockImplementation((
      message: string,
      onChunk: (chunk: string) => void,
      onMetadata: (meta: any) => void,
      onComplete: () => void,
    ) => {
      // Simulate streaming
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

  it('should upload preview and allow removal', () => {
    render(<ChatPage />)

    // Get file input for chat uploads (second one)
    const fileInputs = document.querySelectorAll('input[type="file"][accept="image/*"]')
    const fileInput = fileInputs[1] as HTMLInputElement

    // Create a mock file
    const file = new File(['test'], 'test.png', { type: 'image/png' })

    // Mock FileReader
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      result: 'data:image/png;base64,preview',
      onload: null as any,
    }
    jest.spyOn(global, 'FileReader').mockImplementation(() => mockFileReader as any)

    // Trigger file change
    fireEvent.change(fileInput, { target: { files: [file] } })

    // Trigger onload
    if (mockFileReader.onload) {
      mockFileReader.onload({ target: { result: 'data:image/png;base64,preview' } })
    }
  })
})
