# Frontend Modernization Blueprint (React + Vite)

**Role:** Principal Frontend Architect
**Objective:** Rewrite `apps/webapp` from Vanilla JS to React + Vite + Tailwind CSS.
**Status:** 🚀 Ready for Implementation

## 1. Tech Stack Definitivo

| Category | Technology | Reason |
| :--- | :--- | :--- |
| **Framework** | **React 18+** | Industry standard, component-based, rich ecosystem. |
| **Build Tool** | **Vite** | Blazing fast HMR, optimized builds, native ES modules. |
| **Styling** | **Tailwind CSS** | Utility-first, maintainable, consistent design system. |
| **State Management** | **Zustand** | Minimalist, hook-based, perfect for auth/chat state. |
| **Data Fetching** | **TanStack Query** | Robust async state management (loading, error, caching). |
| **Icons** | **Lucide React** | Clean, consistent, lightweight SVG icons. |
| **Routing** | **React Router v6** | Standard routing solution. |
| **HTTP Client** | **Axios** or **Ky** | Better DX than native fetch (interceptors for Auth). |
| **Markdown** | **React Markdown** | For rendering AI responses safely. |

## 2. Design System Extraction (Tailwind Config)

Based on `apps/webapp/css/design-system.css`, here is the required `tailwind.config.js` configuration to preserve the "Bali Zero" identity.

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand Colors
        primary: {
          DEFAULT: 'rgba(217, 32, 39, 0.9)', // #D92027
          hover: 'rgba(217, 32, 39, 1)',
        },
        // Backgrounds
        background: '#2B2B2B',
        surface: {
          DEFAULT: '#323232',
          dark: '#262626',
        },
        // Borders
        border: '#3a3a3a',
        // Text
        text: {
          primary: 'rgba(255, 255, 255, 0.95)',
          secondary: 'rgba(255, 255, 255, 0.7)',
          tertiary: 'rgba(255, 255, 255, 0.4)',
          placeholder: '#777777',
        }
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'sans-serif'],
      },
      boxShadow: {
        sm: '0 2px 4px rgba(0, 0, 0, 0.2)',
        md: '0 4px 12px rgba(0, 0, 0, 0.4)',
        lg: '0 8px 24px rgba(0, 0, 0, 0.4)',
      },
      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      }
    },
  },
  plugins: [],
}
```

## 3. Component Architecture

We will follow Atomic Design principles adapted for React.

### Atoms (Basic Building Blocks)
*   `<Button />`: Primary (Red), Secondary (Outline), Ghost.
*   `<Input />`: Styled text inputs with focus states.
*   `<Icon />`: Wrapper for Lucide icons.
*   `<Avatar />`: User/AI profile pictures.
*   `<Loader />`: "Thinking" animation.
*   `<Badge />`: For status or tags.

### Molecules (Simple Combinations)
*   `<ChatMessage />`: Displays a single message (User or AI). Handles Markdown rendering.
*   `<MemoryIndicator />`: **[SUPERPOWER]** Visual cue (e.g., pulsing brain icon) when AI accesses memory.
*   `<TypingIndicator />`: "Zantara is typing..." animation.
*   `<ThemeToggle />`: Switch between modes (if planned).

### Organisms (Complex Sections)
*   `<ChatWindow />`: The main scrollable area containing the message list.
*   `<ChatInputArea />`: Textarea + Send Button + Attachment options.
*   `<Sidebar />`: Navigation, History List, User Profile.
*   `<PricingTable />`: **[SUPERPOWER]** Rich component to render pricing JSON.
*   `<MapWidget />`: **[SUPERPOWER]** Rich component for location data.

### Templates (Layouts)
*   `<AuthLayout />`: Centered box for Login/Register (preserves `login-form` style).
*   `<MainLayout />`: Sidebar (left) + Content (right).

## 4. Integration Strategy (The "Superpowers")

### A. Real Streaming (SSE)
*   **Hook:** `useChatStream()`
*   **Logic:** Connects to `/bali-zero/chat-stream`.
*   **Handling:** Parses `data: {...}` events. Appends tokens to the current message state in real-time.
*   **UX:** Implements "Typewriter Effect" by updating the UI as chunks arrive.

### B. Visual Memory
*   **Trigger:** Backend sends a specific metadata event (e.g., `type: 'memory_access'`).
*   **UI:** `<MemoryIndicator />` flashes or glows in the corner of the message bubble.
*   **Feedback:** Tooltip shows "Recalled from previous conversation".

### C. Rich Tooling
*   **Logic:** Backend sends structured JSON (e.g., `type: 'tool_result', tool: 'pricing_table', data: {...}`).
*   **Render:** `ChatMessage` component checks `message.type`.
    *   If `text`: Render Markdown.
    *   If `tool_result`: Dynamically render `<PricingTable data={...} />`.

### D. Auth State
*   **Store:** `useAuthStore` (Zustand).
*   **Persistence:** `persist` middleware (saves to localStorage).
*   **Security:** Axios interceptor attaches `Bearer <token>` to every request. Handles 401 by redirecting to Login.

## 5. Migration Roadmap

### Phase 1: Foundation (Parallel Track)
1.  Create `apps/webapp-react` using `npm create vite@latest`.
2.  Install dependencies (Tailwind, Zustand, Query, etc.).
3.  Configure Tailwind with the "Bali Zero" preset.
4.  Set up directory structure (`src/components`, `src/hooks`, `src/stores`).

### Phase 2: Core Components & Auth
1.  Build Atoms and Molecules (Button, Input, Layouts).
2.  Implement `AuthService` and `useAuthStore`.
3.  Recreate `Login` page (pixel-perfect match to current design).

### Phase 3: The Chat Experience
1.  Implement `ChatService` (API calls).
2.  Build `ChatWindow` and `ChatInput`.
3.  Implement **SSE Streaming** logic.
4.  Add **Markdown Rendering**.

### Phase 4: Superpowers & Polish
1.  Implement `<MemoryIndicator />`.
2.  Create Rich Components (Tables, Maps).
3.  Add Animations (Framer Motion or CSS).

### Phase 5: Switchover
1.  Deploy `webapp-react` to a staging URL.
2.  Verify all flows.
3.  Replace the build pipeline to serve the React app instead of the vanilla JS app.
