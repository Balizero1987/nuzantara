// 🎮 Game Dashboard Entry Point

import React from 'react';
import { createRoot } from 'react-dom/client';
import { GameDashboard } from './components/GameDashboard';
import { ErrorBoundary } from './components/ErrorBoundary';
import '../css/game-dashboard.css';
import '../css/design-system.css';
import '../css/bali-zero-theme.css';

// Get user ID from session/auth
const getUserId = (): string => {
  // Try to get from localStorage (set during login)
  const userId = localStorage.getItem('userId');
  if (userId) return userId;

  // Fallback for demo
  return 'user_demo';
};

const userId = getUserId();

// Initialize React app
const container = document.getElementById('game-root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <GameDashboard userId={userId} />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Game root element not found');
}
