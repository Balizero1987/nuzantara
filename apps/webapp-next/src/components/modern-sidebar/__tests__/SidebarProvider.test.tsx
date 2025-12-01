import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { SidebarProvider, useSidebar } from '../SidebarProvider'

// Test component that uses the hook
function TestConsumer() {
  const { state, open, setOpen, openMobile, setOpenMobile, isMobile, toggleSidebar } = useSidebar()
  return (
    <div>
      <span data-testid="state">{state}</span>
      <span data-testid="open">{open.toString()}</span>
      <span data-testid="openMobile">{openMobile.toString()}</span>
      <span data-testid="isMobile">{isMobile.toString()}</span>
      <button data-testid="toggle" onClick={toggleSidebar}>Toggle</button>
      <button data-testid="setOpen" onClick={() => setOpen(!open)}>Set Open</button>
      <button data-testid="setOpenMobile" onClick={() => setOpenMobile(!openMobile)}>Set Mobile</button>
    </div>
  )
}

describe('SidebarProvider', () => {
  const originalInnerWidth = window.innerWidth

  beforeEach(() => {
    // Reset window.innerWidth before each test
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024, // Desktop by default
    })
  })

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    })
  })

  it('should render children', () => {
    render(
      <SidebarProvider>
        <div data-testid="child">Child content</div>
      </SidebarProvider>
    )
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('should provide default expanded state', () => {
    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('expanded')
    expect(screen.getByTestId('open')).toHaveTextContent('true')
  })

  it('should respect defaultOpen=false', () => {
    render(
      <SidebarProvider defaultOpen={false}>
        <TestConsumer />
      </SidebarProvider>
    )
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed')
    expect(screen.getByTestId('open')).toHaveTextContent('false')
  })

  it('should toggle sidebar on desktop', () => {
    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    )

    expect(screen.getByTestId('open')).toHaveTextContent('true')

    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('open')).toHaveTextContent('false')

    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('open')).toHaveTextContent('true')
  })

  it('should toggle mobile sidebar on mobile', () => {
    // Set mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500, // Mobile
    })

    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    )

    // Trigger resize event
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    expect(screen.getByTestId('isMobile')).toHaveTextContent('true')
    expect(screen.getByTestId('openMobile')).toHaveTextContent('false')

    fireEvent.click(screen.getByTestId('toggle'))
    expect(screen.getByTestId('openMobile')).toHaveTextContent('true')
  })

  it('should update state when setOpen is called', () => {
    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    )

    expect(screen.getByTestId('state')).toHaveTextContent('expanded')

    fireEvent.click(screen.getByTestId('setOpen'))
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed')

    fireEvent.click(screen.getByTestId('setOpen'))
    expect(screen.getByTestId('state')).toHaveTextContent('expanded')
  })

  it('should close mobile sidebar when resized to desktop', () => {
    // Start mobile
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    })

    render(
      <SidebarProvider>
        <TestConsumer />
      </SidebarProvider>
    )

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Open mobile sidebar
    fireEvent.click(screen.getByTestId('setOpenMobile'))
    expect(screen.getByTestId('openMobile')).toHaveTextContent('true')

    // Resize to desktop
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })

    act(() => {
      window.dispatchEvent(new Event('resize'))
    })

    // Mobile sidebar should close
    expect(screen.getByTestId('openMobile')).toHaveTextContent('false')
    expect(screen.getByTestId('isMobile')).toHaveTextContent('false')
  })

  it('should apply className to wrapper div', () => {
    const { container } = render(
      <SidebarProvider className="custom-class">
        <div>Content</div>
      </SidebarProvider>
    )
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })
})

describe('useSidebar', () => {
  it('should throw error when used outside provider', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})

    expect(() => {
      render(<TestConsumer />)
    }).toThrow('useSidebar must be used within a SidebarProvider.')

    consoleSpy.mockRestore()
  })
})
