import '@testing-library/jest-dom';

// Mock window.API_CONFIG
globalThis.API_CONFIG = {
  backend: { url: 'https://nuzantara-rag.fly.dev' },
  memory: { url: 'https://nuzantara-memory.fly.dev' },
};

// Mock fetch globally
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock window.location (delete first, then define)
delete (window as any).location;
(window as any).location = {
  href: '',
  pathname: '/',
  search: '',
  hash: '',
  assign: jest.fn(),
  replace: jest.fn(),
  reload: jest.fn(),
};

