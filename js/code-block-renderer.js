(function () {
  'use strict';

  const CODE_BLOCK_PATTERN = /```([\w.+-]*)\s*\n([\s\S]*?)```/g;
  const INLINE_CODE_PATTERN = /`([^`]+)`/g;

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  class CodeBlockRenderer {
    constructor() {
      this.messageContainer = document.getElementById('messageSpace');
      if (!this.messageContainer) {
        console.warn('[CodeBlockRenderer] Message container not found');
        return;
      }

      this.observeMessages();
      this.processExistingMessages();
      this.setupCopyHandler();
    }

    observeMessages() {
      this.observer = new MutationObserver((mutations) => {
        for (const mutation of mutations) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach((node) => this.processMessageNode(node));
          }

          if (mutation.type === 'characterData') {
            const parent = mutation.target?.parentElement;
            if (parent) {
              this.processMessageNode(parent);
            }
          }
        }
      });

      this.observer.observe(this.messageContainer, {
        childList: true,
        subtree: true,
        characterData: true,
      });
    }

    processExistingMessages() {
      const nodes = this.messageContainer.querySelectorAll('.message-text');
      nodes.forEach((node) => this.transformNode(node));
    }

    processMessageNode(node) {
      if (!node || node.nodeType !== 1) return;

      if (node.classList.contains('message-text')) {
        this.transformNode(node);
        return;
      }

      const inner = node.querySelectorAll?.('.message-text');
      if (inner && inner.length) {
        inner.forEach((element) => this.transformNode(element));
      }
    }

    transformNode(element) {
      if (!element) return;

      const rawText = element.textContent ?? '';
      if (!rawText.includes('```') && !rawText.includes('`')) {
        element.dataset.codeSource = rawText;
        return;
      }

      const lastSource = element.dataset.codeSource || '';
      if (rawText === lastSource && element.dataset.codeEnhanced === 'true') {
        return;
      }

      element.dataset.codeSource = rawText;

      const markup = this.parseMarkdown(rawText);
      if (!markup) return;

      element.innerHTML = markup;
      element.dataset.codeEnhanced = 'true';
      this.highlightElement(element);
    }

    parseMarkdown(text) {
      let cursor = 0;
      let output = '';
      CODE_BLOCK_PATTERN.lastIndex = 0;
      let match = CODE_BLOCK_PATTERN.exec(text);

      while (match) {
        const [fullMatch, lang, codeBody] = match;
        const preceding = text.slice(cursor, match.index);
        output += this.renderParagraphs(preceding);

        const language = (lang || this.detectLanguage(codeBody)).toLowerCase();
        const cleanedCode = codeBody.replace(/^\n+/, '').replace(/\s+$/, '');
        const blockId = `code-${Date.now()}-${Math.random().toString(16).slice(2)}`;

        output += `
          <div class="code-block-wrapper" data-language="${escapeHtml(language)}">
            <div class="code-block-header">
              <span class="code-language">${escapeHtml(language)}</span>
              <button class="copy-code-btn" type="button" data-target="${blockId}">Copy</button>
            </div>
            <div class="code-block-body">
              <pre id="${blockId}"><code class="language-${escapeHtml(language)}">${escapeHtml(cleanedCode)}</code></pre>
            </div>
          </div>
        `;

        cursor = match.index + fullMatch.length;
        match = CODE_BLOCK_PATTERN.exec(text);
      }

      const tail = text.slice(cursor);
      output += this.renderParagraphs(tail);

      return output.trim();
    }

    renderParagraphs(source) {
      if (!source) return '';

      const segments = source.split(/\n{2,}/).map((segment) => segment.trim()).filter(Boolean);
      if (!segments.length) return '';

      return segments
        .map((segment) => {
          const escaped = escapeHtml(segment).replace(/\n/g, '<br>');
          return `<p class="code-block-paragraph">${escaped.replace(INLINE_CODE_PATTERN, (_, code) => `<code>${escapeHtml(code)}</code>`)}</p>`;
        })
        .join('');
    }

    detectLanguage(snippet) {
      const sample = snippet.trim();

      if (/^#!/.test(sample)) return 'bash';
      if (/^\s*</.test(sample) && />\s*$/.test(sample)) return 'markup';
      if (/import\s+\w+\s+from\s+['"`]/.test(sample) || /const\s+\w+\s*=/.test(sample)) return 'javascript';
      if (/function\s+\w+\s*\(/.test(sample) || /=>\s*\{/.test(sample)) return 'javascript';
      if (/def\s+\w+\s*\(/.test(sample) || /self\./.test(sample)) return 'python';
      if (/class\s+\w+\s*\{/.test(sample)) return 'typescript';
      if (/public\s+class\s+\w+/.test(sample)) return 'java';
      if (/SELECT\s+.+\s+FROM/i.test(sample)) return 'sql';
      if (/package\s+main/.test(sample) || /fmt\.Print/.test(sample)) return 'go';
      if (sample.includes('{') && sample.includes('}')) return 'javascript';
      return 'plaintext';
    }

    highlightElement(element) {
      if (!globalThis.Prism || typeof globalThis.Prism.highlightAllUnder !== 'function') {
        setTimeout(() => this.highlightElement(element), 60);
        return;
      }

      try {
        globalThis.Prism.highlightAllUnder(element);
      } catch (error) {
        console.warn('[CodeBlockRenderer] Prism highlight failed:', error);
      }
    }

    setupCopyHandler() {
      document.addEventListener('click', async (event) => {
        const button = event.target.closest('.copy-code-btn');
        if (!button) return;

        const targetId = button.dataset.target;
        const pre = document.getElementById(targetId);
        if (!pre) return;

        const code = pre.textContent || '';
        if (!code) return;

        try {
          await navigator.clipboard.writeText(code);
          this.flashCopyState(button);
        } catch (error) {
          console.warn('[CodeBlockRenderer] Clipboard API unavailable, fallback engaged', error);
          this.fallbackCopy(code, button);
        }
      });
    }

    flashCopyState(button) {
      button.classList.add('is-copied');
      const originalLabel = button.textContent;
      button.textContent = 'Copied!';

      setTimeout(() => {
        button.classList.remove('is-copied');
        button.textContent = originalLabel;
      }, 1800);
    }

    fallbackCopy(text, button) {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'absolute';
      textarea.style.left = '-9999px';
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand('copy');
        this.flashCopyState(button);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  function bootstrap() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => new CodeBlockRenderer());
    } else {
      new CodeBlockRenderer();
    }
  }

  bootstrap();
})();
