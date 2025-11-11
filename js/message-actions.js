(function () {
  'use strict';

  const ACTION_COPY = 'copy';
  const ACTION_REGENERATE = 'regenerate';
  const ACTION_EDIT = 'edit';

  class MessageActionsManager {
    constructor() {
      this.container = document.getElementById('messageSpace');
      this.composer = document.getElementById('messageInput');
      this.sendFn = typeof window.sendMessage === 'function' ? window.sendMessage : null;
      this.notify = typeof window.showNotification === 'function' ? window.showNotification : null;

      if (!this.container) {
        console.warn('[MessageActions] messageSpace not found, skipping setup');
        return;
      }

      this.observeMessages();
      this.decorateExistingMessages();
      this.bindActions();
    }

    observeMessages() {
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => this.decorateNode(node));
          }

          if (mutation.type === 'attributes' && mutation.target?.classList?.contains('message')) {
            this.decorateMessage(mutation.target, { force: true });
          }
        }
      });

      this.observer.observe(this.container, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    decorateExistingMessages() {
      const messages = this.container.querySelectorAll('.message');
      messages.forEach((message) => this.decorateMessage(message));
    }

    decorateNode(node) {
      if (!node || node.nodeType !== 1) return;

      if (node.classList.contains('message')) {
        this.decorateMessage(node);
        return;
      }

      const innerMessages = node.querySelectorAll?.('.message');
      if (innerMessages && innerMessages.length) {
        innerMessages.forEach((message) => this.decorateMessage(message));
      }
    }

    decorateMessage(messageEl, { force = false } = {}) {
      if (!messageEl) return;
      if (messageEl.classList.contains('typing') || messageEl.classList.contains('live-message')) {
        if (force && messageEl.dataset.actionsAttached === 'true') {
          this.removeActions(messageEl);
        }
        return;
      }

      if (!force && messageEl.dataset.actionsAttached === 'true') return;

      const contentEl = messageEl.querySelector('.message-content');
      if (!contentEl) return;

      const messageType = this.getMessageType(messageEl);
      if (!messageType) return;

      const actions = this.buildActionsForType(messageType);
      if (!actions.length) return;

      this.removeActions(messageEl);

      const actionsEl = document.createElement('div');
      actionsEl.className = 'message-actions';

      actions.forEach(({ action, icon, label }) => {
        const button = document.createElement('button');
        button.className = 'message-action-btn';
        button.type = 'button';
        button.dataset.action = action;
        button.innerHTML = `<span class="action-icon">${icon}</span><span>${label}</span>`;
        actionsEl.appendChild(button);
      });

      contentEl.appendChild(actionsEl);
      messageEl.dataset.actionsAttached = 'true';
    }

    removeActions(messageEl) {
      const existing = messageEl.querySelector('.message-actions');
      if (existing) {
        existing.remove();
      }
      messageEl.dataset.actionsAttached = 'false';
    }

    bindActions() {
      this.container.addEventListener('click', async (event) => {
        const button = event.target.closest('.message-action-btn');
        if (!button) return;

        const messageEl = button.closest('.message');
        if (!messageEl) return;

        const action = button.dataset.action;
        if (!action) return;

        try {
          switch (action) {
            case ACTION_COPY:
              await this.handleCopy(messageEl, button);
              break;
            case ACTION_REGENERATE:
              await this.handleRegenerate(messageEl, button);
              break;
            case ACTION_EDIT:
              this.handleEdit(messageEl);
              break;
            default:
              break;
          }
        } catch (error) {
          console.error('[MessageActions] Action failed:', error);
          this.notify?.('Action failed. Please try again.', 'error');
        }
      });
    }

    buildActionsForType(type) {
      const base = [{ action: ACTION_COPY, icon: '📋', label: 'Copy' }];

      if (type === 'ai') {
        base.push({ action: ACTION_REGENERATE, icon: '🔄', label: 'Regenerate' });
      }

      if (type === 'user') {
        base.push({ action: ACTION_EDIT, icon: '✏️', label: 'Edit' });
      }

      return base;
    }

    getMessageType(messageEl) {
      if (messageEl.classList.contains('user')) return 'user';
      if (messageEl.classList.contains('ai')) return 'ai';
      if (messageEl.classList.contains('system')) return 'system';
      return null;
    }

    async handleCopy(messageEl, button) {
      const text = this.extractPlainText(messageEl);
      if (!text) {
        this.notify?.('Nothing to copy from this message.', 'warning');
        return;
      }

      await navigator.clipboard.writeText(text);
      this.flashButtonState(button, 'Copied!', { temporaryOnly: true });
    }

    async handleRegenerate(messageEl, button) {
      if (!this.sendFn) {
        this.notify?.('Regenerate is unavailable right now.', 'warning');
        return;
      }

      const previousUser = this.findPreviousUserMessage(messageEl);
      const content = previousUser ? this.extractPlainText(previousUser) : null;

      if (!content) {
        this.notify?.('No previous user message found to regenerate.', 'warning');
        return;
      }

      const originalMarkup = button.innerHTML;
      button.classList.add('is-busy');
      button.innerHTML = `<span class="action-icon">⏳</span><span>Regenerating…</span>`;

      try {
        await Promise.resolve(this.sendFn(content));
        this.notify?.('Regenerating reply…', 'info');
      } finally {
        button.classList.remove('is-busy');
        button.innerHTML = originalMarkup;
      }
    }

    handleEdit(messageEl) {
      if (!this.composer) {
        this.notify?.('Composer not available.', 'warning');
        return;
      }

      const text = this.extractPlainText(messageEl);
      if (!text) return;

      this.composer.value = text;
      this.composer.dispatchEvent(new Event('input', { bubbles: true }));
      this.composer.focus();
      this.composer.setSelectionRange(text.length, text.length);

      this.notify?.('Message moved to composer. Edit and press Enter to resend.', 'info');
    }

    extractPlainText(messageEl) {
      const textEl = messageEl.querySelector('.message-text');
      if (!textEl) return '';

      const clone = textEl.cloneNode(true);
      clone.querySelectorAll('.copy-code-btn').forEach((btn) => btn.remove());
      clone.querySelectorAll('.code-block-header').forEach((header) => header.remove());

      return clone.innerText.trim();
    }

    findPreviousUserMessage(messageEl) {
      let pointer = messageEl.previousElementSibling;
      while (pointer) {
        if (pointer.classList.contains('user')) {
          return pointer;
        }
        pointer = pointer.previousElementSibling;
      }
      return null;
    }

    flashButtonState(button, label, { temporaryOnly = false } = {}) {
      const original = button.innerHTML;
      button.innerHTML = `<span class="action-icon">✅</span><span>${label}</span>`;

      if (temporaryOnly) {
        setTimeout(() => {
          button.innerHTML = original;
        }, 1600);
      }
    }
  }

  function bootstrap() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new MessageActionsManager());
    } else {
      new MessageActionsManager();
    }
  }

  bootstrap();
})();
