/**
 * Memory Panel UI Component
 * Displays and manages user memory (facts, summary, stats)
 *
 * Features:
 * - Display profile facts
 * - Show conversation summary
 * - Display activity counters
 * - Add/delete facts
 * - Auto-refresh
 */

class MemoryPanelUI {
  constructor() {
    this.memoryClient = window.MEMORY_CLIENT;
    this.container = null;
    this.userId = null;
    this.memory = null;
    this.isVisible = false;
  }

  /**
   * Initialize the memory panel
   */
  async init(containerId = 'memory-panel-container') {
    this.container = document.getElementById(containerId);

    if (!this.container) {
      // Create container if it doesn't exist
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'memory-panel-container';

      // Add to page (after chat container if exists)
      const chatContainer = document.querySelector('.chat-container') || document.querySelector('.messages-container');
      if (chatContainer && chatContainer.parentNode) {
        chatContainer.parentNode.insertBefore(this.container, chatContainer.nextSibling);
      } else {
        document.body.appendChild(this.container);
      }
    }

    // Get current user
    this.userId = this.memoryClient.getCurrentUserId();

    // Load and display memory
    await this.loadMemory();

    console.log('✅ [MemoryPanelUI] Initialized');
  }

  /**
   * Load memory from backend
   */
  async loadMemory() {
    if (!this.userId || this.userId === 'anonymous') {
      console.log('ℹ️ [MemoryPanelUI] Skipping load for anonymous user');
      return;
    }

    try {
      this.memory = await this.memoryClient.getMemory(this.userId);
      this.render();
    } catch (error) {
      console.error('❌ [MemoryPanelUI] Failed to load memory:', error);
    }
  }

  /**
   * Render the memory panel
   */
  render() {
    if (!this.memory || !this.container) return;

    const html = `
      <div class="memory-panel ${this.isVisible ? 'visible' : 'hidden'}">
        <div class="memory-panel-header">
          <div class="memory-panel-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 2a6 6 0 100 12A6 6 0 008 2zM7 6.5a1 1 0 112 0v3a1 1 0 11-2 0v-3z"/>
            </svg>
            <span>Your Memory</span>
          </div>
          <button class="memory-panel-toggle" onclick="window.MEMORY_PANEL.toggle()">
            ${this.isVisible ? '−' : '+'}
          </button>
        </div>

        ${this.isVisible ? `
          <div class="memory-panel-content">
            <!-- Stats -->
            <div class="memory-stats">
              <div class="memory-stat">
                <div class="stat-value">${this.memory.counters.conversations || 0}</div>
                <div class="stat-label">Conversations</div>
              </div>
              <div class="memory-stat">
                <div class="stat-value">${this.memory.counters.searches || 0}</div>
                <div class="stat-label">Searches</div>
              </div>
              <div class="memory-stat">
                <div class="stat-value">${this.memory.profile_facts.length}</div>
                <div class="stat-label">Facts</div>
              </div>
            </div>

            <!-- Profile Facts -->
            <div class="memory-section">
              <div class="memory-section-header">
                <h4>Profile Facts</h4>
                <button class="btn-add-fact" onclick="window.MEMORY_PANEL.showAddFactDialog()">
                  + Add
                </button>
              </div>
              <div class="memory-facts-list">
                ${this.memory.profile_facts.length > 0 ?
                  this.memory.profile_facts.map((fact, index) => `
                    <div class="memory-fact" data-index="${index}">
                      <div class="fact-text">${this.escapeHtml(fact)}</div>
                      <button class="btn-delete-fact" onclick="window.MEMORY_PANEL.deleteFact(${index})" title="Delete fact">
                        ×
                      </button>
                    </div>
                  `).join('')
                : '<div class="memory-empty">No facts yet. Add your first fact!</div>'}
              </div>
            </div>

            <!-- Conversation Summary -->
            <div class="memory-section">
              <div class="memory-section-header">
                <h4>Conversation Summary</h4>
                <button class="btn-edit-summary" onclick="window.MEMORY_PANEL.showEditSummaryDialog()">
                  ✎ Edit
                </button>
              </div>
              <div class="memory-summary">
                ${this.memory.summary ?
                  `<p>${this.escapeHtml(this.memory.summary)}</p>`
                : '<p class="memory-empty">No summary yet.</p>'}
              </div>
            </div>

            <!-- Last Updated -->
            <div class="memory-footer">
              <small>Last updated: ${this.formatDate(this.memory.updated_at)}</small>
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Toggle panel visibility
   */
  toggle() {
    this.isVisible = !this.isVisible;
    this.render();
  }

  /**
   * Show panel
   */
  show() {
    this.isVisible = true;
    this.render();
  }

  /**
   * Hide panel
   */
  hide() {
    this.isVisible = false;
    this.render();
  }

  /**
   * Show dialog to add a fact
   */
  showAddFactDialog() {
    const fact = prompt('Enter a new fact about yourself:');
    if (fact && fact.trim()) {
      this.addFact(fact.trim());
    }
  }

  /**
   * Add a fact to memory
   */
  async addFact(fact) {
    try {
      const result = await this.memoryClient.addFact(this.userId, fact);

      if (result.success) {
        console.log('✅ [MemoryPanelUI] Fact added');
        await this.loadMemory();
      } else {
        alert(`Failed to add fact: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [MemoryPanelUI] Add fact failed:', error);
      alert('Failed to add fact. Please try again.');
    }
  }

  /**
   * Delete a fact from memory
   */
  async deleteFact(index) {
    if (!confirm('Delete this fact?')) return;

    try {
      const result = await this.memoryClient.deleteFact(this.userId, index);

      if (result.success) {
        console.log('✅ [MemoryPanelUI] Fact deleted');
        await this.loadMemory();
      } else {
        alert(`Failed to delete fact: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [MemoryPanelUI] Delete fact failed:', error);
      alert('Failed to delete fact. Please try again.');
    }
  }

  /**
   * Show dialog to edit summary
   */
  showEditSummaryDialog() {
    const currentSummary = this.memory.summary || '';
    const newSummary = prompt('Edit conversation summary:', currentSummary);

    if (newSummary !== null) {
      this.updateSummary(newSummary.trim());
    }
  }

  /**
   * Update conversation summary
   */
  async updateSummary(summary) {
    try {
      const result = await this.memoryClient.updateSummary(this.userId, summary);

      if (result.success) {
        console.log('✅ [MemoryPanelUI] Summary updated');
        await this.loadMemory();
      } else {
        alert(`Failed to update summary: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ [MemoryPanelUI] Update summary failed:', error);
      alert('Failed to update summary. Please try again.');
    }
  }

  /**
   * Refresh memory from backend
   */
  async refresh() {
    this.memoryClient.clearCache(this.userId);
    await this.loadMemory();
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    if (!dateString) return 'Never';

    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

      const diffDays = Math.floor(diffHours / 24);
      if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

      return date.toLocaleDateString();
    } catch (e) {
      return dateString;
    }
  }
}

// Create global instance
window.MEMORY_PANEL = new MemoryPanelUI();

// Auto-initialize on page load (if user is logged in)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    const userEmail = localStorage.getItem('zantara-email');
    if (userEmail && userEmail !== 'guest@zantara.com') {
      window.MEMORY_PANEL.init();
    }
  });
} else {
  const userEmail = localStorage.getItem('zantara-email');
  if (userEmail && userEmail !== 'guest@zantara.com') {
    window.MEMORY_PANEL.init();
  }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MemoryPanelUI;
}
