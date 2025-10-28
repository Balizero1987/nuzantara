// Language Switcher for Static Landing Pages
// Traduzioni per le pagine landing statiche

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
    this.currentLocale = this.loadLocale();
    this.init();
  }
  
  loadLocale() {
    return localStorage.getItem('locale') || 'en';
  }
  
  saveLocale(locale) {
    localStorage.setItem('locale', locale);
  }
  
  init() {
    this.createLanguageSwitcher();
    this.translatePage();
  }
  
  createLanguageSwitcher() {
    // Find navigation element
    const nav = document.querySelector('nav[role="navigation"]');
    if (!nav) return;
    
    // Create language switcher HTML
    const languageSwitcher = document.createElement('div');
    languageSwitcher.className = 'language-switcher';
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
    
    // Add CSS styles
    const style = document.createElement('style');
    style.textContent = `
      .language-switcher {
        position: relative;
        margin-left: 1rem;
      }
      
      .language-btn {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        background: transparent;
        border: 1px solid var(--gold);
        color: var(--off-white);
        padding: 0.5rem 0.75rem;
        border-radius: 0.375rem;
        cursor: pointer;
        font-size: 0.875rem;
        transition: all 0.3s ease;
      }
      
      .language-btn:hover {
        background: var(--gold);
        color: var(--vivid-black);
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
        background: var(--vivid-black);
        border: 1px solid var(--gold);
        border-radius: 0.375rem;
        padding: 0.5rem 0;
        min-width: 200px;
        z-index: 1000;
        opacity: 0;
        visibility: hidden;
        transform: translateY(-10px);
        transition: all 0.3s ease;
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
      
      @media (max-width: 768px) {
        .language-switcher {
          margin-left: 0;
          margin-top: 1rem;
        }
        
        .language-menu {
          left: 0;
          right: auto;
        }
      }
    `;
    
    document.head.appendChild(style);
    nav.appendChild(languageSwitcher);
    
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
  
  changeLanguage(locale) {
    this.currentLocale = locale;
    this.saveLocale(locale);
    this.translatePage();
    this.updateLanguageButton();
    
    // Close dropdown
    document.getElementById('languageBtn')?.classList.remove('open');
    document.getElementById('languageMenu')?.classList.remove('open');
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
    if (!t) return;
    
    // Translate navigation
    this.translateNavigation(t.nav);
    
    // Translate page-specific content based on current page
    const pageType = this.detectPageType();
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
}

// Initialize language switcher when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new LanguageSwitcher();
});