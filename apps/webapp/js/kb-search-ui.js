/**
 * Knowledge Base Search UI
 * Interface for searching Zantara's RAG knowledge base
 *
 * Features:
 * - Search across 14 collections
 * - Collection filter dropdown
 * - Real-time results display
 * - Confidence scoring
 * - Responsive design
 */

class KnowledgeBaseSearchUI {
  constructor() {
    this.ragClient = window.RAG_CLIENT;
    this.container = null;
    this.isVisible = false;
    this.currentResults = null;
  }

  /**
   * Initialize the KB search interface
   */
  init(containerId = 'kb-search-container') {
    this.container = document.getElementById(containerId);

    if (!this.container) {
      // Create container if doesn't exist
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'kb-search-container';

      // Add to page
      const chatContainer = document.querySelector('.chat-container') || document.querySelector('.messages-container');
      if (chatContainer && chatContainer.parentNode) {
        chatContainer.parentNode.insertBefore(this.container, chatContainer);
      } else {
        document.body.appendChild(this.container);
      }
    }

    this.render();

    console.log('✅ [KBSearchUI] Initialized');
  }

  /**
   * Render the search interface
   */
  render() {
    if (!this.container) return;

    const collections = this.ragClient.getCollections();

    const html = `
      <div class="kb-search-panel ${this.isVisible ? 'visible' : 'hidden'}">
        <div class="kb-search-header">
          <h3>🔍 Knowledge Base Search</h3>
          <button class="kb-search-toggle" onclick="window.KB_SEARCH.toggle()">
            ${this.isVisible ? '−' : '+'}
          </button>
        </div>

        ${this.isVisible ? `
          <div class="kb-search-content">
            <div class="kb-search-box">
              <input
                type="text"
                id="kb-query-input"
                class="kb-query-input"
                placeholder="Search visa rules, pricing, KBLI codes..."
                onkeypress="if(event.key==='Enter') window.KB_SEARCH.performSearch()"
              />

              <select id="kb-collection-select" class="kb-collection-select">
                <option value="">Auto-detect collection</option>
                ${collections.map(c => `
                  <option value="${c.id}">${c.icon} ${c.name}</option>
                `).join('')}
              </select>

              <button class="kb-search-btn" onclick="window.KB_SEARCH.performSearch()">
                Search
              </button>
            </div>

            <div id="kb-search-results" class="kb-search-results">
              ${this.currentResults ? this.renderResults() : `
                <div class="kb-search-empty">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                  <p>Enter a query to search the knowledge base</p>
                  <small>14 collections • ${this.ragClient.getStats().cached_queries} cached queries</small>
                </div>
              `}
            </div>
          </div>
        ` : ''}
      </div>
    `;

    this.container.innerHTML = html;
  }

  /**
   * Perform search
   */
  async performSearch() {
    const queryInput = document.getElementById('kb-query-input');
    const collectionSelect = document.getElementById('kb-collection-select');
    const resultsDiv = document.getElementById('kb-search-results');

    if (!queryInput || !resultsDiv) return;

    const query = queryInput.value.trim();
    if (!query) {
      alert('Please enter a search query');
      return;
    }

    const collection = collectionSelect ? collectionSelect.value : null;

    // Show loading
    resultsDiv.innerHTML = `
      <div class="kb-search-loading">
        <div class="loading-spinner"></div>
        <p>Searching knowledge base...</p>
      </div>
    `;

    try {
      console.log(`🔍 [KBSearchUI] Searching for: "${query}"`);

      this.currentResults = await this.ragClient.search(query, {
        collection: collection || null,
        limit: 10
      });

      this.render();

      // Focus on results
      setTimeout(() => {
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 100);
    } catch (error) {
      console.error('❌ [KBSearchUI] Search failed:', error);
      resultsDiv.innerHTML = `
        <div class="kb-search-error">
          <p>❌ Search failed</p>
          <small>${this.escapeHtml(error.message)}</small>
        </div>
      `;
    }
  }

  /**
   * Render search results
   */
  renderResults() {
    if (!this.currentResults || this.currentResults.total === 0) {
      return `
        <div class="kb-search-no-results">
          <p>No results found</p>
          <small>Try different keywords or select a specific collection</small>
        </div>
      `;
    }

    const collectionInfo = this.ragClient.getCollection(this.currentResults.collection);
    const collectionName = collectionInfo ? collectionInfo.name : this.currentResults.collection;
    const collectionIcon = collectionInfo ? collectionInfo.icon : '📚';

    return `
      <div class="kb-results-header">
        <div class="kb-results-meta">
          <span class="kb-results-count">${this.currentResults.total} results</span>
          <span class="kb-results-collection">${collectionIcon} ${collectionName}</span>
          <span class="kb-results-confidence">Confidence: ${Math.round(this.currentResults.confidence * 100)}%</span>
        </div>
      </div>

      <div class="kb-results-list">
        ${this.currentResults.results.map((result, index) => this.renderResult(result, index)).join('')}
      </div>
    `;
  }

  /**
   * Render a single result
   */
  renderResult(result, index) {
    const title = result.metadata?.title || result.metadata?.source || `Document ${index + 1}`;
    const text = result.text || result.content || '';
    const score = result.score || result.distance || 0;
    const category = result.metadata?.category || result.metadata?.tier || '';

    return `
      <div class="kb-result">
        <div class="kb-result-header">
          <span class="kb-result-number">${index + 1}</span>
          <span class="kb-result-title">${this.escapeHtml(title)}</span>
          <span class="kb-result-score">${Math.round(score * 100)}% match</span>
        </div>
        <div class="kb-result-content">
          ${this.escapeHtml(text.substring(0, 300))}${text.length > 300 ? '...' : ''}
        </div>
        ${category ? `
          <div class="kb-result-meta">
            <span class="kb-result-category">${this.escapeHtml(category)}</span>
          </div>
        ` : ''}
      </div>
    `;
  }

  /**
   * Toggle visibility
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
   * Clear results
   */
  clearResults() {
    this.currentResults = null;
    this.render();
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Create global instance
window.KB_SEARCH = new KnowledgeBaseSearchUI();

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.KB_SEARCH.init();
  });
} else {
  window.KB_SEARCH.init();
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KnowledgeBaseSearchUI;
}
