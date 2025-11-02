/**
 * ZANTARA Knowledge Base Search Component
 * Interactive search UI for KB integration
 *
 * Usage:
 * // Initialize search component
 * const searchComponent = new KBSearchComponent('#kb-search-container');
 *
 * // Or auto-initialize on DOM load
 * KBSearchComponent.autoInit();
 */

class KBSearchComponent {
  constructor(containerSelector, options = {}) {
    this.container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!this.container) {
      throw new Error(`KB Search container not found: ${containerSelector}`);
    }

    this.options = {
      placeholder: options.placeholder || 'Search visas, taxes, business setup...',
      showSuggestions: options.showSuggestions !== false,
      maxResults: options.maxResults || 5,
      collections: options.collections || 'all',
      ...options
    };

    this.isSearching = false;
    this.currentQuery = '';
    this.searchTimeout = null;

    this.init();
  }

  init() {
    this.render();
    this.bindEvents();
    console.log('🔍 KB Search Component initialized');
  }

  render() {
    this.container.innerHTML = `
      <div class="kb-search-component">
        <div class="kb-search-header">
          <h3 class="kb-search-title">🧠 Knowledge Base Search</h3>
          <p class="kb-search-subtitle">Search Indonesia visa, tax, and business regulations</p>
        </div>

        <div class="kb-search-form">
          <div class="kb-search-input-wrapper">
            <input
              type="text"
              class="kb-search-input"
              placeholder="${this.options.placeholder}"
              autocomplete="off"
            />
            <button class="kb-search-button" type="button">
              <span class="kb-search-icon">🔍</span>
              <span class="kb-search-spinner" style="display: none;">⏳</span>
            </button>
          </div>

          <div class="kb-search-collections">
            <label class="kb-collection-label">Search in:</label>
            <div class="kb-collection-buttons">
              <button class="kb-collection-btn active" data-collection="all">All</button>
              <button class="kb-collection-btn" data-collection="visa_oracle">Visa</button>
              <button class="kb-collection-btn" data-collection="tax_genius">Tax</button>
              <button class="kb-collection-btn" data-collection="legal_architect">Legal</button>
              <button class="kb-collection-btn" data-collection="kbli_eye">Business</button>
            </div>
          </div>
        </div>

        <div class="kb-search-results" style="display: none;">
          <div class="kb-results-header">
            <h4 class="kb-results-title">Search Results</h4>
            <div class="kb-results-meta">
              <span class="kb-results-count">0 results</span>
              <span class="kb-results-time"></span>
            </div>
          </div>
          <div class="kb-results-list"></div>

          <div class="kb-suggestions" style="display: none;">
            <h5>Suggested Questions:</h5>
            <ul class="kb-suggestions-list"></ul>
          </div>
        </div>

        <div class="kb-search-error" style="display: none;"></div>
      </div>
    `;

    this.addStyles();
  }

  bindEvents() {
    const input = this.container.querySelector('.kb-search-input');
    const button = this.container.querySelector('.kb-search-button');
    const collectionBtns = this.container.querySelectorAll('.kb-collection-btn');

    // Search on input change with debouncing
    input.addEventListener('input', (e) => {
      this.currentQuery = e.target.value;
      clearTimeout(this.searchTimeout);

      if (this.currentQuery.length >= 2) {
        this.searchTimeout = setTimeout(() => {
          this.performSearch();
        }, 300);
      } else {
        this.hideResults();
      }
    });

    // Search on button click
    button.addEventListener('click', () => {
      this.performSearch();
    });

    // Search on Enter key
    input.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.performSearch();
      }
    });

    // Collection selection
    collectionBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        collectionBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.options.collections = btn.dataset.collection;

        if (this.currentQuery.length >= 2) {
          this.performSearch();
        }
      });
    });

    // Close results on outside click
    document.addEventListener('click', (e) => {
      if (!this.container.contains(e.target)) {
        this.hideResults();
      }
    });
  }

  async performSearch() {
    if (!this.currentQuery.trim() || this.isSearching) return;

    this.isSearching = true;
    this.showLoading();

    try {
      const startTime = Date.now();

      // Use ZANTARA_KB service for search
      const results = await ZANTARA_KB.quickSearch(this.currentQuery);
      const executionTime = Date.now() - startTime;

      if (results.success) {
        this.displayResults(results, executionTime);
        this.showSuggestions(this.currentQuery);
      } else {
        this.showError(results.error || 'Search failed');
      }
    } catch (error) {
      console.error('Search error:', error);
      this.showError('Unable to connect to knowledge base');
    } finally {
      this.isSearching = false;
      this.hideLoading();
    }
  }

  displayResults(results, executionTime) {
    const resultsContainer = this.container.querySelector('.kb-search-results');
    const resultsList = this.container.querySelector('.kb-results-list');
    const resultsCount = this.container.querySelector('.kb-results-count');
    const resultsTime = this.container.querySelector('.kb-results-time');

    // Update meta info
    resultsCount.textContent = `${results.total || 0} results`;
    resultsTime.textContent = `(${executionTime}ms)`;

    // Clear and populate results
    resultsList.innerHTML = '';

    if (results.total === 0) {
      resultsList.innerHTML = `
        <div class="kb-no-results">
          <p>No results found for "${results.query}"</p>
          <p>Try different keywords or browse suggested questions below.</p>
        </div>
      `;
    } else {
      const formattedResults = ZANTARA_KB.formatResults(results);
      formattedResults.slice(0, this.options.maxResults).forEach(result => {
        const resultItem = document.createElement('div');
        resultItem.className = 'kb-result-item';
        resultItem.innerHTML = `
          <div class="kb-result-header">
            <h5 class="kb-result-title">${this.escapeHtml(result.title)}</h5>
            <span class="kb-result-score">${(result.score * 100).toFixed(1)}%</span>
          </div>
          <div class="kb-result-content">
            <p class="kb-result-snippet">${this.escapeHtml(result.snippet)}</p>
            <div class="kb-result-meta">
              <span class="kb-result-source">${result.source}</span>
              <span class="kb-result-collection">${result.collection}</span>
            </div>
          </div>
        `;

        resultItem.addEventListener('click', () => {
          this.selectResult(result);
        });

        resultsList.appendChild(resultItem);
      });
    }

    resultsContainer.style.display = 'block';
  }

  showSuggestions(query) {
    if (!this.options.showSuggestions) return;

    const suggestions = ZANTARA_KB.getSuggestedQuestions(query);
    const suggestionsContainer = this.container.querySelector('.kb-suggestions');
    const suggestionsList = this.container.querySelector('.kb-suggestions-list');

    if (suggestions.length > 0) {
      suggestionsList.innerHTML = suggestions
        .map(suggestion => `<li><button class="kb-suggestion-btn">${this.escapeHtml(suggestion)}</button></li>`)
        .join('');

      // Bind suggestion click events
      suggestionsList.querySelectorAll('.kb-suggestion-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const input = this.container.querySelector('.kb-search-input');
          input.value = btn.textContent;
          this.currentQuery = btn.textContent;
          this.performSearch();
        });
      });

      suggestionsContainer.style.display = 'block';
    }
  }

  selectResult(result) {
    console.log('Selected result:', result);

    // Here you can implement what happens when a result is selected:
    // - Show detailed modal
    // - Navigate to a page
    // - Fill a form
    // - Open chat with context

    // For now, just show an alert
    if (confirm(`Would you like to know more about: "${result.title}"?`)) {
      // This could open a detailed view or chat with context
      this.hideResults();
    }
  }

  showLoading() {
    const spinner = this.container.querySelector('.kb-search-spinner');
    const icon = this.container.querySelector('.kb-search-icon');
    const button = this.container.querySelector('.kb-search-button');

    spinner.style.display = 'inline-block';
    icon.style.display = 'none';
    button.disabled = true;
  }

  hideLoading() {
    const spinner = this.container.querySelector('.kb-search-spinner');
    const icon = this.container.querySelector('.kb-search-icon');
    const button = this.container.querySelector('.kb-search-button');

    spinner.style.display = 'none';
    icon.style.display = 'inline-block';
    button.disabled = false;
  }

  showError(message) {
    const errorContainer = this.container.querySelector('.kb-search-error');
    const resultsContainer = this.container.querySelector('.kb-search-results');

    errorContainer.textContent = `❌ ${message}`;
    errorContainer.style.display = 'block';
    resultsContainer.style.display = 'none';

    setTimeout(() => {
      errorContainer.style.display = 'none';
    }, 5000);
  }

  hideResults() {
    const resultsContainer = this.container.querySelector('.kb-search-results');
    const errorContainer = this.container.querySelector('.kb-search-error');

    resultsContainer.style.display = 'none';
    errorContainer.style.display = 'none';
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  addStyles() {
    if (document.getElementById('kb-search-styles')) return;

    const styles = `
      <style id="kb-search-styles">
        .kb-search-component {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background: #f8f9fa;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          max-width: 600px;
          margin: 0 auto;
        }

        .kb-search-header {
          text-align: center;
          margin-bottom: 20px;
        }

        .kb-search-title {
          margin: 0 0 8px 0;
          color: #2c3e50;
          font-size: 24px;
          font-weight: 600;
        }

        .kb-search-subtitle {
          margin: 0;
          color: #6c757d;
          font-size: 14px;
        }

        .kb-search-input-wrapper {
          position: relative;
          display: flex;
          margin-bottom: 15px;
        }

        .kb-search-input {
          flex: 1;
          padding: 12px 16px;
          border: 2px solid #e9ecef;
          border-radius: 8px 0 0 8px;
          font-size: 16px;
          outline: none;
          transition: border-color 0.2s;
        }

        .kb-search-input:focus {
          border-color: #007bff;
        }

        .kb-search-button {
          padding: 12px 16px;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 0 8px 8px 0;
          cursor: pointer;
          font-size: 16px;
          transition: background-color 0.2s;
        }

        .kb-search-button:hover:not(:disabled) {
          background: #0056b3;
        }

        .kb-search-button:disabled {
          background: #6c757d;
          cursor: not-allowed;
        }

        .kb-search-collections {
          margin-bottom: 15px;
        }

        .kb-collection-label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #495057;
        }

        .kb-collection-buttons {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }

        .kb-collection-btn {
          padding: 6px 12px;
          background: #e9ecef;
          border: 1px solid #dee2e6;
          border-radius: 20px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .kb-collection-btn.active,
        .kb-collection-btn:hover {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .kb-search-results {
          background: white;
          border-radius: 8px;
          padding: 16px;
          margin-top: 16px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        .kb-results-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #e9ecef;
        }

        .kb-results-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
        }

        .kb-results-meta {
          font-size: 14px;
          color: #6c757d;
        }

        .kb-results-list {
          max-height: 400px;
          overflow-y: auto;
        }

        .kb-result-item {
          padding: 16px;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          margin-bottom: 12px;
          cursor: pointer;
          transition: all 0.2s;
        }

        .kb-result-item:hover {
          border-color: #007bff;
          box-shadow: 0 2px 8px rgba(0,123,255,0.1);
          transform: translateY(-1px);
        }

        .kb-result-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .kb-result-title {
          margin: 0;
          font-size: 16px;
          font-weight: 600;
          color: #2c3e50;
        }

        .kb-result-score {
          background: #28a745;
          color: white;
          padding: 2px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .kb-result-snippet {
          margin: 0 0 12px 0;
          color: #495057;
          line-height: 1.5;
        }

        .kb-result-meta {
          display: flex;
          gap: 12px;
          font-size: 12px;
          color: #6c757d;
        }

        .kb-no-results {
          text-align: center;
          padding: 40px 20px;
          color: #6c757d;
        }

        .kb-no-results p:first-child {
          margin-top: 0;
          font-weight: 500;
          font-size: 16px;
        }

        .kb-suggestions {
          margin-top: 20px;
          padding-top: 16px;
          border-top: 1px solid #e9ecef;
        }

        .kb-suggestions h5 {
          margin: 0 0 12px 0;
          font-size: 14px;
          font-weight: 600;
          color: #495057;
        }

        .kb-suggestions-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .kb-suggestions-list li {
          margin-bottom: 8px;
        }

        .kb-suggestion-btn {
          width: 100%;
          padding: 8px 12px;
          background: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 6px;
          text-align: left;
          font-size: 14px;
          color: #495057;
          cursor: pointer;
          transition: all 0.2s;
        }

        .kb-suggestion-btn:hover {
          background: #e9ecef;
          border-color: #007bff;
          color: #007bff;
        }

        .kb-search-error {
          background: #f8d7da;
          color: #721c24;
          padding: 12px 16px;
          border-radius: 8px;
          margin-top: 16px;
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .kb-search-component {
            margin: 10px;
            padding: 16px;
          }

          .kb-collection-buttons {
            gap: 4px;
          }

          .kb-collection-btn {
            font-size: 11px;
            padding: 4px 8px;
          }

          .kb-results-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
        }
      </style>
    `;

    document.head.insertAdjacentHTML('beforeend', styles);
  }

  // Static method for auto-initialization
  static autoInit() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        KBSearchComponent.initAll();
      });
    } else {
      KBSearchComponent.initAll();
    }
  }

  static initAll() {
    const containers = document.querySelectorAll('[data-kb-search]');
    containers.forEach(container => {
      const options = container.dataset.kbSearch ?
        JSON.parse(container.dataset.kbSearch) : {};
      new KBSearchComponent(container, options);
    });
  }
}

// Auto-initialize when DOM is ready
if (typeof window !== 'undefined') {
  window.KBSearchComponent = KBSearchComponent;

  // Auto-initialize if data-kb-search attributes are found
  KBSearchComponent.autoInit();

  console.log('✅ KB Search Component library loaded');
}