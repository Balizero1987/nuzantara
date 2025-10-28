// Language Switcher for Static Landing Pages - UNIFIED VERSION 2.0
// Uses shared configuration for consistency with main site
// Import shared config (in real implementation, would use ES6 modules)

// For now, inline the shared config until module system is set up
const LANGUAGE_CONFIG = {
  SUPPORTED_LOCALES: ['en', 'id'],
  DEFAULT_LOCALE: 'en',
  STORAGE_KEYS: {
    LOCALE: 'locale',
    TIMESTAMP: 'locale_timestamp',
    AUTO_DETECTED: 'locale_auto_detected',
    USER_PREFERENCE: 'locale_user_preference'
  },
  GESTURE_THRESHOLD: 100,
  ANIMATION: {
    TRANSITION_DURATION: 300,
    PRELOADER_DELAY: 200,
    BLUR_DURATION: 300
  },
  SHORTCUTS: {
    TOGGLE: 'l',
    ESCAPE: 'Escape',
    ARROW_DOWN: 'ArrowDown',
    ARROW_UP: 'ArrowUp',
    ENTER: 'Enter'
  }
};

// Shared utility functions
class LanguageSwitcherUtils {
  static detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    return browserLang.startsWith('id') ? 'id' : 'en';
  }
  
  static loadLocale() {
    const stored = localStorage.getItem(LANGUAGE_CONFIG.STORAGE_KEYS.LOCALE);
    if (stored && LANGUAGE_CONFIG.SUPPORTED_LOCALES.includes(stored)) {
      return stored;
    }
    return this.detectBrowserLanguage();
  }
  
  static saveLocale(locale, isUserAction = true) {
    localStorage.setItem(LANGUAGE_CONFIG.STORAGE_KEYS.LOCALE, locale);
    localStorage.setItem(LANGUAGE_CONFIG.STORAGE_KEYS.TIMESTAMP, Date.now());
    if (isUserAction) {
      localStorage.setItem(LANGUAGE_CONFIG.STORAGE_KEYS.USER_PREFERENCE, 'true');
    }
  }
  
  static detectSwipeGesture(touchStartX, touchEndX, currentLocale, callback) {
    const swipeDistance = touchEndX - touchStartX;
    const threshold = LANGUAGE_CONFIG.GESTURE_THRESHOLD;
    
    if (swipeDistance > threshold && currentLocale === 'id') {
      callback('en');
    } else if (swipeDistance < -threshold && currentLocale === 'en') {
      callback('id');
    }
  }
}

// Unified translations (matches shared config structure)
const translations = {
  en: {
    // Navigation
    nav: {
      home: "Home",
      visas: "Visas",
      company: "Company",
      contact: "Contact",
      taxLegal: "Tax & Legal",
      realEstate: "Real Estate",
      team: "Team"
    },
    
    // Common elements
    common: {
      getStarted: "Get Started",
      learnMore: "Learn More",
      contactUs: "Contact Us",
      bookConsultation: "Book a Consultation",
      whatsapp: "WhatsApp Us",
      email: "Email Us"
    },
    
    // Visa page specific
    visas: {
      title: "Visa Services",
      subtitle: "Stay and work in Bali with the right permits. From tourism to permanent residence, we've got you covered.",
      singleEntry: "Single Entry Visas",
      multipleEntry: "Multiple Entry Visas",
      kitas: "KITAS (Work & Stay Permits)",
      c1Tourism: "C1 Tourism",
      c1Description: "Perfect for tourism, visiting friends or family, and attending meetings or exhibitions.",
      c2Business: "C2 Business", 
      c2Description: "Ideal for business activities, meetings, or shopping. Valid up to 180 days.",
      workingKitas: "Working KITAS (E23)",
      workingKitasDescription: "Longer stay permit for foreign nationals working in Indonesia for 1 year."
    },
    
    // Company page specific
    company: {
      title: "Company Setup",
      subtitle: "Launch your Indonesian business with confidence. From PT PMA to CV structures, we handle all legal requirements.",
      ptPma: "PT PMA (Foreign Investment Company)",
      ptPmaDescription: "Most common structure for foreign-owned businesses in Indonesia.",
      cv: "CV (Limited Partnership)",
      cvDescription: "Simpler structure for smaller operations and partnerships."
    },
    
    // Contact page specific
    contact: {
      title: "Contact Us",
      subtitle: "Ready to start your Indonesian journey? Get in touch with our expert team.",
      office: "Office",
      email: "Email",
      whatsapp: "WhatsApp",
      officeHours: "Office Hours",
      response: "We'll respond within 24 hours"
    }
  },
  
  id: {
    // Navigation
    nav: {
      home: "Beranda",
      visas: "Visa",
      company: "Perusahaan",
      contact: "Kontak",
      taxLegal: "Pajak & Hukum",
      realEstate: "Properti",
      team: "Tim"
    },
    
    // Common elements
    common: {
      getStarted: "Mulai",
      learnMore: "Pelajari Lebih Lanjut",
      contactUs: "Hubungi Kami",
      bookConsultation: "Jadwalkan Konsultasi",
      whatsapp: "WhatsApp Kami",
      email: "Email Kami"
    },
    
    // Visa page specific
    visas: {
      title: "Layanan Visa",
      subtitle: "Tinggal dan bekerja di Bali dengan izin yang tepat. Dari pariwisata hingga tempat tinggal permanen, kami siap membantu Anda.",
      singleEntry: "Visa Sekali Masuk",
      multipleEntry: "Visa Multi Masuk",
      kitas: "KITAS (Izin Kerja & Tinggal)",
      c1Tourism: "C1 Pariwisata",
      c1Description: "Sempurna untuk pariwisata, mengunjungi teman atau keluarga, dan menghadiri pertemuan atau pameran.",
      c2Business: "C2 Bisnis",
      c2Description: "Ideal untuk kegiatan bisnis, pertemuan, atau berbelanja. Berlaku hingga 180 hari.",
      workingKitas: "KITAS Kerja (E23)",
      workingKitasDescription: "Izin tinggal yang lebih lama untuk warga negara asing yang bekerja di Indonesia selama 1 tahun."
    },
    
    // Company page specific
    company: {
      title: "Pendirian Perusahaan",
      subtitle: "Luncurkan bisnis Indonesia Anda dengan percaya diri. Dari PT PMA hingga struktur CV, kami menangani semua persyaratan hukum.",
      ptPma: "PT PMA (Perusahaan Penanaman Modal Asing)",
      ptPmaDescription: "Struktur paling umum untuk bisnis milik asing di Indonesia.",
      cv: "CV (Persekutuan Terbatas)",
      cvDescription: "Struktur yang lebih sederhana untuk operasi dan kemitraan yang lebih kecil."
    },
    
    // Contact page specific
    contact: {
      title: "Hubungi Kami",
      subtitle: "Siap memulai perjalanan Indonesia Anda? Hubungi tim ahli kami.",
      office: "Kantor",
      email: "Email",
      whatsapp: "WhatsApp",
      officeHours: "Jam Kantor",
      response: "Kami akan merespons dalam 24 jam"
    }
  }
};

// Language switcher functionality
class LanguageSwitcher {
  constructor() {
    // Use shared utilities for consistency
    this.currentLocale = LanguageSwitcherUtils.loadLocale();
    this.isTransitioning = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
    this.init();
  }
  
  init() {
    console.log('LanguageSwitcher initializing with locale:', this.currentLocale);
    this.createLanguageSwitcher();
    this.setupLazyLoading();
    this.setupGestureHandlers();
    this.setupKeyboardShortcuts();
    this.setupAccessibility();
    this.translatePage();
  }
  
  createLanguageSwitcher() {
    // Find header or create fallback container
    const headerContent = document.querySelector('.header-content');
    const header = document.querySelector('header');
    const body = document.body;
    
    console.log('Header content found:', !!headerContent);
    console.log('Header found:', !!header);
    
    // Create language switcher HTML
    const languageSwitcher = document.createElement('div');
    languageSwitcher.className = 'language-switcher';
    languageSwitcher.id = 'languageSwitcher';
    languageSwitcher.innerHTML = `
      <div class="language-dropdown">
        <button class="language-btn" id="languageBtn" aria-label="Select language">
          <span class="flag">${this.currentLocale === 'en' ? '🇺🇸' : '🇮🇩'}</span>
          <span class="lang-code">${this.currentLocale.toUpperCase()}</span>
          <span class="dropdown-arrow">▼</span>
        </button>
        <div class="language-menu" id="languageMenu">
          <button class="language-option ${this.currentLocale === 'en' ? 'active' : ''}" data-locale="en">
            <span class="flag">🇺🇸</span>
            <span class="lang-name">English</span>
          </button>
          <button class="language-option ${this.currentLocale === 'id' ? 'active' : ''}" data-locale="id">
            <span class="flag">🇮🇩</span>
            <span class="lang-name">Bahasa Indonesia</span>
          </button>
        </div>
      </div>
    `;
    
    // Add CSS styles with fixed positioning
    const style = document.createElement('style');
    style.textContent = `
      #languageSwitcher {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        z-index: 99999 !important;
        display: block !important;
        visibility: visible !important;
        opacity: 1 !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      
      #languageSwitcher.transitioning {
        opacity: 0.7 !important;
        transform: scale(0.95) !important;
      }
      
      body {
        position: relative !important;
        transition: filter 0.3s ease !important;
      }
      
      body.lang-transitioning {
        filter: blur(1px) !important;
      }
      
      .header-content {
        position: relative !important;
      }
      
      /* Preloader for language change */
      .lang-preloader {
        position: fixed !important;
        top: 50% !important;
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        z-index: 999999 !important;
        background: rgba(9, 9, 32, 0.9) !important;
        color: var(--gold, #D4AF37) !important;
        padding: 1rem 2rem !important;
        border-radius: 0.5rem !important;
        display: none !important;
        align-items: center !important;
        gap: 0.5rem !important;
        backdrop-filter: blur(10px) !important;
      }
      
      .lang-preloader.show {
        display: flex !important;
        animation: fadeInScale 0.3s ease-out !important;
      }
      
      .loader-spinner {
        width: 16px !important;
        height: 16px !important;
        border: 2px solid transparent !important;
        border-top: 2px solid currentColor !important;
        border-radius: 50% !important;
        animation: spin 1s linear infinite !important;
      }
      
      @keyframes fadeInScale {
        from {
          opacity: 0 !important;
          transform: translate(-50%, -50%) scale(0.8) !important;
        }
        to {
          opacity: 1 !important;
          transform: translate(-50%, -50%) scale(1) !important;
        }
      }
      
      @keyframes spin {
        to { transform: rotate(360deg) !important; }
      }
      
      .language-btn {
        display: flex !important;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: 1px solid var(--gold, #D4AF37);
        color: var(--off-white, #f5f5f5);
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.3s ease;
        white-space: nowrap;
      }
      
      .language-btn:hover {
        background: var(--gold, #D4AF37);
        color: var(--vivid-black, #090920);
      }
      
      .dropdown-arrow {
        font-size: 0.75rem;
        transition: transform 0.3s ease;
      }
      
      .language-btn.open .dropdown-arrow {
        transform: rotate(180deg);
      }
      
      .language-menu {
        position: absolute;
        top: 100%;
        right: 0;
        background: var(--vivid-black, #090920);
        border: 1px solid var(--gold, #D4AF37);
        border-radius: 0.375rem;
        padding: 0.5rem 0;
        min-width: 200px;
        z-index: 10000 !important;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s ease;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
      }
      
      .language-menu.open {
        opacity: 1;
        visibility: visible;
        transform: translateY(0);
      }
      
      .language-option {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        width: 100%;
        padding: 0.75rem 1rem;
        background: transparent;
        border: none;
        color: var(--off-white);
        cursor: pointer;
        font-size: 0.875rem;
        transition: background 0.3s ease;
      }
      
      .language-option:hover {
        background: rgba(212, 175, 55, 0.1);
      }
      
      .language-option.active {
        background: rgba(212, 175, 55, 0.2);
        color: var(--gold);
      }
      
      /* Make sure nav items are displayed inline */
      nav[role="navigation"] {
        display: flex !important;
        align-items: center !important;
        gap: 1rem !important;
        flex-wrap: wrap !important;
      }
      
      nav[role="navigation"] a {
        display: inline-block !important;
      }
      
      /* Accessibility Features */
      .language-btn:focus {
        outline: 3px solid var(--gold, #D4AF37) !important;
        outline-offset: 2px !important;
      }
      
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
      
      @media (prefers-contrast: high) {
        .language-btn {
          border-width: 3px !important;
          background: #000 !important;
          color: #fff !important;
        }
        .language-menu {
          background: #000 !important;
          border-width: 3px !important;
        }
      }
      
      /* Font size adjustment support */
      @media (min-resolution: 2dppx) {
        .language-btn {
          font-size: 1rem !important;
        }
      }
      
      /* Touch feedback */
      .language-btn:active {
        transform: scale(0.95) !important;
        background: var(--gold, #D4AF37) !important;
        color: var(--vivid-black, #090920) !important;
      }
      
      /* Mobile optimizations */
      @media (max-width: 768px) {
        #languageSwitcher {
          top: 15px !important;
          right: 15px !important;
        }
        
        .language-btn {
          font-size: 0.875rem !important;
          padding: 0.625rem 0.75rem !important;
          min-height: 44px !important;
          min-width: 44px !important;
        }
        
        .language-menu {
          left: 0 !important;
          right: auto !important;
          min-width: 180px !important;
        }
        
        .language-option {
          min-height: 44px !important;
          padding: 0.875rem 1rem !important;
        }
      }
      
      @media (max-width: 480px) {
        #languageSwitcher {
          top: 10px !important;
          right: 10px !important;
        }
        
        .language-btn {
          padding: 0.5rem !important;
        }
        
        .language-btn .lang-code {
          display: none !important;
        }
      }
      
      @media (min-width: 769px) {
        nav[role="navigation"] {
          flex-direction: row !important;
          align-items: center !important;
        }
      }
    `;
    
    document.head.appendChild(style);
    
    // Always append to body for fixed positioning
    document.body.appendChild(languageSwitcher);
    console.log('Language switcher appended to body');
    
    // Create preloader
    this.createPreloader();
    
    // Add event listeners
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    const languageBtn = document.getElementById('languageBtn');
    const languageMenu = document.getElementById('languageMenu');
    const languageOptions = document.querySelectorAll('.language-option');
    
    // Toggle dropdown
    languageBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      languageBtn.classList.toggle('open');
      languageMenu.classList.toggle('open');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      languageBtn?.classList.remove('open');
      languageMenu?.classList.remove('open');
    });
    
    // Handle language selection
    languageOptions.forEach(option => {
      option.addEventListener('click', (e) => {
        e.stopPropagation();
        const locale = option.dataset.locale;
        this.changeLanguage(locale);
      });
    });
  }
  
  async changeLanguage(locale) {
    if (this.isTransitioning || locale === this.currentLocale) return;
    
    this.isTransitioning = true;
    this.showPreloader();
    
    // Add transition effects
    document.body.classList.add('lang-transitioning');
    document.getElementById('languageSwitcher')?.classList.add('transitioning');
    
    // Wait for visual feedback - use shared config timing
    await new Promise(resolve => setTimeout(resolve, LANGUAGE_CONFIG.ANIMATION.PRELOADER_DELAY));
    
    this.currentLocale = locale;
    // Use shared save logic with analytics
    LanguageSwitcherUtils.saveLocale(locale, true);
    this.translatePage();
    this.updateLanguageButton();
    
    // Close dropdown
    document.getElementById('languageBtn')?.classList.remove('open');
    document.getElementById('languageMenu')?.classList.remove('open');
    
    // Complete transition - use shared config timing
    await new Promise(resolve => setTimeout(resolve, LANGUAGE_CONFIG.ANIMATION.TRANSITION_DURATION));
    this.hidePreloader();
    document.body.classList.remove('lang-transitioning');
    document.getElementById('languageSwitcher')?.classList.remove('transitioning');
    
    this.isTransitioning = false;
  }
  
  updateLanguageButton() {
    const flagSpan = document.querySelector('.language-btn .flag');
    const langCodeSpan = document.querySelector('.language-btn .lang-code');
    const options = document.querySelectorAll('.language-option');
    
    if (flagSpan) flagSpan.textContent = this.currentLocale === 'en' ? '🇺🇸' : '🇮🇩';
    if (langCodeSpan) langCodeSpan.textContent = this.currentLocale.toUpperCase();
    
    options.forEach(option => {
      option.classList.toggle('active', option.dataset.locale === this.currentLocale);
    });
  }
  
  translatePage() {
    const t = translations[this.currentLocale];
    if (!t) {
      console.error('Translations not found for locale:', this.currentLocale);
      return;
    }
    
    console.log('Translating page with locale:', this.currentLocale);
    
    // Translate navigation
    this.translateNavigation(t.nav);
    
    // Translate page-specific content based on current page
    const pageType = this.detectPageType();
    console.log('Detected page type:', pageType);
    
    switch (pageType) {
      case 'visas':
        this.translateVisaPage(t.visas, t.common);
        break;
      case 'company':
        this.translateCompanyPage(t.company, t.common);
        break;
      case 'contact':
        this.translateContactPage(t.contact, t.common);
        break;
      default:
        this.translateCommonElements(t.common);
    }
  }
  
  detectPageType() {
    const path = window.location.pathname;
    const filename = path.split('/').pop() || document.title;
    
    if (filename.includes('visa') || document.title.toLowerCase().includes('visa')) {
      return 'visas';
    } else if (filename.includes('company') || document.title.toLowerCase().includes('company')) {
      return 'company';
    } else if (filename.includes('contact') || document.title.toLowerCase().includes('contact')) {
      return 'contact';
    }
    return 'general';
  }
  
  translateNavigation(navTranslations) {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href?.includes('visa')) {
        link.textContent = navTranslations.visas;
      } else if (href?.includes('company')) {
        link.textContent = navTranslations.company;
      } else if (href?.includes('contact')) {
        link.textContent = navTranslations.contact;
      } else if (href?.includes('balizero-redesign') || link.textContent.toLowerCase().includes('home')) {
        link.textContent = navTranslations.home;
      }
    });
  }
  
  translateVisaPage(visaTranslations, commonTranslations) {
    // Hero section
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero .subtitle');
    
    if (heroTitle) heroTitle.textContent = visaTranslations.title;
    if (heroSubtitle) heroSubtitle.textContent = visaTranslations.subtitle;
    
    // Section headings
    const sections = document.querySelectorAll('.category-section h2');
    sections.forEach(section => {
      const text = section.textContent.toLowerCase();
      if (text.includes('single entry')) {
        section.textContent = visaTranslations.singleEntry;
      } else if (text.includes('multiple entry')) {
        section.textContent = visaTranslations.multipleEntry;
      } else if (text.includes('kitas')) {
        section.textContent = visaTranslations.kitas;
      }
    });
    
    // Specific visa cards
    this.translateVisaCards(visaTranslations);
    this.translateCommonElements(commonTranslations);
  }
  
  translateVisaCards(visaTranslations) {
    const visaCards = document.querySelectorAll('.visa-card');
    visaCards.forEach(card => {
      const title = card.querySelector('h3');
      const description = card.querySelector('.visa-description');
      
      if (title) {
        const titleText = title.textContent;
        if (titleText.includes('C1 Tourism')) {
          title.textContent = visaTranslations.c1Tourism;
          if (description) description.textContent = visaTranslations.c1Description;
        } else if (titleText.includes('C2 Business')) {
          title.textContent = visaTranslations.c2Business;
          if (description) description.textContent = visaTranslations.c2Description;
        } else if (titleText.includes('Working KITAS')) {
          title.textContent = visaTranslations.workingKitas;
          if (description) description.textContent = visaTranslations.workingKitasDescription;
        }
      }
    });
  }
  
  translateCompanyPage(companyTranslations, commonTranslations) {
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero .subtitle');
    
    if (heroTitle) heroTitle.textContent = companyTranslations.title;
    if (heroSubtitle) heroSubtitle.textContent = companyTranslations.subtitle;
    
    this.translateCommonElements(commonTranslations);
  }
  
  translateContactPage(contactTranslations, commonTranslations) {
    const heroTitle = document.querySelector('.hero h1');
    const heroSubtitle = document.querySelector('.hero .subtitle');
    
    if (heroTitle) heroTitle.textContent = contactTranslations.title;
    if (heroSubtitle) heroSubtitle.textContent = contactTranslations.subtitle;
    
    this.translateCommonElements(commonTranslations);
  }
  
  translateCommonElements(commonTranslations) {
    // Translate common buttons and links
    const buttons = document.querySelectorAll('button, .btn, .cta-button');
    buttons.forEach(button => {
      const text = button.textContent.toLowerCase().trim();
      if (text.includes('get started')) {
        button.textContent = commonTranslations.getStarted;
      } else if (text.includes('learn more')) {
        button.textContent = commonTranslations.learnMore;
      } else if (text.includes('contact us')) {
        button.textContent = commonTranslations.contactUs;
      } else if (text.includes('whatsapp')) {
        button.textContent = commonTranslations.whatsapp;
      } else if (text.includes('email')) {
        button.textContent = commonTranslations.email;
      }
    });
  }
  
  // ==================== NEW METHODS ====================
  
  createPreloader() {
    const preloader = document.createElement('div');
    preloader.className = 'lang-preloader';
    preloader.id = 'langPreloader';
    preloader.innerHTML = `
      <div class="loader-spinner"></div>
      <span>Switching language...</span>
    `;
    document.body.appendChild(preloader);
  }
  
  showPreloader() {
    const preloader = document.getElementById('langPreloader');
    if (preloader) {
      preloader.classList.add('show');
    }
  }
  
  hidePreloader() {
    const preloader = document.getElementById('langPreloader');
    if (preloader) {
      preloader.classList.remove('show');
    }
  }
  
  setupLazyLoading() {
    // Lazy load images when language changes
    const images = document.querySelectorAll('img[data-src]');
    if (images.length === 0) return;
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          observer.unobserve(img);
        }
      });
    });
    
    images.forEach(img => imageObserver.observe(img));
  }
  
  setupGestureHandlers() {
    // Swipe gesture for language change (mobile)
    document.addEventListener('touchstart', (e) => {
      this.touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    document.addEventListener('touchend', (e) => {
      this.touchEndX = e.changedTouches[0].screenX;
      this.handleGesture();
    }, { passive: true });
  }
  
  handleGesture() {
    // Use shared gesture detection utility for consistency
    LanguageSwitcherUtils.detectSwipeGesture(
      this.touchStartX,
      this.touchEndX,
      this.currentLocale,
      (newLocale) => this.changeLanguage(newLocale)
    );
  }
  
  setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      // Use shared config for keyboard shortcuts
      // Alt + L: Toggle language
      if (e.altKey && e.key.toLowerCase() === LANGUAGE_CONFIG.SHORTCUTS.TOGGLE) {
        e.preventDefault();
        const newLocale = this.currentLocale === 'en' ? 'id' : 'en';
        this.changeLanguage(newLocale);
      }
      
      // Escape: Close language menu
      if (e.key === LANGUAGE_CONFIG.SHORTCUTS.ESCAPE) {
        const languageBtn = document.getElementById('languageBtn');
        const languageMenu = document.getElementById('languageMenu');
        languageBtn?.classList.remove('open');
        languageMenu?.classList.remove('open');
      }
      
      // Arrow keys navigation in dropdown
      if (document.getElementById('languageMenu')?.classList.contains('open')) {
        if (e.key === LANGUAGE_CONFIG.SHORTCUTS.ARROW_DOWN || e.key === LANGUAGE_CONFIG.SHORTCUTS.ARROW_UP) {
          e.preventDefault();
          this.navigateOptions(e.key === LANGUAGE_CONFIG.SHORTCUTS.ARROW_DOWN ? 1 : -1);
        } else if (e.key === LANGUAGE_CONFIG.SHORTCUTS.ENTER) {
          e.preventDefault();
          const focused = document.querySelector('.language-option:focus');
          if (focused) {
            focused.click();
          }
        }
      }
    });
  }
  
  navigateOptions(direction) {
    const options = document.querySelectorAll('.language-option');
    const currentFocus = document.querySelector('.language-option:focus');
    let index = Array.from(options).indexOf(currentFocus);
    
    if (index === -1) {
      index = direction > 0 ? 0 : options.length - 1;
    } else {
      index += direction;
      if (index >= options.length) index = 0;
      if (index < 0) index = options.length - 1;
    }
    
    options[index]?.focus();
  }
  
  setupAccessibility() {
    // Add ARIA labels and screen reader support
    const languageBtn = document.getElementById('languageBtn');
    const languageMenu = document.getElementById('languageMenu');
    
    if (languageBtn) {
      languageBtn.setAttribute('aria-expanded', 'false');
      languageBtn.setAttribute('aria-haspopup', 'true');
      languageBtn.setAttribute('aria-label', `Current language: ${this.currentLocale === 'en' ? 'English' : 'Bahasa Indonesia'}. Press to change language.`);
    }
    
    if (languageMenu) {
      languageMenu.setAttribute('role', 'menu');
      languageMenu.setAttribute('aria-label', 'Language selection menu');
    }
    
    // Update ARIA when menu opens/closes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const isOpen = languageMenu?.classList.contains('open');
          languageBtn?.setAttribute('aria-expanded', isOpen.toString());
        }
      });
    });
    
    if (languageMenu) {
      observer.observe(languageMenu, { attributes: true });
    }
    
    // Add focus management
    document.querySelectorAll('.language-option').forEach((option, index) => {
      option.setAttribute('role', 'menuitem');
      option.setAttribute('tabindex', '-1');
    });
  }
}

// Initialize language switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, initializing LanguageSwitcher...');
  try {
    new LanguageSwitcher();
    console.log('LanguageSwitcher initialized successfully');
  } catch (error) {
    console.error('Error initializing LanguageSwitcher:', error);
  }
});

// Fallback initialization if DOMContentLoaded already fired
if (document.readyState === 'loading') {
  // DOM is still loading, DOMContentLoaded will fire
} else {
  console.log('DOM already loaded, initializing LanguageSwitcher immediately...');
  try {
    new LanguageSwitcher();
    console.log('LanguageSwitcher initialized successfully (immediate)');
  } catch (error) {
    console.error('Error initializing LanguageSwitcher (immediate):', error);
  }
}