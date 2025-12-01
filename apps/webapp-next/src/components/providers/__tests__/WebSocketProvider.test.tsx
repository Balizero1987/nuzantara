import React from 'react'
import { render, screen } from '@testing-library/react'
import { WebSocketProvider } from '../WebSocketProvider'

// Mock dependencies
const mockConnect = jest.fn()
const mockDisconnect = jest.fn()

jest.mock('@/lib/api/socket', () => ({
  socketClient: {
    connect: () => mockConnect(),
    disconnect: () => mockDisconnect(),
  },
}))

const mockGetUser = jest.fn()

jest.mock('@/lib/api/auth', () => ({
  authAPI: {
    getUser: () => mockGetUser(),
  },
}))

describe('WebSocketProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render children', () => {
    mockGetUser.mockReturnValue(null)

    render(
      <WebSocketProvider>
        <div data-testid="child">Child content</div>
      </WebSocketProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  it('should connect websocket when user is logged in', () => {
    mockGetUser.mockReturnValue({ id: '123', email: 'test@test.com' })

    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    )

    expect(mockConnect).toHaveBeenCalledTimes(1)
  })

  it('should not connect websocket when user is not logged in', () => {
    mockGetUser.mockReturnValue(null)

    render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    )

    expect(mockConnect).not.toHaveBeenCalled()
  })

  it('should disconnect websocket on unmount', () => {
    mockGetUser.mockReturnValue({ id: '123', email: 'test@test.com' })

    const { unmount } = render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    )

    unmount()

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('should disconnect websocket on unmount even when user is not logged in', () => {
    mockGetUser.mockReturnValue(null)

    const { unmount } = render(
      <WebSocketProvider>
        <div>Content</div>
      </WebSocketProvider>
    )

    unmount()

    expect(mockDisconnect).toHaveBeenCalledTimes(1)
  })

  it('should render multiple children', () => {
    mockGetUser.mockReturnValue(null)

    render(
      <WebSocketProvider>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
        <div data-testid="child3">Child 3</div>
      </WebSocketProvider>
    )

    expect(screen.getByTestId('child1')).toBeInTheDocument()
    expect(screen.getByTestId('child2')).toBeInTheDocument()
    expect(screen.getByTestId('child3')).toBeInTheDocument()
  })
})
