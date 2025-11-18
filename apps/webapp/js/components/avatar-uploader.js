/**
 * ZANTARA Avatar Uploader Component
 * Features:
 * - Upload JPG, PNG, GIF (max 2MB)
 * - Auto-crop to circle
 * - Compress to 200x200px
 * - LocalStorage + Backend sync
 * - Dropdown menu (Change Photo, Profile, Logout)
 * - Fallback to initial letter or silhouette
 */

import { API_CONFIG } from '../api-config.js';

class ZantaraAvatarUploader {
  constructor(config = {}) {
    this.maxFileSize = config.maxFileSize || 2 * 1024 * 1024; // 2MB
    this.targetSize = config.targetSize || 200; // 200x200px
    this.allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    this.storageKey = 'zantara-user-avatar';
    this.backendSyncEnabled = config.backendSync !== false;

    // DOM elements
    this.avatar = null;
    this.modal = null;
    this.menu = null;
    this.fileInput = null;

    this.init();
  }

  /**
   * Initialize avatar uploader
   */
  init() {
    this.setupDOM();
    this.loadAvatar();
    this.setupEventListeners();
    this.createDropdownMenu();
  }

  /**
   * Setup DOM elements
   */
  setupDOM() {
    this.avatar = document.getElementById('userAvatar');
    this.modal = document.getElementById('avatarModal');
    this.fileInput = document.getElementById('avatarFileInput');

    if (!this.avatar || !this.modal || !this.fileInput) {
      console.error('❌ Avatar uploader: Required elements not found');
      return;
    }

    // Add accessible attributes
    this.avatar.setAttribute('role', 'button');
    this.avatar.setAttribute('aria-label', 'Open avatar menu');
    this.avatar.setAttribute('tabindex', '0');
  }

  /**
   * Create dropdown menu
   */
  createDropdownMenu() {
    if (!this.avatar) return;

    // Create menu element
    this.menu = document.createElement('div');
    this.menu.className = 'avatar-dropdown-menu';
    this.menu.setAttribute('role', 'menu');
    this.menu.setAttribute('aria-hidden', 'true');

    this.menu.innerHTML = `
      <button class="avatar-menu-item" data-action="change-photo" role="menuitem">
        <span class="avatar-menu-icon">📷</span>
        <span>Change Photo</span>
      </button>
      <button class="avatar-menu-item" data-action="profile" role="menuitem">
        <span class="avatar-menu-icon">👤</span>
        <span>Profile Settings</span>
      </button>
      <div class="avatar-menu-divider"></div>
      <button class="avatar-menu-item" data-action="logout" role="menuitem">
        <span class="avatar-menu-icon">🚪</span>
        <span>Logout</span>
      </button>
    `;

    // Insert menu after avatar
    this.avatar.parentElement.style.position = 'relative';
    this.avatar.parentElement.appendChild(this.menu);

    // Menu item actions
    this.menu.querySelectorAll('.avatar-menu-item').forEach(item => {
      item.addEventListener('click', (e) => {
        const action = item.dataset.action;
        this.handleMenuAction(action);
        this.closeMenu();
      });
    });

    // Close menu on outside click
    document.addEventListener('click', (e) => {
      if (!this.avatar.contains(e.target) && !this.menu.contains(e.target)) {
        this.closeMenu();
      }
    });

    // Close menu on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.menu.classList.contains('hidden')) {
        this.closeMenu();
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    if (!this.avatar || !this.modal || !this.fileInput) return;

    // Avatar click - toggle menu instead of opening modal
    this.avatar.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMenu();
    });

    // Avatar keyboard navigation
    this.avatar.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.toggleMenu();
      }
    });

    // File input change
    this.fileInput.addEventListener('change', (e) => {
      this.handleFileSelect(e);
    });

    // Modal close button
    const closeBtn = document.getElementById('closeAvatarModalBtn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.closeModal();
      });
    }

    // Remove avatar button
    const removeBtn = document.getElementById('removeAvatarBtn');
    if (removeBtn) {
      removeBtn.addEventListener('click', () => {
        this.removeAvatar();
      });
    }

    // Upload button in modal
    const uploadBtn = this.modal.querySelector('.avatar-upload-btn');
    if (uploadBtn) {
      uploadBtn.addEventListener('click', () => {
        this.fileInput.click();
      });
    }

    // Close modal on background click
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal();
      }
    });

    // Close modal on Escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.closeModal();
      }
    });
  }

  /**
   * Toggle dropdown menu
   */
  toggleMenu() {
    if (!this.menu) return;

    const isHidden = this.menu.classList.contains('hidden');

    if (isHidden) {
      this.openMenu();
    } else {
      this.closeMenu();
    }
  }

  /**
   * Open dropdown menu
   */
  openMenu() {
    if (!this.menu) return;

    this.menu.classList.remove('hidden');
    this.menu.setAttribute('aria-hidden', 'false');

    // Focus first menu item
    const firstItem = this.menu.querySelector('.avatar-menu-item');
    if (firstItem) {
      setTimeout(() => firstItem.focus(), 100);
    }
  }

  /**
   * Close dropdown menu
   */
  closeMenu() {
    if (!this.menu) return;

    this.menu.classList.add('hidden');
    this.menu.setAttribute('aria-hidden', 'true');
  }

  /**
   * Handle menu actions
   */
  handleMenuAction(action) {
    console.log(`🎯 Avatar menu action: ${action}`);

    switch (action) {
      case 'change-photo':
        this.openModal();
        break;

      case 'profile':
        this.openProfileSettings();
        break;

      case 'logout':
        this.logout();
        break;

      default:
        console.warn(`Unknown menu action: ${action}`);
    }
  }

  /**
   * Open avatar upload modal
   */
  openModal() {
    if (!this.modal) return;

    this.modal.classList.add('active');
    this.modal.setAttribute('aria-hidden', 'false');

    // Focus upload button
    const uploadBtn = this.modal.querySelector('.avatar-upload-btn');
    if (uploadBtn) {
      setTimeout(() => uploadBtn.focus(), 100);
    }
  }

  /**
   * Close avatar modal
   */
  closeModal() {
    if (!this.modal) return;

    this.modal.classList.remove('active');
    this.modal.setAttribute('aria-hidden', 'true');
  }

  /**
   * Open profile settings (placeholder)
   */
  openProfileSettings() {
    console.log('📋 Opening profile settings...');
    // TODO: Implement profile settings page
    alert('Profile settings - Coming soon!');
  }

  /**
   * Logout handler
   */
  logout() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.click();
    }
  }

  /**
   * Handle file selection
   */
  async handleFileSelect(event) {
    const file = event.target.files[0];

    if (!file) return;

    // Validate file type
    if (!this.allowedTypes.includes(file.type)) {
      alert('Please upload a JPG, PNG, or GIF image.');
      return;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      alert(`File too large. Maximum size is ${this.maxFileSize / 1024 / 1024}MB.`);
      return;
    }

    console.log(`📤 Uploading avatar: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);

    try {
      // Read and process image
      const processedImage = await this.processImage(file);

      // Save to localStorage
      localStorage.setItem(this.storageKey, processedImage);
      console.log(`💾 Avatar saved to localStorage (${processedImage.length} bytes)`);

      // Update UI
      this.setAvatarImage(processedImage);

      // Sync to backend if enabled
      if (this.backendSyncEnabled) {
        await this.syncToBackend(processedImage);
      }

      // Close modal
      this.closeModal();

      console.log('✅ Avatar uploaded successfully');
    } catch (error) {
      console.error('❌ Failed to upload avatar:', error);
      alert('Failed to upload avatar. Please try again.');
    }

    // Reset file input
    event.target.value = '';
  }

  /**
   * Process image: resize, crop to circle, compress
   */
  async processImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        const img = new Image();

        img.onload = () => {
          try {
            // Create canvas
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            // Set size to target (200x200)
            canvas.width = this.targetSize;
            canvas.height = this.targetSize;

            // Calculate dimensions for square crop
            const size = Math.min(img.width, img.height);
            const x = (img.width - size) / 2;
            const y = (img.height - size) / 2;

            // Create circular clip
            ctx.beginPath();
            ctx.arc(this.targetSize / 2, this.targetSize / 2, this.targetSize / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            // Draw image (cropped to square, then to circle)
            ctx.drawImage(
              img,
              x, y, size, size,  // Source crop
              0, 0, this.targetSize, this.targetSize  // Destination
            );

            // Convert to data URL (compressed JPEG)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

            console.log(`🎨 Image processed: ${this.targetSize}x${this.targetSize}px`);
            resolve(dataUrl);
          } catch (error) {
            reject(error);
          }
        };

        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };

        img.src = e.target.result;
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsDataURL(file);
    });
  }

  /**
   * Set avatar image in UI
   */
  setAvatarImage(dataUrl) {
    if (!this.avatar) return;

    // Update main avatar
    const img = document.createElement('img');
    img.src = dataUrl;
    img.alt = 'User avatar';
    this.avatar.innerHTML = '';
    this.avatar.appendChild(img);

    // Update preview in modal
    const preview = document.getElementById('avatarPreview');
    if (preview) {
      preview.innerHTML = '';
      const previewImg = img.cloneNode(true);
      preview.appendChild(previewImg);
    }
  }

  /**
   * Remove avatar
   */
  removeAvatar() {
    console.log('🗑️ Removing avatar...');

    // Clear localStorage
    localStorage.removeItem(this.storageKey);

    // Set default silhouette
    this.setDefaultAvatar();

    // Sync removal to backend
    if (this.backendSyncEnabled) {
      this.syncToBackend(null);
    }

    console.log('✅ Avatar removed');
  }

  /**
   * Set default avatar (human silhouette)
   */
  setDefaultAvatar() {
    if (!this.avatar) return;

    const silhouette = `
      <svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="7" r="4"/>
        <path d="M5.5 21v-2a7.5 7.5 0 0 1 13 0v2"/>
      </svg>
    `;

    this.avatar.innerHTML = silhouette;

    // Update preview
    const preview = document.getElementById('avatarPreview');
    if (preview) {
      const letter = this.getUserInitial();
      preview.innerHTML = `<span id="avatarLetter">${letter || silhouette}</span>`;
    }
  }

  /**
   * Get user initial for fallback
   */
  getUserInitial() {
    const userContext = window.USER_CONTEXT?.getUser();
    const name = userContext?.name || userContext?.email || 'Z';
    return name.charAt(0).toUpperCase();
  }

  /**
   * Load saved avatar
   */
  async loadAvatar() {
    console.log('🖼️ Loading avatar...');

    // Try localStorage first
    const savedAvatar = localStorage.getItem(this.storageKey);

    if (savedAvatar) {
      this.setAvatarImage(savedAvatar);
      console.log('✅ Avatar loaded from localStorage');
      return;
    }

    // Try backend if enabled
    if (this.backendSyncEnabled) {
      const backendAvatar = await this.loadFromBackend();
      if (backendAvatar) {
        localStorage.setItem(this.storageKey, backendAvatar);
        this.setAvatarImage(backendAvatar);
        console.log('✅ Avatar loaded from backend');
        return;
      }
    }

    // Fallback to default
    this.setDefaultAvatar();
    console.log('ℹ️ Using default avatar');
  }

  /**
   * Sync avatar to backend
   */
  async syncToBackend(avatarData) {
    try {
      const userContext = window.USER_CONTEXT?.getUser();
      const userId = userContext?.userId || userContext?.id;

      if (!userId) {
        console.warn('⚠️ No user ID, cannot sync to backend');
        return false;
      }

      const response = await fetch(`${API_CONFIG.memory.url}/api/users/${userId}/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          avatar: avatarData
        })
      });

      if (response.ok) {
        console.log('✅ Avatar synced to backend');
        return true;
      } else {
        console.warn('⚠️ Failed to sync avatar to backend:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Backend sync error:', error);
      return false;
    }
  }

  /**
   * Load avatar from backend
   */
  async loadFromBackend() {
    try {
      const userContext = window.USER_CONTEXT?.getUser();
      const userId = userContext?.userId || userContext?.id;

      if (!userId) {
        return null;
      }

      const response = await fetch(`${API_CONFIG.memory.url}/api/users/${userId}/avatar`);

      if (response.ok) {
        const data = await response.json();
        return data.avatar || null;
      }

      return null;
    } catch (error) {
      console.error('❌ Failed to load avatar from backend:', error);
      return null;
    }
  }

  /**
   * Public API: Refresh avatar
   */
  async refresh() {
    await this.loadAvatar();
  }
}

// Initialize avatar uploader when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.ZANTARA_AVATAR = new ZantaraAvatarUploader();
  });
} else {
  window.ZANTARA_AVATAR = new ZantaraAvatarUploader();
}

export default ZantaraAvatarUploader;
