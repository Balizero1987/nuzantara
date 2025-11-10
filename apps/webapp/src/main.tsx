import React from 'react';
import { createRoot } from 'react-dom/client';
import Login from './components/Login';
import { ErrorBoundary } from './components/ErrorBoundary';
import '../css/design-system.css';
import '../css/bali-zero-theme.css';

// Initialize React app
const container = document.getElementById('root');
if (container) {
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <ErrorBoundary>
        <Login />
      </ErrorBoundary>
    </React.StrictMode>
  );
} else {
  console.error('Root element not found');
}

