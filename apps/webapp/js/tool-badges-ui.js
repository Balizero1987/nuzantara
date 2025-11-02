/**
 * Tool Badges UI Component
 * Displays visual feedback when Zantara uses tools
 *
 * Features:
 * - Shows which tools were called
 * - Color-coded by tool category
 * - Tooltips with tool descriptions
 * - Smooth animations
 */

class ToolBadgesUI {
  constructor() {
    this.container = null;
    this.categoryColors = {
      'get': '#3b82f6',      // Blue - read operations
      'search': '#8b5cf6',   // Purple - search operations
      'pricing': '#10b981',  // Green - pricing queries
      'team': '#f59e0b',     // Orange - team operations
      'kbli': '#ec4899',     // Pink - KBLI operations
      'default': '#6b7280'   // Gray - other tools
    };
  }

  /**
   * Initialize the badges container
   */
  init(containerId = 'tool-badges-container') {
    this.container = document.getElementById(containerId);

    if (!this.container) {
      // Create container if it doesn't exist
      this.container = document.createElement('div');
      this.container.id = containerId;
      this.container.className = 'tool-badges-container';

      // Try to add it after the chat messages container
      const messagesContainer = document.querySelector('.messages-container');
      if (messagesContainer && messagesContainer.parentNode) {
        messagesContainer.parentNode.insertBefore(this.container, messagesContainer.nextSibling);
      } else {
        // Fallback: add to body
        document.body.appendChild(this.container);
      }
    }

    console.log('✅ [ToolBadgesUI] Initialized');
  }

  /**
   * Display tool badges for a list of tools
   */
  showTools(toolsUsed) {
    if (!this.container) {
      console.warn('⚠️ [ToolBadgesUI] Container not initialized');
      return;
    }

    if (!toolsUsed || toolsUsed.length === 0) {
      this.hide();
      return;
    }

    console.log(`🔧 [ToolBadgesUI] Displaying ${toolsUsed.length} tools`);

    // Clear previous badges
    this.container.innerHTML = '';

    // Create header
    const header = document.createElement('div');
    header.className = 'tool-badges-header';
    header.textContent = `🔧 Tools Used (${toolsUsed.length})`;
    this.container.appendChild(header);

    // Create badges container
    const badgesWrapper = document.createElement('div');
    badgesWrapper.className = 'tool-badges-wrapper';

    // Create badge for each tool
    toolsUsed.forEach((toolName, index) => {
      const badge = this.createBadge(toolName, index);
      badgesWrapper.appendChild(badge);
    });

    this.container.appendChild(badgesWrapper);

    // Show container with animation
    this.container.style.display = 'block';
    this.container.style.opacity = '0';
    setTimeout(() => {
      this.container.style.opacity = '1';
    }, 10);
  }

  /**
   * Create a single tool badge
   */
  createBadge(toolName, index) {
    const badge = document.createElement('span');
    badge.className = 'tool-badge';

    // Determine color based on tool category
    const category = this.getToolCategory(toolName);
    const color = this.categoryColors[category] || this.categoryColors.default;

    // Set badge style
    badge.style.backgroundColor = `${color}15`;
    badge.style.borderColor = `${color}50`;
    badge.style.color = color;
    badge.style.animationDelay = `${index * 50}ms`;

    // Create badge content
    const icon = this.getToolIcon(category);
    badge.innerHTML = `
      <svg class="tool-icon" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
        <path d="${icon}"/>
      </svg>
      <span class="tool-name">${this.formatToolName(toolName)}</span>
    `;

    // Add tooltip
    badge.title = `Tool: ${toolName}\nCategory: ${category}`;

    // Add click handler to copy tool name
    badge.addEventListener('click', () => {
      navigator.clipboard.writeText(toolName).then(() => {
        const originalBg = badge.style.backgroundColor;
        badge.style.backgroundColor = `${color}30`;
        setTimeout(() => {
          badge.style.backgroundColor = originalBg;
        }, 200);
      });
    });

    return badge;
  }

  /**
   * Get tool category from name
   */
  getToolCategory(toolName) {
    const name = toolName.toLowerCase();

    if (name.startsWith('get_') || name.startsWith('retrieve_')) {
      return 'get';
    }
    if (name.startsWith('search_') || name.includes('search')) {
      return 'search';
    }
    if (name.includes('pricing') || name.includes('price')) {
      return 'pricing';
    }
    if (name.includes('team') || name.includes('member')) {
      return 'team';
    }
    if (name.includes('kbli')) {
      return 'kbli';
    }

    return 'default';
  }

  /**
   * Get SVG icon path for category
   */
  getToolIcon(category) {
    const icons = {
      'get': 'M6 1L2 5h3v6h2V5h3z',          // Download icon
      'search': 'M4.5 2a2.5 2.5 0 100 5 2.5 2.5 0 000-5zM1 4.5a3.5 3.5 0 116.53 1.74l2.87 2.87a.5.5 0 01-.71.71L6.74 7.03A3.5 3.5 0 011 4.5z', // Search icon
      'pricing': 'M6 1a.5.5 0 01.5.5v1h1a.5.5 0 010 1h-1v2h1a.5.5 0 010 1h-1v1a.5.5 0 01-1 0v-1h-1a.5.5 0 010-1h1v-2h-1a.5.5 0 010-1h1v-1A.5.5 0 016 1z', // Dollar icon
      'team': 'M4 6a2 2 0 100-4 2 2 0 000 4zM8 6a2 2 0 100-4 2 2 0 000 4zM1.5 9A1.5 1.5 0 013 7.5h2A1.5 1.5 0 016.5 9v2h-5V9zM7 7.5A1.5 1.5 0 018.5 9v2h-2V9A2.5 2.5 0 004.5 6.5h1A1.5 1.5 0 017 7.5z', // Team icon
      'kbli': 'M2 3a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H3a1 1 0 01-1-1V3zm2 1v4h4V4H4z', // Code icon
      'default': 'M6 2a1 1 0 011 1v2h2a1 1 0 110 2H7v2a1 1 0 11-2 0V7H3a1 1 0 110-2h2V3a1 1 0 011-1z' // Wrench icon
    };

    return icons[category] || icons.default;
  }

  /**
   * Format tool name for display (remove underscores, capitalize)
   */
  formatToolName(toolName) {
    return toolName
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Hide the badges container
   */
  hide() {
    if (this.container) {
      this.container.style.opacity = '0';
      setTimeout(() => {
        this.container.style.display = 'none';
        this.container.innerHTML = '';
      }, 300);
    }
  }

  /**
   * Clear all badges
   */
  clear() {
    this.hide();
  }
}

// Create global instance
window.TOOL_BADGES_UI = new ToolBadgesUI();

// Auto-initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.TOOL_BADGES_UI.init();
  });
} else {
  window.TOOL_BADGES_UI.init();
}

// Listen for tools-used events (can be dispatched from app.js)
window.addEventListener('tools-used', (event) => {
  if (event.detail && event.detail.tools) {
    window.TOOL_BADGES_UI.showTools(event.detail.tools);
  }
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ToolBadgesUI;
}
