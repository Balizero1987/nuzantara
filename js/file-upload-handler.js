(function () {
  'use strict';

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
  const SUPPORTED_MIME_TYPES = {
    image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    document: ['application/pdf'],
    text: ['text/plain'],
  };

  class FileUploadHandler {
    constructor(options = {}) {
      this.uploadArea = document.getElementById('fileUploadArea');
      this.previewArea = document.getElementById('filePreviewArea');
      this.attachments = [];
      this.onChange = options.onChange || null;
      this.notifier = typeof window.showNotification === 'function' ? window.showNotification : null;
      this.fileInput = null;

      if (!this.uploadArea || !this.previewArea) {
        console.warn('[FileUploadHandler] Upload area not found, skipping initialization');
        return;
      }

      this.initialize();
    }

    initialize() {
      this.createHiddenFileInput();
      this.bindDropEvents();
      this.bindClickEvents();
      this.bindKeyboardEvents();
      this.renderPreview();
    }

    createHiddenFileInput() {
      this.fileInput = document.createElement('input');
      this.fileInput.type = 'file';
      this.fileInput.accept = [...SUPPORTED_MIME_TYPES.image, ...SUPPORTED_MIME_TYPES.document, ...SUPPORTED_MIME_TYPES.text].join(',');
      this.fileInput.multiple = true;
      this.fileInput.style.display = 'none';
      document.body.appendChild(this.fileInput);

      this.fileInput.addEventListener('change', (event) => {
        const { files } = event.target;
        if (files && files.length > 0) {
          this.handleFiles(files);
        }
        this.fileInput.value = '';
      });
    }

    bindDropEvents() {
      const stopDefaults = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };

      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
        this.uploadArea.addEventListener(eventName, stopDefaults, false);
      });

      this.uploadArea.addEventListener('dragover', () => {
        this.uploadArea.classList.add('drag-over');
      });

      this.uploadArea.addEventListener('dragleave', () => {
        this.uploadArea.classList.remove('drag-over');
      });

      this.uploadArea.addEventListener('drop', (event) => {
        this.uploadArea.classList.remove('drag-over');
        const { files } = event.dataTransfer;
        if (files && files.length > 0) {
          this.handleFiles(files);
        }
      });
    }

    bindClickEvents() {
      this.uploadArea.addEventListener('click', () => {
        this.fileInput?.click();
      });

      this.previewArea.addEventListener('click', (event) => {
        const removeBtn = event.target.closest('.file-remove-btn');
        if (!removeBtn) return;
        const id = removeBtn.dataset.id;
        this.removeAttachment(id);
      });
    }

    bindKeyboardEvents() {
      this.uploadArea.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          this.fileInput?.click();
        }
      });
    }

    async handleFiles(fileList) {
      const files = Array.from(fileList);

      for (const file of files) {
        if (!this.validateFile(file)) {
          continue;
        }

        try {
          const attachment = await this.createAttachment(file);
          if (attachment) {
            this.attachments.push(attachment);
          }
        } catch (error) {
          console.warn('[FileUploadHandler] Failed to process file:', error);
          this.notify(`Unable to process ${file.name}`, 'error');
        }
      }

      this.renderPreview();
      this.emitChange();
    }

    validateFile(file) {
      if (file.size > MAX_FILE_SIZE) {
        this.notify(`${file.name} is too large (max 5 MB)`, 'warning');
        return false;
      }

      const mimeType = file.type;
      const supported = Object.values(SUPPORTED_MIME_TYPES).some((types) => types.includes(mimeType));
      if (!supported) {
        this.notify(`${file.name} is not a supported file type`, 'warning');
        return false;
      }

      const exists = this.attachments.some((attachment) => attachment.name === file.name && attachment.size === file.size);
      if (exists) {
        this.notify(`${file.name} is already attached`, 'info');
        return false;
      }

      return true;
    }

    async createAttachment(file) {
      const id = `upload_${Date.now()}_${Math.random().toString(16).slice(2)}`;
      const base = {
        id,
        name: file.name,
        size: file.size,
        mimeType: file.type,
        createdAt: Date.now(),
      };

      if (SUPPORTED_MIME_TYPES.image.includes(file.type)) {
        const dataUrl = await this.readFileAsDataUrl(file);
        return {
          ...base,
          type: 'image',
          dataUrl,
          previewUrl: dataUrl,
        };
      }

      if (SUPPORTED_MIME_TYPES.document.includes(file.type)) {
        const dataUrl = await this.readFileAsDataUrl(file);
        return {
          ...base,
          type: 'document',
          dataUrl,
        };
      }

      if (SUPPORTED_MIME_TYPES.text.includes(file.type)) {
        const text = await this.readFileAsText(file, 2000);
        return {
          ...base,
          type: 'text',
          previewText: text,
        };
      }

      return null;
    }

    readFileAsDataUrl(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
      });
    }

    readFileAsText(file, maxLength = 2000) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const text = reader.result ? reader.result.toString() : '';
          resolve(text.length > maxLength ? `${text.slice(0, maxLength)}…` : text);
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsText(file);
      });
    }

    removeAttachment(id) {
      this.attachments = this.attachments.filter((attachment) => attachment.id !== id);
      this.renderPreview();
      this.emitChange();
    }

    clearAttachments() {
      this.attachments = [];
      this.renderPreview();
      this.emitChange();
    }

    restoreAttachments(attachments = []) {
      if (!Array.isArray(attachments) || attachments.length === 0) return;

      attachments.forEach((attachment) => {
        const exists = this.attachments.some(
          (item) => item.name === attachment.name && item.size === attachment.size
        );
        if (!exists) {
          this.attachments.push({ ...attachment });
        }
      });

      this.renderPreview();
      this.emitChange();
    }

    getAttachments() {
      return this.attachments.map((attachment) => ({ ...attachment }));
    }

    consumeAttachments() {
      const items = this.getAttachments();
      this.clearAttachments();
      return items;
    }

    hasAttachments() {
      return this.attachments.length > 0;
    }

    renderPreview() {
      if (!this.previewArea) return;
      this.previewArea.innerHTML = '';

      if (this.attachments.length === 0) {
        this.previewArea.setAttribute('data-empty', 'true');
        return;
      }

      this.previewArea.removeAttribute('data-empty');

      this.attachments.forEach((attachment) => {
        const item = document.createElement('div');
        item.className = `file-preview-item file-type-${attachment.type}`;
        item.dataset.id = attachment.id;

        let inner = '';
        if (attachment.type === 'image' && attachment.previewUrl) {
          inner += `<img src="${attachment.previewUrl}" alt="${escapeHtml(attachment.name)} preview">`;
        } else if (attachment.type === 'text' && attachment.previewText) {
          inner += `<div class="file-icon">📝</div><div class="file-preview-snippet">${escapeHtml(attachment.previewText)}</div>`;
        } else {
          inner += `<div class="file-icon">📄</div>`;
        }

        inner += `<div class="file-preview-name">${escapeHtml(attachment.name)}</div>`;
        inner += `<div class="file-preview-meta">${formatFileSize(attachment.size)}</div>`;

        item.innerHTML = `
          <button class="file-remove-btn" type="button" aria-label="Remove ${escapeHtml(attachment.name)}" data-id="${attachment.id}">✕</button>
          ${inner}
        `;

        this.previewArea.appendChild(item);
      });
    }

    emitChange() {
      if (typeof this.onChange === 'function') {
        this.onChange(this.getAttachments());
      }
    }

    notify(message, type = 'info') {
      this.notifier?.(message, type);
    }
  }

  function formatFileSize(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  function escapeHtml(value) {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function bootstrap() {
    const init = () => {
      const handler = new FileUploadHandler();
      if (typeof window !== 'undefined') {
        window.fileUploadManager = handler;
      }
    };

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init);
    } else {
      init();
    }
  }

  bootstrap();
})();
