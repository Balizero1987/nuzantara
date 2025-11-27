/**
 * ZANTARA Unified Notification System
 *
 * Centralized notification component with consistent styling and behavior.
 * Replaces 3 different implementations across the codebase.
 */

export class NotificationManager {
  constructor() {
    this.notifications = new Map();
    this.maxNotifications = 5;
    this.defaultDuration = 5000;
    this.container = null;

    // Initialize container
    this.initContainer();

    // Add CSS styles
    this.injectStyles();
  }

  /**
   * Initialize notification container
   */
  initContainer() {
    if (document.querySelector('.zantara-notification-container')) {
      this.container = document.querySelector('.zantara-notification-container');
      return;
    }

    this.container = document.createElement('div');
    this.container.className = 'zantara-notification-container';
    document.body.appendChild(this.container);
  }

  /**
   * Show notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type: 'info', 'success', 'warning', 'error'
   * @param {number} duration - Duration in ms (0 = no auto-dismiss)
   * @param {object} options - Additional options
   */
  show(message, type = 'info', duration = null, options = {}) {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Remove oldest if max reached
    if (this.notifications.size >= this.maxNotifications) {
      const firstKey = this.notifications.keys().next().value;
      this.remove(firstKey);
    }

    // Create notification element
    const notification = this.createNotification(id, message, type, options);

    // Add to container
    this.container.appendChild(notification);
    this.notifications.set(id, notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto-dismiss
    const dismissDuration = duration !== null ? duration : this.defaultDuration;
    if (dismissDuration > 0) {
      setTimeout(() => this.remove(id), dismissDuration);
    }

    return id;
  }

  /**
   * Create notification element
   */
  createNotification(id, message, type, options = {}) {
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `zantara-notification zantara-notification-${type}`;

    // Icon based on type
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };

    // Title based on type
    const titles = {
      info: options.title || 'Info',
      success: options.title || 'Success',
      warning: options.title || 'Warning',
      error: options.title || 'Error'
    };

    notification.innerHTML = `
      <div class="notification-content">
        <div class="notification-icon">${icons[type] || icons.info}</div>
        <div class="notification-body">
          <div class="notification-title">${titles[type]}</div>
          <div class="notification-message">${this.escapeHtml(message)}</div>
        </div>
        <button class="notification-close" onclick="window.notificationManager.remove('${id}')">
          ×
        </button>
      </div>
    `;

    return notification;
  }

  /**
   * Remove notification
   */
  remove(id) {
    const notification = this.notifications.get(id);
    if (!notification) return;

    // Fade out animation
    notification.classList.remove('show');
    notification.classList.add('hide');

    // Remove from DOM
    setTimeout(() => {
      if (notification.parentElement) {
        notification.parentElement.removeChild(notification);
      }
      this.notifications.delete(id);
    }, 300);
  }

  /**
   * Remove all notifications
   */
  clear() {
    this.notifications.forEach((_, id) => this.remove(id));
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Inject CSS styles
   */
  injectStyles() {
    if (document.querySelector('#zantara-notification-styles')) return;

    const style = document.createElement('style');
    style.id = 'zantara-notification-styles';
    style.textContent = `
      .zantara-notification-container {
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
        pointer-events: none;
      }

      .zantara-notification {
        background: rgba(43, 43, 43, 0.98);
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        backdrop-filter: blur(10px);
        opacity: 0;
        transform: translateX(450px);
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        pointer-events: auto;
        border-left: 4px solid;
      }

      .zantara-notification.show {
        opacity: 1;
        transform: translateX(0);
      }

      .zantara-notification.hide {
        opacity: 0;
        transform: translateX(450px);
      }

      .zantara-notification-info {
        border-left-color: #3b82f6;
      }

      .zantara-notification-success {
        border-left-color: #10b981;
      }

      .zantara-notification-warning {
        border-left-color: #f59e0b;
      }

      .zantara-notification-error {
        border-left-color: #ef4444;
      }

      .notification-content {
        display: flex;
        align-items: start;
        gap: 12px;
        padding: 16px 20px;
      }

      .notification-icon {
        font-size: 24px;
        line-height: 1;
        flex-shrink: 0;
      }

      .notification-body {
        flex: 1;
        min-width: 0;
      }

      .notification-title {
        font-weight: 600;
        font-size: 15px;
        color: rgba(255, 255, 255, 0.95);
        margin-bottom: 4px;
      }

      .notification-message {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.8);
        line-height: 1.4;
        word-wrap: break-word;
      }

      .notification-close {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        cursor: pointer;
        font-size: 24px;
        padding: 0;
        line-height: 1;
        transition: color 0.2s;
        flex-shrink: 0;
      }

      .notification-close:hover {
        color: rgba(255, 255, 255, 1);
      }

      .notification-close:focus {
        outline: 2px solid rgba(255, 255, 255, 0.5);
        outline-offset: 2px;
        border-radius: 4px;
      }

      /* Mobile responsive */
      @media (max-width: 480px) {
        .zantara-notification-container {
          left: 12px;
          right: 12px;
          bottom: 12px;
          max-width: none;
        }

        .zantara-notification {
          transform: translateY(450px);
        }

        .zantara-notification.show {
          transform: translateY(0);
        }

        .zantara-notification.hide {
          transform: translateY(450px);
        }
      }
    `;
    document.head.appendChild(style);
  }
}

// Create singleton instance
const notificationManager = new NotificationManager();

// Expose globally
if (typeof window !== 'undefined') {
  window.notificationManager = notificationManager;

  // Backward compatibility: expose simple function
  window.showNotification = (message, type = 'info', duration = null) => {
    return notificationManager.show(message, type, duration);
  };
}

// Export for module systems
export default notificationManager;
export { notificationManager };
