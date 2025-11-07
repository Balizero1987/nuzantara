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
    // FIX 5: Add localhost fallback (port 8081, different from backend 8080)
    url: window.location.hostname === 'localhost'
      ? 'http://localhost:8081'
      : 'https://nuzantara-memory.fly.dev'
  }
};

