/**
 * BALI ZERO LANGUAGE SWITCHER - SHARED CONFIGURATION
 * Configurazione unificata per language switcher su tutto il sito balizero.com
 * 
 * Utilizzato da:
 * - React/Next.js (sito principale balizero.com)
 * - JavaScript vanilla (landing pages balizero.com/landing)
 * 
 * @version 2.0.0
 * @author Bali Zero Development Team
 */

// ============================================================================
// CONFIGURAZIONE GLOBALE
// ============================================================================

export const LANGUAGE_CONFIG = {
  // Lingue supportate
  SUPPORTED_LOCALES: ['en', 'id'],
  DEFAULT_LOCALE: 'en',
  
  // Storage keys
  STORAGE_KEYS: {
    LOCALE: 'locale',
    TIMESTAMP: 'locale_timestamp',
    AUTO_DETECTED: 'locale_auto_detected',
    USER_PREFERENCE: 'locale_user_preference'
  },
  
  // Gesture settings
  GESTURE_THRESHOLD: 100,
  
  // Animation timings
  ANIMATION: {
    TRANSITION_DURATION: 300,
    PRELOADER_DELAY: 200,
    BLUR_DURATION: 300
  },
  
  // Keyboard shortcuts
  SHORTCUTS: {
    TOGGLE: 'l', // Alt + L
    ESCAPE: 'Escape',
    ARROW_DOWN: 'ArrowDown',
    ARROW_UP: 'ArrowUp',
    ENTER: 'Enter'
  }
}

// ============================================================================
// TRADUZIONI CONDIVISE
// ============================================================================

export const SHARED_TRANSLATIONS = {
  en: {
    // Meta
    meta: {
      siteName: "Bali Zero",
      tagline: "Your Gateway to Indonesia",
      description: "Expert business services for Indonesia. Visas, company setup, legal support - all handled professionally."
    },
    
    // Navigation (condivisa tra main + landing)
    nav: {
      home: "Home",
      visas: "Visas", 
      company: "Company",
      contact: "Contact",
      taxLegal: "Tax & Legal",
      realEstate: "Real Estate",
      team: "Team",
      blog: "Blog",
      about: "About"
    },
    
    // Language switcher
    languageSwitcher: {
      label: "Change language",
      currentLanguage: "Current language",
      tip: "Use Alt+L for quick toggle",
      saving: "Language preference saved automatically",
      switching: "Switching language...",
      english: "English",
      indonesian: "Bahasa Indonesia"
    },
    
    // Azioni comuni
    actions: {
      getStarted: "Get Started",
      learnMore: "Learn More", 
      contactUs: "Contact Us",
      bookConsultation: "Book a Consultation",
      whatsapp: "WhatsApp Us",
      email: "Email Us",
      readMore: "Read More",
      viewAll: "View All",
      download: "Download",
      apply: "Apply Now"
    },
    
    // Sezioni condivise
    sections: {
      hero: {
        subtitle: "Professional business services for your Indonesian journey"
      },
      services: {
        title: "Our Services",
        subtitle: "Comprehensive solutions for your business needs in Indonesia"
      },
      contact: {
        title: "Get in Touch",
        subtitle: "Ready to start your Indonesian journey? Contact our expert team.",
        office: "Office",
        email: "Email", 
        whatsapp: "WhatsApp",
        officeHours: "Office Hours",
        response: "We'll respond within 24 hours"
      }
    }
  },
  
  id: {
    // Meta
    meta: {
      siteName: "Bali Zero",
      tagline: "Gerbang Anda ke Indonesia", 
      description: "Layanan bisnis ahli untuk Indonesia. Visa, pendirian perusahaan, dukungan hukum - semua ditangani secara profesional."
    },
    
    // Navigation
    nav: {
      home: "Beranda",
      visas: "Visa",
      company: "Perusahaan", 
      contact: "Kontak",
      taxLegal: "Pajak & Hukum",
      realEstate: "Properti",
      team: "Tim",
      blog: "Blog",
      about: "Tentang"
    },
    
    // Language switcher
    languageSwitcher: {
      label: "Ubah bahasa",
      currentLanguage: "Bahasa saat ini",
      tip: "Gunakan Alt+L untuk toggle cepat",
      saving: "Preferensi bahasa disimpan otomatis",
      switching: "Mengubah bahasa...",
      english: "English",
      indonesian: "Bahasa Indonesia"
    },
    
    // Azioni comuni
    actions: {
      getStarted: "Mulai",
      learnMore: "Pelajari Lebih Lanjut",
      contactUs: "Hubungi Kami", 
      bookConsultation: "Jadwalkan Konsultasi",
      whatsapp: "WhatsApp Kami",
      email: "Email Kami",
      readMore: "Baca Selengkapnya",
      viewAll: "Lihat Semua",
      download: "Unduh",
      apply: "Daftar Sekarang"
    },
    
    // Sezioni condivise
    sections: {
      hero: {
        subtitle: "Layanan bisnis profesional untuk perjalanan Indonesia Anda"
      },
      services: {
        title: "Layanan Kami",
        subtitle: "Solusi komprehensif untuk kebutuhan bisnis Anda di Indonesia"
      },
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
  }
}

// ============================================================================
// STILI CSS CONDIVISI
// ============================================================================

export const SHARED_STYLES = {
  // Language switcher positioning
  LANGUAGE_SWITCHER: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    zIndex: 99999
  },
  
  // Colors (CSS custom properties)
  COLORS: {
    '--vivid-black': '#090920',
    '--bold-red': '#FF0000', 
    '--gold': '#D4AF37',
    '--cream': '#e8d5b7',
    '--navy': '#1a1f3a',
    '--off-white': '#f5f5f5'
  },
  
  // Breakpoints
  BREAKPOINTS: {
    mobile: '480px',
    tablet: '768px', 
    desktop: '1024px',
    wide: '1200px'
  }
}

// ============================================================================
// UTILITÀ CONDIVISE
// ============================================================================

export class LanguageSwitcherUtils {
  /**
   * Auto-detect browser language
   */
  static detectBrowserLanguage() {
    const browserLang = navigator.language || navigator.userLanguage
    return browserLang.startsWith('id') ? 'id' : 'en'
  }
  
  /**
   * Load saved locale with fallback
   */
  static loadLocale() {
    const stored = localStorage.getItem(LANGUAGE_CONFIG.STORAGE_KEYS.LOCALE)
    if (stored && LANGUAGE_CONFIG.SUPPORTED_LOCALES.includes(stored)) {
      return stored
    }
    return this.detectBrowserLanguage()
  }
  
  /**
   * Save locale with analytics
   */
  static saveLocale(locale, isUserAction = true) {
    localStorage.setItem(LANGUAGE_CONFIG.STORAGE_KEYS.LOCALE, locale)
    localStorage.setItem(LANGUAGE_CONFIG.STORAGE_KEYS.TIMESTAMP, Date.now())
    if (isUserAction) {
      localStorage.setItem(LANGUAGE_CONFIG.STORAGE_KEYS.USER_PREFERENCE, 'true')
    }
  }
  
  /**
   * Get translations for current context
   */
  static getTranslations(locale, context = 'all') {
    const translations = SHARED_TRANSLATIONS[locale] || SHARED_TRANSLATIONS.en
    if (context === 'all') return translations
    return translations[context] || {}
  }
  
  /**
   * Handle gesture detection
   */
  static detectSwipeGesture(touchStartX, touchEndX, currentLocale, callback) {
    const swipeDistance = touchEndX - touchStartX
    const threshold = LANGUAGE_CONFIG.GESTURE_THRESHOLD
    
    if (swipeDistance > threshold && currentLocale === 'id') {
      callback('en')
    } else if (swipeDistance < -threshold && currentLocale === 'en') {
      callback('id') 
    }
  }
  
  /**
   * Validate locale
   */
  static isValidLocale(locale) {
    return LANGUAGE_CONFIG.SUPPORTED_LOCALES.includes(locale)
  }
}