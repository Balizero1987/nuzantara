/**
 * ZANTARA Theme Selector Component
 * Advanced theme customization:
 * - Light / Dark / Auto (system) modes
 * - Accent color picker
 * - Font size selection (Small, Medium, Large)
 * - Preview before apply
 * - Smooth transitions
 * - Persistent preferences
 */

class ZantaraThemeSelector {
  constructor(config = {}) {
    this.storageKeys = {
      theme: 'zantara-theme',
      accentColor: 'zantara-accent-color',
      fontSize: 'zantara-font-size',
      autoMode: 'zantara-auto-mode'
    };

    this.defaults = {
      theme: 'night',
      accentColor: '#E94D35',
      fontSize: 'medium',
      autoMode: false
    };

    this.fontSizes = {
      small: '14px',
      medium: '15px',
      large: '16px'
    };

    // DOM elements
    this.settingsBtn = null;
    this.settingsPanel = null;

    this.init();
  }

  /**
   * Initialize theme selector
   */
  init() {
    this.loadPreferences();
    this.createSettingsPanel();
    this.applyTheme();
    this.setupSystemThemeListener();
    this.setupSettingsButton();
  }

  /**
   * Create settings button in header
   */
  setupSettingsButton() {
    const header = document.querySelector('.chat-header');
    if (!header) return;

    // Check if button already exists
    if (document.getElementById('themeSettingsBtn')) return;

    // Create settings button
    const settingsBtn = document.createElement('button');
    settingsBtn.id = 'themeSettingsBtn';
    settingsBtn.className = 'theme-settings-btn';
    settingsBtn.setAttribute('aria-label', 'Theme settings');
    settingsBtn.setAttribute('title', 'Theme settings');
    settingsBtn.innerHTML = '⚙️';

    // Position it near the logo
    const userInfo = document.getElementById('userInfo');
    if (userInfo) {
      userInfo.insertAdjacentElement('beforebegin', settingsBtn);
    }

    this.settingsBtn = settingsBtn;

    // Toggle panel on click
    settingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePanel();
    });
  }

  /**
   * Create settings panel
   */
  createSettingsPanel() {
    // Check if panel already exists
    if (document.getElementById('themeSettingsPanel')) {
      this.settingsPanel = document.getElementById('themeSettingsPanel');
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'themeSettingsPanel';
    panel.className = 'theme-settings-panel hidden';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-label', 'Theme settings');
    panel.setAttribute('aria-hidden', 'true');

    panel.innerHTML = `
      <div class="theme-settings-header">
        <h3>Theme Settings</h3>
        <button class="theme-settings-close" aria-label="Close settings">✕</button>
      </div>

      <div class="theme-settings-content">
        <!-- Theme Mode -->
        <div class="theme-setting-group">
          <label class="theme-setting-label">Theme Mode</label>
          <div class="theme-mode-options">
            <button class="theme-mode-btn" data-theme="day" aria-label="Light theme">
              <span class="theme-mode-icon">☀️</span>
              <span class="theme-mode-text">Light</span>
            </button>
            <button class="theme-mode-btn" data-theme="night" aria-label="Dark theme">
              <span class="theme-mode-icon">🌙</span>
              <span class="theme-mode-text">Dark</span>
            </button>
            <button class="theme-mode-btn" data-theme="auto" aria-label="Auto theme">
              <span class="theme-mode-icon">🔄</span>
              <span class="theme-mode-text">Auto</span>
            </button>
          </div>
        </div>

        <!-- Accent Color -->
        <div class="theme-setting-group">
          <label class="theme-setting-label">Accent Color</label>
          <div class="accent-color-picker">
            <input type="color" id="accentColorInput" value="${this.defaults.accentColor}" aria-label="Choose accent color">
            <div class="accent-color-presets">
              <button class="accent-preset" data-color="#E94D35" style="background: #E94D35" aria-label="Red accent"></button>
              <button class="accent-preset" data-color="#D4AF37" style="background: #D4AF37" aria-label="Gold accent"></button>
              <button class="accent-preset" data-color="#3B82F6" style="background: #3B82F6" aria-label="Blue accent"></button>
              <button class="accent-preset" data-color="#10B981" style="background: #10B981" aria-label="Green accent"></button>
              <button class="accent-preset" data-color="#8B5CF6" style="background: #8B5CF6" aria-label="Purple accent"></button>
              <button class="accent-preset" data-color="#F59E0B" style="background: #F59E0B" aria-label="Orange accent"></button>
            </div>
          </div>
        </div>

        <!-- Font Size -->
        <div class="theme-setting-group">
          <label class="theme-setting-label">Font Size</label>
          <div class="font-size-options">
            <button class="font-size-btn" data-size="small" aria-label="Small font size">
              <span class="font-size-label">A</span>
              <span class="font-size-text">Small</span>
            </button>
            <button class="font-size-btn" data-size="medium" aria-label="Medium font size">
              <span class="font-size-label" style="font-size: 1.1em">A</span>
              <span class="font-size-text">Medium</span>
            </button>
            <button class="font-size-btn" data-size="large" aria-label="Large font size">
              <span class="font-size-label" style="font-size: 1.2em">A</span>
              <span class="font-size-text">Large</span>
            </button>
          </div>
        </div>

        <!-- Preview Info -->
        <div class="theme-preview-info">
          <p>Changes apply immediately</p>
        </div>

        <!-- Reset Button -->
        <button class="theme-reset-btn">Reset to Defaults</button>
      </div>
    `;

    document.body.appendChild(panel);
    this.settingsPanel = panel;

    // Setup event listeners
    this.setupPanelListeners();
  }

  /**
   * Setup panel event listeners
   */
  setupPanelListeners() {
    if (!this.settingsPanel) return;

    // Close button
    const closeBtn = this.settingsPanel.querySelector('.theme-settings-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closePanel());
    }

    // Theme mode buttons
    this.settingsPanel.querySelectorAll('.theme-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const theme = btn.dataset.theme;
        this.setThemeMode(theme);
      });
    });

    // Accent color picker
    const colorInput = this.settingsPanel.querySelector('#accentColorInput');
    if (colorInput) {
      colorInput.addEventListener('input', (e) => {
        this.setAccentColor(e.target.value);
      });
    }

    // Accent color presets
    this.settingsPanel.querySelectorAll('.accent-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const color = btn.dataset.color;
        this.setAccentColor(color);
        if (colorInput) colorInput.value = color;
      });
    });

    // Font size buttons
    this.settingsPanel.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const size = btn.dataset.size;
        this.setFontSize(size);
      });
    });

    // Reset button
    const resetBtn = this.settingsPanel.querySelector('.theme-reset-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', () => this.resetToDefaults());
    }

    // Close on outside click
    document.addEventListener('click', (e) => {
      if (this.settingsPanel &&
          !this.settingsPanel.contains(e.target) &&
          this.settingsBtn &&
          !this.settingsBtn.contains(e.target) &&
          !this.settingsPanel.classList.contains('hidden')) {
        this.closePanel();
      }
    });

    // Close on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.settingsPanel.classList.contains('hidden')) {
        this.closePanel();
      }
    });
  }

  /**
   * Toggle settings panel
   */
  togglePanel() {
    if (!this.settingsPanel) return;

    const isHidden = this.settingsPanel.classList.contains('hidden');

    if (isHidden) {
      this.openPanel();
    } else {
      this.closePanel();
    }
  }

  /**
   * Open settings panel
   */
  openPanel() {
    if (!this.settingsPanel) return;

    this.settingsPanel.classList.remove('hidden');
    this.settingsPanel.setAttribute('aria-hidden', 'false');

    // Update active states
    this.updateActiveStates();

    // Focus close button
    const closeBtn = this.settingsPanel.querySelector('.theme-settings-close');
    if (closeBtn) {
      setTimeout(() => closeBtn.focus(), 100);
    }
  }

  /**
   * Close settings panel
   */
  closePanel() {
    if (!this.settingsPanel) return;

    this.settingsPanel.classList.add('hidden');
    this.settingsPanel.setAttribute('aria-hidden', 'true');
  }

  /**
   * Update active states in panel
   */
  updateActiveStates() {
    if (!this.settingsPanel) return;

    // Theme mode
    const currentTheme = localStorage.getItem(this.storageKeys.autoMode) === 'true'
      ? 'auto'
      : localStorage.getItem(this.storageKeys.theme) || this.defaults.theme;

    this.settingsPanel.querySelectorAll('.theme-mode-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.theme === currentTheme);
    });

    // Font size
    const currentSize = localStorage.getItem(this.storageKeys.fontSize) || this.defaults.fontSize;

    this.settingsPanel.querySelectorAll('.font-size-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.size === currentSize);
    });
  }

  /**
   * Set theme mode
   */
  setThemeMode(mode) {
    console.log(`🎨 Setting theme mode: ${mode}`);

    if (mode === 'auto') {
      localStorage.setItem(this.storageKeys.autoMode, 'true');
      this.applySystemTheme();
    } else {
      localStorage.setItem(this.storageKeys.autoMode, 'false');
      localStorage.setItem(this.storageKeys.theme, mode);
      this.applyTheme(mode);
    }

    this.updateActiveStates();
  }

  /**
   * Set accent color
   */
  setAccentColor(color) {
    console.log(`🎨 Setting accent color: ${color}`);

    localStorage.setItem(this.storageKeys.accentColor, color);
    this.applyAccentColor(color);
  }

  /**
   * Set font size
   */
  setFontSize(size) {
    console.log(`🎨 Setting font size: ${size}`);

    localStorage.setItem(this.storageKeys.fontSize, size);
    this.applyFontSize(size);
    this.updateActiveStates();
  }

  /**
   * Apply theme
   */
  applyTheme(theme = null) {
    const themeToApply = theme || localStorage.getItem(this.storageKeys.theme) || this.defaults.theme;

    // Apply with transition
    document.documentElement.classList.add('theme-transitioning');
    document.documentElement.setAttribute('data-theme', themeToApply);
    document.body.setAttribute('data-theme', themeToApply);

    // Remove transition class after animation
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 300);

    console.log(`✅ Theme applied: ${themeToApply}`);
  }

  /**
   * Apply accent color
   */
  applyAccentColor(color) {
    document.documentElement.style.setProperty('--accent-color', color);
    console.log(`✅ Accent color applied: ${color}`);
  }

  /**
   * Apply font size
   */
  applyFontSize(size) {
    const fontSize = this.fontSizes[size] || this.fontSizes.medium;
    document.documentElement.style.setProperty('--base-font-size', fontSize);

    // Update message text size
    document.documentElement.style.setProperty('--message-font-size', fontSize);

    console.log(`✅ Font size applied: ${size} (${fontSize})`);
  }

  /**
   * Load saved preferences
   */
  loadPreferences() {
    // Auto mode check
    const autoMode = localStorage.getItem(this.storageKeys.autoMode) === 'true';

    if (autoMode) {
      this.applySystemTheme();
    } else {
      const savedTheme = localStorage.getItem(this.storageKeys.theme) || this.defaults.theme;
      this.applyTheme(savedTheme);
    }

    // Accent color
    const savedAccent = localStorage.getItem(this.storageKeys.accentColor) || this.defaults.accentColor;
    this.applyAccentColor(savedAccent);

    // Font size
    const savedSize = localStorage.getItem(this.storageKeys.fontSize) || this.defaults.fontSize;
    this.applyFontSize(savedSize);

    console.log('✅ Theme preferences loaded');
  }

  /**
   * Setup system theme listener
   */
  setupSystemThemeListener() {
    if (!window.matchMedia) return;

    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');

    darkModeQuery.addEventListener('change', (e) => {
      const autoMode = localStorage.getItem(this.storageKeys.autoMode) === 'true';
      if (autoMode) {
        this.applySystemTheme();
      }
    });
  }

  /**
   * Apply system theme
   */
  applySystemTheme() {
    if (!window.matchMedia) return;

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'night' : 'day';

    this.applyTheme(theme);
    console.log(`✅ System theme applied: ${theme}`);
  }

  /**
   * Reset to defaults
   */
  resetToDefaults() {
    console.log('🔄 Resetting to defaults...');

    localStorage.setItem(this.storageKeys.theme, this.defaults.theme);
    localStorage.setItem(this.storageKeys.accentColor, this.defaults.accentColor);
    localStorage.setItem(this.storageKeys.fontSize, this.defaults.fontSize);
    localStorage.setItem(this.storageKeys.autoMode, 'false');

    this.applyTheme(this.defaults.theme);
    this.applyAccentColor(this.defaults.accentColor);
    this.applyFontSize(this.defaults.fontSize);

    // Update color picker
    const colorInput = this.settingsPanel?.querySelector('#accentColorInput');
    if (colorInput) {
      colorInput.value = this.defaults.accentColor;
    }

    this.updateActiveStates();

    console.log('✅ Reset to defaults complete');
  }

  /**
   * Public API: Get current theme
   */
  getCurrentTheme() {
    return document.body.getAttribute('data-theme') || this.defaults.theme;
  }

  /**
   * Public API: Get current accent color
   */
  getCurrentAccentColor() {
    return localStorage.getItem(this.storageKeys.accentColor) || this.defaults.accentColor;
  }

  /**
   * Public API: Get current font size
   */
  getCurrentFontSize() {
    return localStorage.getItem(this.storageKeys.fontSize) || this.defaults.fontSize;
  }
}

// Initialize theme selector when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ZANTARA_THEME_SELECTOR = new ZantaraThemeSelector();
  });
} else {
  window.ZANTARA_THEME_SELECTOR = new ZantaraThemeSelector();
}

// Extend existing ZantaraTheme API
if (window.ZantaraTheme) {
  window.ZantaraTheme.selector = () => window.ZANTARA_THEME_SELECTOR;
}

export default ZantaraThemeSelector;
