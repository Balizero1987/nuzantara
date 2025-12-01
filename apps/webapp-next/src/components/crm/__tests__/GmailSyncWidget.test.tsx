import React from 'react'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { GmailSyncWidget } from '../GmailSyncWidget'

// Mock crmAPI
const mockSyncGmail = jest.fn()
jest.mock('@/lib/api/crm', () => ({
  crmAPI: {
    syncGmail: () => mockSyncGmail(),
  },
}))

describe('GmailSyncWidget', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should render sync button', () => {
    render(<GmailSyncWidget />)
    expect(screen.getByText('Gmail CRM Sync')).toBeInTheDocument()
    expect(screen.getByText('Sync Now')).toBeInTheDocument()
  })

  it('should show loading state during sync', async () => {
    mockSyncGmail.mockImplementation(() => new Promise(() => {})) // Never resolves

    render(<GmailSyncWidget />)

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(screen.getByText('Syncing...')).toBeInTheDocument()
    })
  })

  it('should disable button during sync', async () => {
    mockSyncGmail.mockImplementation(() => new Promise(() => {}))

    render(<GmailSyncWidget />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).toBeDisabled()
    })
  })

  it('should display success message after sync', async () => {
    const mockResult = {
      emails_processed: 10,
      new_clients: 3,
      new_interactions: 7,
    }
    mockSyncGmail.mockResolvedValue(mockResult)

    render(<GmailSyncWidget />)

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(screen.getByText('Sync successful!')).toBeInTheDocument()
      expect(screen.getByText('10 emails processed')).toBeInTheDocument()
      expect(screen.getByText('3 new clients created')).toBeInTheDocument()
      expect(screen.getByText('7 interactions logged')).toBeInTheDocument()
    })
  })

  it('should auto-hide success message after 5 seconds', async () => {
    const mockResult = {
      emails_processed: 5,
      new_clients: 1,
      new_interactions: 2,
    }
    mockSyncGmail.mockResolvedValue(mockResult)

    render(<GmailSyncWidget />)

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(screen.getByText('Sync successful!')).toBeInTheDocument()
    })

    // Advance timer by 5 seconds
    act(() => {
      jest.advanceTimersByTime(5000)
    })

    await waitFor(() => {
      expect(screen.queryByText('Sync successful!')).not.toBeInTheDocument()
    })
  })

  it('should display error message on failure', async () => {
    mockSyncGmail.mockRejectedValue({
      response: { data: { message: 'Connection failed' } },
    })

    render(<GmailSyncWidget />)

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument()
    })
  })

  it('should display default error message when no response message', async () => {
    mockSyncGmail.mockRejectedValue(new Error('Network error'))

    render(<GmailSyncWidget />)

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(screen.getByText('Gmail sync failed')).toBeInTheDocument()
    })
  })

  it('should clear error state before new sync', async () => {
    // First sync fails
    mockSyncGmail.mockRejectedValueOnce({
      response: { data: { message: 'First error' } },
    })

    render(<GmailSyncWidget />)

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(screen.getByText('First error')).toBeInTheDocument()
    })

    // Second sync succeeds
    mockSyncGmail.mockResolvedValueOnce({
      emails_processed: 1,
      new_clients: 0,
      new_interactions: 0,
    })

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(screen.queryByText('First error')).not.toBeInTheDocument()
    })
  })

  it('should re-enable button after sync completes', async () => {
    mockSyncGmail.mockResolvedValue({
      emails_processed: 0,
      new_clients: 0,
      new_interactions: 0,
    })

    render(<GmailSyncWidget />)

    const button = screen.getByRole('button')
    fireEvent.click(button)

    await waitFor(() => {
      expect(button).not.toBeDisabled()
    })
  })

  it('should show spinner icon during sync', async () => {
    mockSyncGmail.mockImplementation(() => new Promise(() => {}))

    render(<GmailSyncWidget />)

    fireEvent.click(screen.getByText('Sync Now'))

    await waitFor(() => {
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })
})
