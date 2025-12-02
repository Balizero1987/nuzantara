/**
 * ChatHeader Component Tests
 * Tests for the header component with menu, check-in/out, CRM badge, avatar, and logout
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ChatHeader } from '../ChatHeader';

describe('ChatHeader', () => {
  const mockOnToggleSidebar = jest.fn();
  const mockOnCheckInOut = jest.fn();
  const mockOnAvatarUpload = jest.fn();
  const mockOnLogout = jest.fn();

  const defaultProps = {
    user: { email: 'test@example.com', name: 'Test User' },
    avatarImage: null,
    isCheckedIn: false,
    crmContext: null,
    isSidebarOpen: false,
    onToggleSidebar: mockOnToggleSidebar,
    onCheckInOut: mockOnCheckInOut,
    onAvatarUpload: mockOnAvatarUpload,
    onLogout: mockOnLogout,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);
      expect(container).toBeInTheDocument();
    });

    it('renders the ZANTARA logo', () => {
      render(<ChatHeader {...defaultProps} />);
      // Multiple ZANTARA images exist (logo and avatar default)
      const logos = screen.getAllByAltText('ZANTARA');
      expect(logos.length).toBeGreaterThan(0);
    });

    it('renders the menu button', () => {
      render(<ChatHeader {...defaultProps} />);
      expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
    });

    it('renders the logout button', () => {
      render(<ChatHeader {...defaultProps} />);
      expect(screen.getByText('Logout')).toBeInTheDocument();
    });
  });

  describe('Menu Toggle', () => {
    it('calls onToggleSidebar when menu button is clicked', () => {
      render(<ChatHeader {...defaultProps} />);

      const menuButton = screen.getByRole('button', { name: /menu/i });
      fireEvent.click(menuButton);

      expect(mockOnToggleSidebar).toHaveBeenCalledTimes(1);
    });

    it('rotates menu icon when sidebar is open', () => {
      const { container } = render(<ChatHeader {...defaultProps} isSidebarOpen={true} />);

      const svg = container.querySelector('svg.rotate-90');
      expect(svg).toBeInTheDocument();
    });

    it('shows hamburger icon when sidebar is closed', () => {
      const { container } = render(<ChatHeader {...defaultProps} isSidebarOpen={false} />);

      // Should NOT have rotate class
      const menuButton = screen.getByRole('button', { name: /menu/i });
      const svg = menuButton.querySelector('svg');
      expect(svg).not.toHaveClass('rotate-90');
    });
  });

  describe('Check In/Out', () => {
    it('calls onCheckInOut when check button is clicked', () => {
      render(<ChatHeader {...defaultProps} />);

      // Find the check-in/out button by its title
      const checkButton = screen.getByTitle('Check In');
      fireEvent.click(checkButton);

      expect(mockOnCheckInOut).toHaveBeenCalledTimes(1);
    });

    it('shows "Check Out" title when checked in', () => {
      render(<ChatHeader {...defaultProps} isCheckedIn={true} />);

      expect(screen.getByTitle('Check Out')).toBeInTheDocument();
    });

    it('shows "Check In" title when not checked in', () => {
      render(<ChatHeader {...defaultProps} isCheckedIn={false} />);

      expect(screen.getByTitle('Check In')).toBeInTheDocument();
    });

    it('applies green styling when checked in', () => {
      const { container } = render(<ChatHeader {...defaultProps} isCheckedIn={true} />);

      // Should have green-500 border class
      const checkButton = container.querySelector('.border-green-500');
      expect(checkButton).toBeInTheDocument();
    });
  });

  describe('CRM Context Badge', () => {
    it('does not render CRM badge when crmContext is null', () => {
      render(<ChatHeader {...defaultProps} crmContext={null} />);

      expect(screen.queryByText(/pratiche/)).not.toBeInTheDocument();
    });

    it('renders CRM badge when crmContext is provided', () => {
      const crmContext = {
        clientId: 123,
        clientName: 'Test Client',
        status: 'active',
        practices: [],
      };

      render(<ChatHeader {...defaultProps} crmContext={crmContext} />);

      expect(screen.getByText('Test Client')).toBeInTheDocument();
    });

    it('shows practices count when practices exist', () => {
      const crmContext = {
        clientId: 123,
        clientName: 'Test Client',
        status: 'active',
        practices: [{ id: 1, type: 'visa', status: 'active' }, { id: 2, type: 'permit', status: 'pending' }, { id: 3, type: 'company', status: 'completed' }],
      };

      render(<ChatHeader {...defaultProps} crmContext={crmContext} />);

      expect(screen.getByText('3 pratiche')).toBeInTheDocument();
    });

    it('has correct title attribute', () => {
      const crmContext = {
        clientId: 123,
        clientName: 'Test Client',
        status: 'active',
        practices: [],
      };

      render(<ChatHeader {...defaultProps} crmContext={crmContext} />);

      const badge = screen.getByTitle('CRM Client: Test Client (active)');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Avatar', () => {
    it('renders default logo when no avatarImage', () => {
      render(<ChatHeader {...defaultProps} avatarImage={null} />);

      // Should show default ZANTARA logo in avatar area
      const avatarImages = screen.getAllByAltText('ZANTARA');
      expect(avatarImages.length).toBeGreaterThanOrEqual(1);
    });

    it('renders custom avatar when avatarImage is provided', () => {
      render(<ChatHeader {...defaultProps} avatarImage="data:image/png;base64,test" />);

      const userAvatar = screen.getByAltText('User');
      expect(userAvatar).toHaveAttribute('src', 'data:image/png;base64,test');
    });

    it('has hidden file input for avatar upload', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);

      const fileInput = container.querySelector('input[type="file"]');
      expect(fileInput).toBeInTheDocument();
      expect(fileInput).toHaveClass('hidden');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
    });

    it('shows avatar upload title', () => {
      render(<ChatHeader {...defaultProps} />);

      expect(screen.getByTitle('Click to upload avatar')).toBeInTheDocument();
    });
  });

  describe('Logout', () => {
    it('calls onLogout when logout button is clicked', () => {
      render(<ChatHeader {...defaultProps} />);

      const logoutButton = screen.getByText('Logout');
      fireEvent.click(logoutButton);

      expect(mockOnLogout).toHaveBeenCalledTimes(1);
    });
  });

  describe('Online Status Indicator', () => {
    it('shows green online indicator', () => {
      const { container } = render(<ChatHeader {...defaultProps} />);

      // Should have animated green dot
      const onlineIndicator = container.querySelector('.bg-green-500.animate-pulse');
      expect(onlineIndicator).toBeInTheDocument();
    });
  });
});
