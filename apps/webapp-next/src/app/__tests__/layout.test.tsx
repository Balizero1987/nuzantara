import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock next/font/google
jest.mock('next/font/google', () => ({
  Inter: () => ({
    className: 'inter-font',
  }),
}))

// Mock WebSocketProvider
jest.mock('@/components/providers/WebSocketProvider', () => ({
  WebSocketProvider: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="websocket-provider">{children}</div>
  ),
}))

// Import after mocks
import RootLayout from '../layout'

describe('RootLayout', () => {
  it('should render children', () => {
    render(
      <RootLayout>
        <div data-testid="child-content">Test Content</div>
      </RootLayout>
    )

    expect(screen.getByTestId('child-content')).toBeInTheDocument()
    expect(screen.getByText('Test Content')).toBeInTheDocument()
  })

  it('should wrap children with WebSocketProvider', () => {
    render(
      <RootLayout>
        <div>Child</div>
      </RootLayout>
    )

    expect(screen.getByTestId('websocket-provider')).toBeInTheDocument()
  })

  it('should apply Inter font className', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const body = container.querySelector('body')
    expect(body?.className).toContain('inter-font')
    expect(body?.className).toContain('antialiased')
  })

  it('should set html lang to en', () => {
    const { container } = render(
      <RootLayout>
        <div>Content</div>
      </RootLayout>
    )

    const html = container.querySelector('html')
    expect(html?.getAttribute('lang')).toBe('en')
  })
})
