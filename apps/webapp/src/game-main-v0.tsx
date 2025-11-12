// 🎮 NUZANTARA QUEST - v0.dev Dashboard Entry Point

import React from 'react';
import ReactDOM from 'react-dom/client';
import DashboardV0 from './components/DashboardV0';
import ErrorBoundary from './components/ErrorBoundary';
import './index.css';

// Get user ID from session or URL
const getUserId = (): string => {
  // Try to get from URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlUserId = urlParams.get('userId');
  if (urlUserId) {
    return urlUserId;
  }

  // Try to get from session storage
  const sessionUserId = sessionStorage.getItem('userId');
  if (sessionUserId) {
    return sessionUserId;
  }

  // Try to get from localStorage
  const localUserId = localStorage.getItem('userId');
  if (localUserId) {
    return localUserId;
  }

  // Generate a temporary ID
  const tempId = `user_${Date.now()}`;
  sessionStorage.setItem('userId', tempId);
  return tempId;
};

const userId = getUserId();

console.log('🎮 NUZANTARA QUEST v0 Dashboard starting...');
console.log('User ID:', userId);

// Mount React app
const rootElement = document.getElementById('root');

if (rootElement) {
  const root = ReactDOM.createRoot(rootElement);

  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <DashboardV0 userId={userId} />
      </ErrorBoundary>
    </React.StrictMode>
  );

  console.log('✅ Dashboard mounted successfully');
} else {
  console.error('❌ Root element not found');
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

// Log app info
console.log('📊 Dashboard Info:', {
  version: '1.0.0-v0',
  build: 'v0.dev',
  timestamp: new Date().toISOString(),
  userId
});
