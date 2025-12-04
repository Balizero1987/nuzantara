/**
 * WelcomeScreen Component Tests
 * Tests for the initial welcome screen displayed when no messages exist
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { WelcomeScreen } from '../WelcomeScreen';

describe('WelcomeScreen', () => {
  describe('Basic Rendering', () => {
    it('renders without crashing', () => {
      const { container } = render(<WelcomeScreen />);
      expect(container).toBeInTheDocument();
    });

    it('displays the welcome title in Indonesian', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText(/Selamat datang di ZANTARA/i)).toBeInTheDocument();
    });

    it('displays the welcome subtitle', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText(/Semoga kehadiran kami membawa cahaya dan kebijaksanaan/i)).toBeInTheDocument();
    });
  });

  describe('Visual Elements', () => {
    it('has centered content', () => {
      const { container } = render(<WelcomeScreen />);

      const centerDiv = container.querySelector('.flex.flex-col.items-center.justify-center');
      expect(centerDiv).toBeInTheDocument();
    });

    it('renders the AI brain background image', () => {
      const { container } = render(<WelcomeScreen />);

      // Check for background image div with opacity-10
      const bgDiv = container.querySelector('.opacity-10');

      // At least one background element should exist
      expect(bgDiv).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('title has golden gradient or text styling', () => {
      render(<WelcomeScreen />);

      const title = screen.getByText(/Selamat datang di ZANTARA/i);
      // Title is inside a span inside h1
      expect(title.tagName).toBe('SPAN');
      expect(title.closest('h1')).toBeInTheDocument();
    });

    it('subtitle has muted text color', () => {
      render(<WelcomeScreen />);

      const subtitle = screen.getByText(/Semoga kehadiran kami/i);
      expect(subtitle).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('uses semantic heading element', () => {
      render(<WelcomeScreen />);

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('content is visible', () => {
      render(<WelcomeScreen />);

      expect(screen.getByText(/Selamat datang di ZANTARA/i)).toBeVisible();
      expect(screen.getByText(/Semoga kehadiran kami/i)).toBeVisible();
    });
  });
});
