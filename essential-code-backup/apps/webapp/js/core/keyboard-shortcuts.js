/**
 * ZANTARA Keyboard Shortcuts Manager
 * Provides global keyboard shortcuts for improved UX
 */

class KeyboardShortcutsManager {
    constructor() {
        this.shortcuts = new Map();
        this.enabled = true;
        this.init();
    }

    init() {
        document.addEventListener('keydown', this.handleKeyDown.bind(this));
        this.registerDefaultShortcuts();
        console.log('⌨️ Keyboard shortcuts initialized');
    }

    /**
     * Register default shortcuts
     */
    registerDefaultShortcuts() {
        // Ctrl/Cmd + K: Quick search
        this.register('k', { ctrl: true }, () => {
            this.openQuickSearch();
        }, 'Quick search');

        // Ctrl/Cmd + D: Toggle dashboard
        this.register('d', { ctrl: true }, () => {
            this.toggleDashboard();
        }, 'Toggle dashboard');

        // Ctrl/Cmd + /: Show help
        this.register('/', { ctrl: true }, () => {
            this.showHelp();
        }, 'Show keyboard shortcuts');

        // Escape: Close modals/sidebars
        this.register('Escape', {}, () => {
            this.closeOverlays();
        }, 'Close overlays');

        // Ctrl/Cmd + N: New conversation
        this.register('n', { ctrl: true }, () => {
            this.newConversation();
        }, 'New conversation');

        // Ctrl/Cmd + S: Save (prevent default)
        this.register('s', { ctrl: true }, (e) => {
            e.preventDefault();
            if (window.toast) {
                window.toast.info('Auto-save is always enabled');
            }
        }, 'Save (auto-save enabled)');
    }

    /**
     * Register a keyboard shortcut
     */
    register(key, modifiers = {}, callback, description = '') {
        const shortcutKey = this.getShortcutKey(key, modifiers);
        this.shortcuts.set(shortcutKey, {
            key,
            modifiers,
            callback,
            description
        });
    }

    /**
     * Handle keydown event
     */
    handleKeyDown(event) {
        if (!this.enabled) return;

        // Don't trigger shortcuts when typing in inputs
        if (this.isInputFocused()) return;

        const shortcutKey = this.getShortcutKey(event.key, {
            ctrl: event.ctrlKey || event.metaKey,
            shift: event.shiftKey,
            alt: event.altKey
        });

        const shortcut = this.shortcuts.get(shortcutKey);
        if (shortcut) {
            event.preventDefault();
            shortcut.callback(event);
        }
    }

    /**
     * Get shortcut key string
     */
    getShortcutKey(key, modifiers) {
        const parts = [];
        if (modifiers.ctrl) parts.push('ctrl');
        if (modifiers.shift) parts.push('shift');
        if (modifiers.alt) parts.push('alt');
        parts.push(key.toLowerCase());
        return parts.join('+');
    }

    /**
     * Check if input is focused
     */
    isInputFocused() {
        const activeElement = document.activeElement;
        return activeElement && (
            activeElement.tagName === 'INPUT' ||
            activeElement.tagName === 'TEXTAREA' ||
            activeElement.isContentEditable
        );
    }

    /**
     * Quick search
     */
    openQuickSearch() {
        const searchInput = document.getElementById('message-search-input');
        if (searchInput) {
            searchInput.focus();
            if (window.toast) {
                window.toast.info('Quick search activated');
            }
        }
    }

    /**
     * Toggle dashboard
     */
    toggleDashboard() {
        const dashboardLink = document.querySelector('a[href*="dashboard"]');
        if (dashboardLink) {
            window.location.href = dashboardLink.href;
        } else {
            window.location.href = '/team-dashboard.html';
        }
    }

    /**
     * Show help
     */
    showHelp() {
        const shortcuts = Array.from(this.shortcuts.values());
        const helpText = shortcuts.map(s => {
            const keys = [];
            if (s.modifiers.ctrl) keys.push('Ctrl');
            if (s.modifiers.shift) keys.push('Shift');
            if (s.modifiers.alt) keys.push('Alt');
            keys.push(s.key.toUpperCase());
            return `${keys.join('+')} - ${s.description}`;
        }).join('\n');

        if (window.toast) {
            window.toast.info(`Keyboard Shortcuts:\n${helpText}`, 10000);
        }
    }

    /**
     * Close overlays
     */
    closeOverlays() {
        // Close modals
        document.querySelectorAll('.modal, .sidebar, .overlay').forEach(el => {
            el.style.display = 'none';
        });

        // Close widgets
        document.querySelectorAll('.client-journey-widget, .collective-insights-sidebar').forEach(el => {
            el.remove();
        });
    }

    /**
     * New conversation
     */
    newConversation() {
        if (typeof window.clearChatHistory === 'function') {
            window.clearChatHistory();
            if (window.toast) {
                window.toast.success('New conversation started');
            }
        }
    }

    /**
     * Enable/disable shortcuts
     */
    setEnabled(enabled) {
        this.enabled = enabled;
    }
}

// Export
if (typeof window !== 'undefined') {
    window.KeyboardShortcutsManager = KeyboardShortcutsManager;
    window.keyboardShortcuts = new KeyboardShortcutsManager();
}

export default KeyboardShortcutsManager;
