/* eslint-env jest */
/* eslint-disable @typescript-eslint/no-require-imports */
/* global jest, beforeEach, localStorage, window */
import '@testing-library/jest-dom';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '',
}));

// Mock next/image
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    return <img {...props} />;
  },
}));

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }) => {
    return <a href={href}>{children}</a>;
  };
  return MockLink;
});

// Mock react-markdown and remark-gfm to avoid ESM issues
jest.mock('react-markdown', () => (props) => {
  return <div data-testid="react-markdown">{props.children}</div>;
});

jest.mock('remark-gfm', () => () => {});

// Setup localStorage mock
const localStorageMock = (() => {
  let store = {};

  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => {
      store[key] = value.toString();
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

// Only set up window mocks when running in jsdom environment
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
  });

  // Mock window.matchMedia for responsive hooks
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  });
}

// Mock fetch globally
global.fetch = jest.fn();

// Polyfill TextEncoder/TextDecoder for Node.js environment
if (typeof TextEncoder === 'undefined') {
  global.TextEncoder = require('util').TextEncoder;
  global.TextDecoder = require('util').TextDecoder;
}

// Polyfill ReadableStream for Node.js environment
if (typeof ReadableStream === 'undefined') {
  // Use web-streams-polyfill if available, otherwise create a simple mock
  try {
    const { ReadableStream } = require('web-streams-polyfill/ponyfill');
    global.ReadableStream = ReadableStream;
  } catch {
    // Fallback: create a minimal ReadableStream mock
    global.ReadableStream = class ReadableStream {
      constructor(underlyingSource) {
        this._underlyingSource = underlyingSource;
      }
      getReader() {
        return this._underlyingSource.start
          ? {
              read: async () => {
                if (this._underlyingSource.start) {
                  const controller = {
                    enqueue: (chunk) => {
                      this._chunks = this._chunks || [];
                      this._chunks.push(chunk);
                    },
                    close: () => {
                      this._done = true;
                    },
                  };
                  await this._underlyingSource.start(controller);
                }
                if (this._done) {
                  return { done: true, value: undefined };
                }
                const chunk = this._chunks?.shift();
                return chunk ? { done: false, value: chunk } : { done: true, value: undefined };
              },
            }
          : null;
      }
    };
  }
}

// Reset mocks between tests
beforeEach(() => {
  if (typeof localStorage !== 'undefined' && typeof localStorage.clear === 'function') {
    localStorage.clear();
  }
  jest.clearAllMocks();
});
