// API Configuration - Centralized
export const API_CONFIG = {
  backend: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8080'
      : 'https://nuzantara-backend.fly.dev'
  },
  rag: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8000'
      : 'https://nuzantara-rag.fly.dev'
  },
  memory: {
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8081'  // Different port to avoid conflict with backend-ts
      : 'https://nuzantara-memory.fly.dev'
  }
};

// Expose globally for non-module scripts
if (typeof window !== 'undefined') {
  window.API_CONFIG = API_CONFIG;
}
