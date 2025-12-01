import React from 'react'
import { render, screen } from '@testing-library/react'
import Dashboard from '../page'

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  Activity: () => <span data-testid="activity-icon">Activity</span>,
  MessageSquare: () => <span data-testid="message-icon">MessageSquare</span>,
  Cpu: () => <span data-testid="cpu-icon">Cpu</span>,
}))

// Mock Next.js Link
jest.mock('next/link', () => {
  return ({ children, href, className }: { children: React.ReactNode; href: string; className?: string }) => (
    <a href={href} className={className} data-testid="next-link">
      {children}
    </a>
  )
})

describe('Dashboard', () => {
  it('should render the header with title', () => {
    render(<Dashboard />)
    expect(screen.getByText('Zantara Mission Control')).toBeInTheDocument()
  })

  it('should render the system status indicator', () => {
    render(<Dashboard />)
    expect(screen.getByText('SYSTEM ONLINE')).toBeInTheDocument()
  })

  it('should render active agents card', () => {
    render(<Dashboard />)
    expect(screen.getByText('Active Agents')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(screen.getByText('Orchestrating workflows')).toBeInTheDocument()
    expect(screen.getByText('NODE_01')).toBeInTheDocument()
  })

  it('should render system health card', () => {
    render(<Dashboard />)
    expect(screen.getByText('System Health')).toBeInTheDocument()
    expect(screen.getByText('99.9%')).toBeInTheDocument()
    expect(screen.getByText('All systems nominal')).toBeInTheDocument()
    expect(screen.getByText('UPTIME')).toBeInTheDocument()
  })

  it('should render secure chat card with link', () => {
    render(<Dashboard />)
    expect(screen.getByText('Secure Chat')).toBeInTheDocument()
    expect(screen.getByText('Connect with Zantara Core')).toBeInTheDocument()
    expect(screen.getByText('Initiate Link')).toBeInTheDocument()
    expect(screen.getByText('ENCRYPTED')).toBeInTheDocument()

    const link = screen.getByTestId('next-link')
    expect(link).toHaveAttribute('href', '/chat')
  })

  it('should render all icons', () => {
    render(<Dashboard />)
    expect(screen.getByTestId('shield-icon')).toBeInTheDocument()
    expect(screen.getByTestId('activity-icon')).toBeInTheDocument()
    expect(screen.getByTestId('message-icon')).toBeInTheDocument()
    expect(screen.getByTestId('cpu-icon')).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    const { container } = render(<Dashboard />)

    const mainDiv = container.firstChild as HTMLElement
    expect(mainDiv).toHaveClass('min-h-screen')
    expect(mainDiv).toHaveClass('bg-[#2B2B2B]')
    expect(mainDiv).toHaveClass('text-white')
  })

  it('should render grid layout', () => {
    const { container } = render(<Dashboard />)

    const grid = container.querySelector('.grid')
    expect(grid).toHaveClass('grid-cols-1')
    expect(grid).toHaveClass('md:grid-cols-2')
    expect(grid).toHaveClass('lg:grid-cols-3')
  })

  it('should render cards with hover effects', () => {
    const { container } = render(<Dashboard />)

    const cards = container.querySelectorAll('.hover\\:border-red-500\\/30, .hover\\:border-green-500\\/30, .hover\\:border-blue-500\\/30')
    expect(cards.length).toBe(3)
  })

  it('should have animated pulse indicator for system status', () => {
    const { container } = render(<Dashboard />)

    const pulseIndicator = container.querySelector('.animate-pulse')
    expect(pulseIndicator).toBeInTheDocument()
    expect(pulseIndicator).toHaveClass('bg-green-500')
    expect(pulseIndicator).toHaveClass('rounded-full')
  })
})
