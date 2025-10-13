// ZANTARA Optimized App - Performance-first implementation
import { moduleLoader, loadModule } from './utils/module-loader.js';
import { logger } from './utils/logger.js';
import { performanceMonitor } from './utils/performance-monitor.js';

class ZantaraAppOptimized {
  constructor() {
    this.isListening = false;
    this.currentView = 'welcome';
    this.messages = [];
    this.recognition = null;
    this.extraLoaded = 0;
    this.useStreaming = false;
    this.streamingClient = null;
    this.streamingUI = null;
    
    // Performance tracking
    this.initStartTime = performance.now();
    
    // Initialize core functionality
    this.init();
  }

  async init() {
    logger.log('[ZantaraApp] Initializing optimized app...');
    
    try {
      // Load critical modules first
      await this.loadCriticalModules();
      
      // Initialize UI
      this.initializeUI();
      
      // Load streaming modules lazily
      this.initStreamingLazy();
      
      // Setup event listeners
      this.setupEventListeners();
      
      // Load additional features on idle
      this.loadFeaturesOnIdle();
      
      logger.log(`[ZantaraApp] Initialization complete in ${performance.now() - this.initStartTime}ms`);
    } catch (error) {
      logger.error('[ZantaraApp] Initialization failed:', error);
    }
  }

  // Load only critical modules immediately
  async loadCriticalModules() {
    const criticalModules = ['config'];
    
    try {
      const results = await Promise.allSettled(
        criticalModules.map(module => loadModule(module))
      );
      
      results.forEach((result, index) => {
        if (result.status === 'rejected') {
          logger.warn(`Failed to load critical module ${criticalModules[index]}:`, result.reason);
        }
      });
    } catch (error) {
      logger.error('Critical module loading failed:', error);
    }
  }

  // Initialize UI with minimal DOM manipulation
  initializeUI() {
    // Cache DOM elements
    this.elements = {
      container: document.querySelector('.zantara-container'),
      messagesContainer: document.querySelector('.messages-container'),
      inputContainer: document.querySelector('.input-container'),
      voiceButton: document.querySelector('#voiceButton'),
      sendButton: document.querySelector('#sendButton'),
      messageInput: document.querySelector('#messageInput')
    };

    // Initialize language chips efficiently
    this.initLanguageChips();
    
    // Setup theme detection
    this.detectAndApplyTheme();
  }

  // Initialize language chips with minimal DOM operations
  initLanguageChips() {
    const langChips = {
      it: [['📋','Preventivo'], ["📞","Chiama 15'"], ['📄','Documenti'], ['▶️','Avvia Pratica'], ['💬','WhatsApp'], ['✉️','Email']],
      en: [['📋','Quote'], ["📞","Call 15'"], ['📄','Documents'], ['▶️','Start Process'], ['💬','WhatsApp'], ['✉️','Email']],
      id: [['📋','Penawaran'], ["📞","Telpon 15'"], ['📄','Dokumen'], ['▶️','Mulai Proses'], ['💬','WhatsApp'], ['✉️','Email']],
      uk: [['📋','Кошторис'], ["📞","Дзвінок 15'"], ['📄','Документи'], ['▶️','Почати процес'], ['💬','WhatsApp'], ['✉️','Email']]
    };

    this.langChips = langChips;
    
    // Only render chips when needed
    this.renderChipsLazy();
  }

  // Render chips only when visible
  renderChipsLazy() {
    const chipsContainer = document.querySelector('.quick-actions');
    if (!chipsContainer) return;

    // Use Intersection Observer for lazy rendering
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.renderLanguageChips();
            observer.disconnect();
          }
        });
      });
      
      observer.observe(chipsContainer);
    } else {
      // Fallback: render after delay
      setTimeout(() => this.renderLanguageChips(), 100);
    }
  }

  // Render language chips efficiently
  renderLanguageChips() {
    const container = document.querySelector('.quick-actions');
    if (!container) return;

    const currentLang = this.detectLanguage();
    const chips = this.langChips[currentLang] || this.langChips.en;
    
    // Use DocumentFragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    
    chips.forEach(([emoji, text]) => {
      const chip = document.createElement('button');
      chip.className = 'quick-chip';
      chip.innerHTML = `${emoji} ${text}`;
      chip.addEventListener('click', () => this.handleChipClick(text), { passive: true });
      fragment.appendChild(chip);
    });
    
    container.appendChild(fragment);
  }

  // Detect user language efficiently
  detectLanguage() {
    return navigator.language?.split('-')[0] || 'en';
  }

  // Detect and apply theme without blocking
  detectAndApplyTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const savedTheme = localStorage.getItem('zantara-theme');
    
    if (savedTheme) {
      document.body.className = savedTheme;
    } else if (prefersDark) {
      document.body.className = 'night-mode';
    } else {
      document.body.className = 'day-mode';
    }
  }

  // Initialize streaming lazily
  async initStreamingLazy() {
    // Load streaming modules only when needed
    moduleLoader.loadOnInteraction('streaming-client', '#messageInput', 'focus');
    moduleLoader.loadOnInteraction('streaming-ui', '#messageInput', 'focus');
    
    // Preload on idle
    moduleLoader.loadOnIdle('streaming-toggle');
  }

  // Setup event listeners efficiently
  setupEventListeners() {
    // Use event delegation for better performance
    document.addEventListener('click', this.handleGlobalClick.bind(this), { passive: true });
    document.addEventListener('keydown', this.handleGlobalKeydown.bind(this));
    
    // Setup input handlers with debouncing
    if (this.elements.messageInput) {
      this.elements.messageInput.addEventListener('input', 
        this.debounce(this.handleInputChange.bind(this), 300)
      );
    }

    // Setup voice button
    if (this.elements.voiceButton) {
      this.elements.voiceButton.addEventListener('click', this.handleVoiceClick.bind(this));
    }

    // Setup send button
    if (this.elements.sendButton) {
      this.elements.sendButton.addEventListener('click', this.handleSendClick.bind(this));
    }
  }

  // Global click handler with delegation
  handleGlobalClick(event) {
    const target = event.target;
    
    if (target.matches('.quick-chip')) {
      this.handleChipClick(target.textContent);
    } else if (target.matches('.theme-toggle')) {
      this.handleThemeToggle();
    } else if (target.matches('.feature-trigger')) {
      this.loadFeatureOnDemand(target.dataset.feature);
    }
  }

  // Global keydown handler
  handleGlobalKeydown(event) {
    if (event.key === 'Enter' && !event.shiftKey && event.target === this.elements.messageInput) {
      event.preventDefault();
      this.handleSendClick();
    }
  }

  // Handle input change with debouncing
  handleInputChange(event) {
    const value = event.target.value;
    
    // Load streaming modules if user starts typing
    if (value.length > 0 && !this.streamingClient) {
      this.loadStreamingModules();
    }
  }

  // Load streaming modules on demand
  async loadStreamingModules() {
    try {
      const [streamingClient, streamingUI] = await Promise.all([
        loadModule('streaming-client'),
        loadModule('streaming-ui')
      ]);
      
      this.streamingClient = streamingClient.default || streamingClient;
      this.streamingUI = streamingUI.default || streamingUI;
      
      if (this.streamingClient && this.streamingUI) {
        this.useStreaming = true;
        this.setupStreamingListeners();
        logger.log('[ZantaraApp] Streaming modules loaded');
      }
    } catch (error) {
      logger.warn('[ZantaraApp] Failed to load streaming modules:', error);
    }
  }

  // Setup streaming listeners (only when modules are loaded)
  setupStreamingListeners() {
    if (!this.streamingClient) return;

    this.streamingClient.on('start', (data) => {
      logger.log('[Streaming] Started', data);
      this.hideTypingIndicator();
    });

    this.streamingClient.on('delta', (data) => {
      this.handleStreamingDelta(data);
    });

    this.streamingClient.on('final', (data) => {
      this.handleStreamingFinal(data);
    });
  }

  // Handle streaming delta efficiently
  handleStreamingDelta(data) {
    const container = this.elements.messagesContainer;
    if (!container) return;

    let messageEl = container.querySelector('[data-streaming="true"] .message-content');
    if (!messageEl) {
      messageEl = this.createStreamingMessage();
    }

    if (this.streamingUI) {
      this.streamingUI.appendDelta(data.content, messageEl);
    }
    
    // Efficient scrolling
    this.scrollToBottom();
  }

  // Handle streaming final
  handleStreamingFinal(data) {
    const container = this.elements.messagesContainer;
    const messageEl = container?.querySelector('[data-streaming="true"]');
    
    if (messageEl) {
      messageEl.removeAttribute('data-streaming');
    }
    
    logger.log('[Streaming] Complete');
  }

  // Create streaming message efficiently
  createStreamingMessage() {
    const container = this.elements.messagesContainer;
    if (!container) return null;

    const messageDiv = document.createElement('div');
    messageDiv.className = 'message assistant-message';
    messageDiv.setAttribute('data-streaming', 'true');
    
    messageDiv.innerHTML = `
      <div class="message-avatar">
        <img src="zantara_logo_transparent.png" alt="ZANTARA" loading="lazy">
      </div>
      <div class="message-content"></div>
    `;
    
    container.appendChild(messageDiv);
    return messageDiv.querySelector('.message-content');
  }

  // Efficient scrolling
  scrollToBottom() {
    const container = this.elements.messagesContainer;
    if (!container) return;
    
    // Use requestAnimationFrame for smooth scrolling
    requestAnimationFrame(() => {
      container.scrollTop = container.scrollHeight;
    });
  }

  // Handle chip clicks
  handleChipClick(text) {
    if (this.elements.messageInput) {
      this.elements.messageInput.value = text;
      this.elements.messageInput.focus();
    }
  }

  // Handle voice button click
  async handleVoiceClick() {
    // Load speech recognition module on demand
    try {
      const speechModule = await loadModule('speech-recognition');
      if (speechModule) {
        speechModule.toggleRecording();
      }
    } catch (error) {
      logger.warn('Speech recognition not available:', error);
    }
  }

  // Handle send button click
  async handleSendClick() {
    const message = this.elements.messageInput?.value?.trim();
    if (!message) return;

    // Clear input immediately for better UX
    this.elements.messageInput.value = '';
    
    // Add user message
    this.addMessage('user', message);
    
    // Load API client if not loaded
    if (!this.apiClient) {
      try {
        const apiModule = await loadModule('api-client');
        this.apiClient = apiModule.apiClient || apiModule.default;
      } catch (error) {
        logger.error('Failed to load API client:', error);
        return;
      }
    }
    
    // Send message
    this.sendMessage(message);
  }

  // Add message to chat efficiently
  addMessage(type, content) {
    const container = this.elements.messagesContainer;
    if (!container) return;

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;
    
    const avatar = type === 'user' ? 
      '<div class="message-avatar user-avatar">👤</div>' :
      '<div class="message-avatar"><img src="zantara_logo_transparent.png" alt="ZANTARA" loading="lazy"></div>';
    
    messageDiv.innerHTML = `
      ${avatar}
      <div class="message-content">${this.sanitizeHTML(content)}</div>
    `;
    
    container.appendChild(messageDiv);
    this.scrollToBottom();
  }

  // Sanitize HTML content
  sanitizeHTML(html) {
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
  }

  // Send message to API
  async sendMessage(message) {
    try {
      this.showTypingIndicator();
      
      if (this.useStreaming && this.streamingClient) {
        // Use streaming
        await this.streamingClient.sendMessage(message);
      } else {
        // Fallback to regular API
        const response = await this.apiClient.sendMessage(message);
        this.addMessage('assistant', response.data);
      }
    } catch (error) {
      logger.error('Failed to send message:', error);
      this.addMessage('assistant', 'Sorry, I encountered an error. Please try again.');
    } finally {
      this.hideTypingIndicator();
    }
  }

  // Show typing indicator
  showTypingIndicator() {
    const existing = document.querySelector('.typing-indicator');
    if (existing) return;

    const indicator = document.createElement('div');
    indicator.className = 'message assistant-message typing-indicator';
    indicator.innerHTML = `
      <div class="message-avatar">
        <img src="zantara_logo_transparent.png" alt="ZANTARA" loading="lazy">
      </div>
      <div class="message-content">
        <div class="typing-dots">
          <span></span><span></span><span></span>
        </div>
      </div>
    `;
    
    this.elements.messagesContainer?.appendChild(indicator);
    this.scrollToBottom();
  }

  // Hide typing indicator
  hideTypingIndicator() {
    const indicator = document.querySelector('.typing-indicator');
    if (indicator) {
      indicator.remove();
    }
  }

  // Handle theme toggle
  async handleThemeToggle() {
    try {
      const themeModule = await loadModule('theme-switcher');
      if (themeModule) {
        themeModule.toggleTheme();
      }
    } catch (error) {
      logger.warn('Theme switcher not available:', error);
    }
  }

  // Load features on demand
  async loadFeatureOnDemand(featureName) {
    try {
      const feature = await loadModule(featureName);
      if (feature && feature.init) {
        feature.init();
      }
    } catch (error) {
      logger.warn(`Feature ${featureName} not available:`, error);
    }
  }

  // Load additional features on idle
  loadFeaturesOnIdle() {
    const idleFeatures = [
      'feature-discovery',
      'onboarding-system',
      'message-virtualization'
    ];

    idleFeatures.forEach(feature => {
      moduleLoader.loadOnIdle(feature);
    });
  }

  // Debounce utility
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // Cleanup method
  cleanup() {
    // Remove event listeners
    document.removeEventListener('click', this.handleGlobalClick);
    document.removeEventListener('keydown', this.handleGlobalKeydown);
    
    // Cleanup modules
    moduleLoader.clearAll();
    
    // Cleanup performance monitor
    performanceMonitor.cleanup();
  }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.zantaraApp = new ZantaraAppOptimized();
  });
} else {
  window.zantaraApp = new ZantaraAppOptimized();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (window.zantaraApp) {
    window.zantaraApp.cleanup();
  }
});

export default ZantaraAppOptimized;