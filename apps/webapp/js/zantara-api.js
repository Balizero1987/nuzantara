/**
 * ZANTARA API Layer - Clean & Simple
 * Allineato con backend Fly.io (Ottobre 2025)
 *
 * Backend:
 * - TS-BACKEND: https://nuzantara-orchestrator.fly.dev
 * - RAG-BACKEND: https://nuzantara-rag.fly.dev
 *
 * Auth: Demo auth middleware (no API key needed)
 * Contracts: API versioning and fallback system
 */

const ZANTARA_API = {
  // Backend URLs (legacy - use API_CONTRACTS for new calls)
  backends: {
    ts: 'https://nuzantara-backend.fly.dev',
    rag: 'https://nuzantara-rag.fly.dev',
  },

  /**
   * Team Login (with API Contracts fallback)
   */
  async teamLogin(email, pin, name) {
    try {
      // Try with API Contracts first (resilient)
      if (window.API_CONTRACTS) {
        console.log('🔄 Using API Contracts for login...');

        const data = await window.API_CONTRACTS.callWithFallback('ts', '/api/auth/team/login', {
          method: 'POST',
          body: JSON.stringify({ email, pin, name }),
        });

        if (data.success) {
          this._saveLoginData(data);
          return { success: true, user: data.user, message: data.personalizedResponse };
        }

        return { success: false, error: 'Login failed' };
      }

      // Fallback to direct call (legacy)
      console.log('⚠️ Using legacy API call (no contracts)');
      const response = await fetch(`${this.backends.ts}/api/auth/team/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pin, name }),
      });

      if (!response.ok) {
        throw new Error(`Login failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        this._saveLoginData(data);
        return { success: true, user: data.user, message: data.personalizedResponse };
      }

      return { success: false, error: 'Login failed' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Save login data to localStorage
   */
  _saveLoginData(data) {
    localStorage.setItem('zantara-session', data.sessionId);
    localStorage.setItem('zantara-token', data.token); // JWT token for API calls
    localStorage.setItem('zantara-user', JSON.stringify(data.user));
    localStorage.setItem('zantara-email', data.user.email);
    localStorage.setItem('zantara-name', data.user.name);

    console.log('✅ Login successful:', data.user.name);
    console.log('🔑 JWT Token saved');
  },

  /**
   * Chat with Zantara (Haiku 4.5)
   * Supports both regular and SSE streaming with API Contracts
   * NOW WITH TOOLS SUPPORT - Zantara can see and use all 164 backend tools!
   */
  async chat(message, userEmail = null, useSSE = false) {
    try {
      const email = userEmail || localStorage.getItem('zantara-email') || 'guest@zantara.com';
      const token = localStorage.getItem('zantara-token');

      // Get relevant tools for this query (smart filtering)
      let tools = [];
      if (window.ZANTARA_TOOLS && window.ZANTARA_TOOLS.isLoaded()) {
        tools = window.ZANTARA_TOOLS.getToolsForQuery(message);
        console.log(`🔧 [Chat] Passing ${tools.length} tools to Zantara`);
        if (tools.length > 0) {
          console.log(`   Tools: ${tools.map((t) => t.name).join(', ')}`);
        }
      } else {
        console.warn('⚠️ [Chat] ZANTARA_TOOLS not loaded, tools will be empty');
      }

      // If SSE requested and ZANTARA_SSE available, use streaming
      if (useSSE && window.ZANTARA_SSE) {
        return await window.ZANTARA_SSE.stream(message, email, tools);
      }

      // Try with API Contracts first (resilient)
      if (window.API_CONTRACTS) {
        console.log('🔄 Using API Contracts for chat...');

        const headers = { 'Content-Type': 'application/json' };
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        const data = await window.API_CONTRACTS.callWithFallback('rag', '/bali-zero/chat', {
          method: 'POST',
          headers: headers,
          body: JSON.stringify({
            query: message,
            user_email: email,
            user_role: 'member',
            tools: tools, // ← NEW: Pass tools to backend
            tool_choice: { type: 'auto' }, // ← Let Claude decide when to use tools
          }),
        });

        if (data.success) {
          // Log which tools were used (if any)
          if (data.tools_used && data.tools_used.length > 0) {
            console.log(`✅ [Chat] Tools used: ${data.tools_used.join(', ')}`);
          }

          return {
            success: true,
            response: data.response,
            model: data.model_used,
            ai: data.ai_used,
            tools_used: data.tools_used || [], // ← NEW: Return which tools were called
          };
        }

        return { success: false, error: 'Chat failed' };
      }

      // Fallback to direct call (legacy)
      console.log('⚠️ Using legacy API call (no contracts)');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.backends.rag}/bali-zero/chat`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          query: message,
          user_email: email,
          user_role: 'member',
          tools: tools, // ← NEW: Pass tools to backend
          tool_choice: { type: 'auto' }, // ← Let Claude decide when to use tools
        }),
      });

      if (!response.ok) {
        throw new Error(`Chat failed: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        // Log which tools were used (if any)
        if (data.tools_used && data.tools_used.length > 0) {
          console.log(`✅ [Chat] Tools used: ${data.tools_used.join(', ')}`);
        }

        return {
          success: true,
          response: data.response,
          model: data.model_used,
          ai: data.ai_used,
          tools_used: data.tools_used || [], // ← NEW: Return which tools were called
        };
      }

      return { success: false, error: 'Chat failed' };
    } catch (error) {
      console.error('Chat error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn() {
    const session = localStorage.getItem('zantara-session');
    const token = localStorage.getItem('zantara-token');
    const user = localStorage.getItem('zantara-user');
    return !!(session && token && user);
  },

  /**
   * Get current user
   */
  getUser() {
    try {
      const userStr = localStorage.getItem('zantara-user');
      return userStr ? JSON.parse(userStr) : null;
    } catch {
      return null;
    }
  },

  /**
   * Get JWT token
   */
  getToken() {
    return localStorage.getItem('zantara-token');
  },

  /**
   * ZANTARA v3 Ω Unified Knowledge Endpoint
   * Single entry point for ALL knowledge bases
   */
  async zantaraUnified(query, domain = 'all', mode = 'comprehensive', includeSources = false) {
    try {
      if (window.API_CONTRACTS) {
        console.log('🧠 Using ZANTARA Unified...');

        const data = await window.API_CONTRACTS.callWithFallback('ts', '/zantara.unified', {
          method: 'POST',
          body: JSON.stringify({
            params: { query, domain, mode, include_sources },
          }),
        });

        return { success: true, data };
      }

      // Fallback to production backend
      const response = await fetch('https://nuzantara-backend.fly.dev/zantara.unified', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: { query, domain, mode, include_sources },
        }),
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('ZANTARA Unified error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * ZANTARA v3 Ω Collective Intelligence Endpoint
   * Shared memory and learning across users
   */
  async zantaraCollective(action, params = {}) {
    try {
      if (window.API_CONTRACTS) {
        console.log('🤝 Using ZANTARA Collective...');

        const data = await window.API_CONTRACTS.callWithFallback('ts', '/zantara.collective', {
          method: 'POST',
          body: JSON.stringify({
            params: { action, ...params },
          }),
        });

        return { success: true, data };
      }

      // Fallback to production backend
      const response = await fetch('https://nuzantara-backend.fly.dev/zantara.collective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: { action, ...params },
        }),
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('ZANTARA Collective error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * ZANTARA v3 Ω Ecosystem Analysis Endpoint
   * Complete business ecosystem analysis
   */
  async zantaraEcosystem(
    scenario,
    businessType,
    ownership = 'foreign',
    scope = 'comprehensive',
    location = 'bali'
  ) {
    try {
      if (window.API_CONTRACTS) {
        console.log('🏗️ Using ZANTARA Ecosystem...');

        const data = await window.API_CONTRACTS.callWithFallback('ts', '/zantara.ecosystem', {
          method: 'POST',
          body: JSON.stringify({
            params: {
              scenario,
              business_type: businessType,
              ownership,
              scope,
              location,
            },
          }),
        });

        return { success: true, data };
      }

      // Fallback to production backend
      const response = await fetch('https://nuzantara-backend.fly.dev/zantara.ecosystem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          params: {
            scenario,
            business_type: businessType,
            ownership,
            scope,
            location,
          },
        }),
      });

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error('ZANTARA Ecosystem error:', error);
      return { success: false, error: error.message };
    }
  },

  /**
   * Logout
   */
  logout() {
    localStorage.removeItem('zantara-session');
    localStorage.removeItem('zantara-token');
    localStorage.removeItem('zantara-user');
    localStorage.removeItem('zantara-email');
    localStorage.removeItem('zantara-name');
    console.log('✅ Logged out');
  },
};

// Make available globally
window.ZANTARA_API = ZANTARA_API;
