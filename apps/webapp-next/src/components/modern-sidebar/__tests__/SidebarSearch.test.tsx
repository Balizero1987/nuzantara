import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { SidebarSearch } from '../SidebarSearch'

// Mock lucide-react
jest.mock('lucide-react', () => ({
  Search: () => <span data-testid="search-icon">Search</span>,
  Sparkles: () => <span data-testid="sparkles-icon">Sparkles</span>,
  Clock: () => <span data-testid="clock-icon">Clock</span>,
  Hash: () => <span data-testid="hash-icon">Hash</span>,
}))

describe('SidebarSearch', () => {
  it('should render search input', () => {
    render(<SidebarSearch />)
    expect(screen.getByPlaceholderText('Search chats, commands...')).toBeInTheDocument()
  })

  it('should render search icon', () => {
    render(<SidebarSearch />)
    expect(screen.getByTestId('search-icon')).toBeInTheDocument()
  })

  it('should update query on input change', () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'test' } })
    expect(input).toHaveValue('test')
  })

  it('should show suggestions when typing matching text', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'Project' } })

    await waitFor(() => {
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })
  })

  it('should show command suggestions when typing command name', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'New' } })

    await waitFor(() => {
      expect(screen.getByText('New Chat')).toBeInTheDocument()
      expect(screen.getByText('Start a fresh conversation')).toBeInTheDocument()
    })
  })

  it('should call onChatSelect when chat suggestion is clicked', async () => {
    const onChatSelect = jest.fn()
    render(<SidebarSearch onChatSelect={onChatSelect} />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'Project' } })

    await waitFor(() => {
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Project Planning Discussion'))

    expect(onChatSelect).toHaveBeenCalledWith('1')
  })

  it('should clear query after selecting suggestion', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'Project' } })

    await waitFor(() => {
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Project Planning Discussion'))

    expect(input).toHaveValue('')
  })

  it('should close suggestions on Escape key', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'Project' } })

    await waitFor(() => {
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })

    fireEvent.keyDown(input, { key: 'Escape' })

    await waitFor(() => {
      expect(screen.queryByText('Project Planning Discussion')).not.toBeInTheDocument()
    })
    expect(input).toHaveValue('')
  })

  it('should close suggestions when empty query', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    // Type something first
    fireEvent.change(input, { target: { value: 'Project' } })

    await waitFor(() => {
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })

    // Clear input
    fireEvent.change(input, { target: { value: '' } })

    await waitFor(() => {
      expect(screen.queryByText('Project Planning Discussion')).not.toBeInTheDocument()
    })
  })

  it('should show suggestions on focus if query exists', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'Code' } })

    await waitFor(() => {
      expect(screen.getByText('Code Review Session')).toBeInTheDocument()
    })

    // Simulate blur and focus
    fireEvent.blur(input)
    fireEvent.focus(input)

    // Suggestions should still be visible
    expect(screen.getByText('Code Review Session')).toBeInTheDocument()
  })

  it('should limit suggestions to 5 results', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    // Search for something that might match many items
    fireEvent.change(input, { target: { value: 'a' } })

    await waitFor(() => {
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeLessThanOrEqual(5)
    })
  })

  it('should close suggestions when backdrop is clicked on mobile', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'Project' } })

    await waitFor(() => {
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })

    // Find and click the backdrop (fixed inset-0 element)
    const backdrop = document.querySelector('.fixed.inset-0')
    if (backdrop) {
      fireEvent.click(backdrop)
    }

    await waitFor(() => {
      expect(screen.queryByText('Project Planning Discussion')).not.toBeInTheDocument()
    })
  })

  it('should apply custom className', () => {
    const { container } = render(<SidebarSearch className="custom-class" />)
    expect(container.querySelector('.custom-class')).toBeInTheDocument()
  })

  it('should search in chat preview text', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    // Search for text in preview
    fireEvent.change(input, { target: { value: 'roadmap' } })

    await waitFor(() => {
      expect(screen.getByText('Project Planning Discussion')).toBeInTheDocument()
    })
  })

  it('should execute command when command suggestion is clicked', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation()

    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'Generate' } })

    await waitFor(() => {
      expect(screen.getByText('Generate Image')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByText('Generate Image'))

    expect(consoleSpy).toHaveBeenCalledWith('Execute command:', 'image-gen')
    consoleSpy.mockRestore()
  })

  it('should show keyboard shortcut for commands', async () => {
    render(<SidebarSearch />)
    const input = screen.getByPlaceholderText('Search chats, commands...')

    fireEvent.change(input, { target: { value: 'New' } })

    await waitFor(() => {
      // Check for keyboard shortcut display
      expect(screen.getByText('⌘N')).toBeInTheDocument()
    })
  })
})
