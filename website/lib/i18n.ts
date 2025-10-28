export type Locale = 'en' | 'id'

export const defaultLocale: Locale = 'en'

export interface Translations {
  // Navigation
  nav: {
    home: string
    immigration: string
    business: string
    taxLegal: string
    insights: string
    visas: string
    company: string
    tax: string
    realEstate: string
    team: string
    contact: string
    blog: string
  }
  
  // Homepage
  hero: {
    tagline: string
    title: string
    subtitle: string
    description: string
    cta1: string
    cta2: string
    cta: string
  }
  
  // Threshold Section
  threshold: {
    title: string
    subtitle: string
    cta: string
    description: string
  }
  
  // Services
  services: {
    expertise: string
    title: string
    description: string
    swipe: string
    explore: string
    browse: string
    visas: {
      title: string
      description: string
    }
    company: {
      title: string
      description: string
    }
    tax: {
      title: string
      description: string
    }
    realEstate: {
      title: string
      description: string
    }
  }
  
  // Contact
  contact: {
    title: string
    subtitle: string
    office: string
    email: string
    whatsapp: string
    instagram: string
    officeHours: string
    responseTime: string
    company: string
    about: string
    careers: string
    press: string
    contact: string
    resources: string
    research: string
    reports: string
    webinars: string
    blog: string
    legal: string
    privacy: string
    terms: string
    cookies: string
    disclaimer: string
    description: string
    rights: string
  }
  
  // Chat Widget
  chat: {
    title: string
    support: string
    replies: string
    welcome: string
    quickActions: string
    whatsappChat: string
    whatsappMessage: string
    instant: string
    email: string
    contactForm: string
    detailed: string
    officeHours: string
    weekdays: string
    saturday: string
    whatsapp: string
    emailUs: string
  }
  
  // Common
  common: {
    getStarted: string
    learnMore: string
    contactUs: string
    readMore: string
    loading: string
    error: string
  }
}

export const translations: Record<Locale, Translations> = {
  en: {
    nav: {
      home: "Home",
      immigration: "Immigration",
      business: "Business",
      taxLegal: "Tax & Legal",
      insights: "AI Insights",
      visas: "Visas",
      company: "Company",
      tax: "Tax",
      realEstate: "Real Estate",
      team: "Team",
      contact: "Contact",
      blog: "Blog"
    },
    hero: {
      tagline: "FROM ZERO TO INFINITY ∞",
      title: "Unlock",
      subtitle: "Unleash Potential.",
      description: "Powered by ZANTARA Intelligence, we deliver premium business insights and AI-driven analysis for leaders who shape tomorrow.",
      cta1: "Explore Insights",
      cta2: "Learn More",
      cta: "Enter The Threshold"
    },
    threshold: {
      title: "The Threshold",
      subtitle: "Cross into a world where expertise meets excellence. Your gateway to Indonesian business mastery.",
      cta: "Enter The Threshold",
      description: "Explore our comprehensive services"
    },
    services: {
      expertise: "OUR EXPERTISE",
      title: "Content Pillars",
      description: "Bali Zero Insights covers the most critical areas shaping business and innovation in Southeast Asia and beyond.",
      swipe: "Swipe to explore all topics",
      explore: "Explore our full range of research and analysis",
      browse: "Browse All Topics",
      visas: {
        title: "Visas & Immigration",
        description: "Stay and work in Bali with the right permits. We handle all paperwork and government processes."
      },
      company: {
        title: "Company Setup",
        description: "From licenses to structure — launch your business fast. PT PMA, CV, or representative office."
      },
      tax: {
        title: "Tax Consulting",
        description: "Navigate Indonesia's tax system with confidence. Compliance, optimization, and peace of mind."
      },
      realEstate: {
        title: "Real Estate",
        description: "Secure property with legal clarity and guidance. Villa rentals, leases, and ownership structures."
      }
    },
    contact: {
      title: "Contact Us",
      subtitle: "Ready to start your journey in Bali? Get in touch with our team and we'll guide you through every step of the process.",
      office: "Office",
      email: "Email",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      officeHours: "Office Hours",
      responseTime: "We'll respond within 24 hours",
      company: "Company",
      about: "About Us",
      careers: "Careers",
      press: "Press",
      contact: "Contact",
      resources: "Resources",
      research: "Research",
      reports: "Reports",
      webinars: "Webinars",
      blog: "Blog",
      legal: "Legal",
      privacy: "Privacy Policy",
      terms: "Terms of Service",
      cookies: "Cookie Policy",
      disclaimer: "Disclaimer",
      description: "Premium business intelligence and AI insights for Southeast Asia.",
      rights: "All rights reserved."
    },
    chat: {
      title: "Chat with us",
      support: "Bali Zero Support",
      replies: "Usually replies instantly",
      welcome: "👋 Hi! How can we help you with your Indonesian business journey?",
      quickActions: "Quick Actions",
      whatsappChat: "WhatsApp Chat",
      whatsappMessage: "Hi! I'm interested in your Indonesian business services. Could you help me get started?",
      instant: "Instant messaging",
      email: "Email Us",
      contactForm: "Contact Form",
      detailed: "Detailed inquiry",
      officeHours: "Office Hours (WITA)",
      weekdays: "Mon-Fri: 9AM-5PM",
      saturday: "Sat: 10AM-2PM",
      whatsapp: "WhatsApp Chat",
      emailUs: "Email Us"
    },
    common: {
      getStarted: "Get Started",
      learnMore: "Learn More",
      contactUs: "Contact Us",
      readMore: "Read More",
      loading: "Loading...",
      error: "Something went wrong"
    }
  },
  
  id: {
    nav: {
      home: "Beranda",
      immigration: "Imigrasi",
      business: "Bisnis",
      taxLegal: "Pajak & Hukum",
      insights: "Wawasan AI",
      visas: "Visa",
      company: "Perusahaan",
      tax: "Pajak",
      realEstate: "Properti",
      team: "Tim",
      contact: "Kontak",
      blog: "Blog"
    },
    hero: {
      tagline: "DARI NOL MENUJU TAK TERBATAS ∞",
      title: "Buka",
      subtitle: "Lepaskan Potensi.",
      description: "Didukung oleh ZANTARA Intelligence, kami memberikan wawasan bisnis premium dan analisis berbasis AI untuk pemimpin yang membentuk masa depan.",
      cta1: "Jelajahi Wawasan",
      cta2: "Pelajari Lebih Lanjut",
      cta: "Masuki Ambang Batas"
    },
    threshold: {
      title: "Ambang Batas",
      subtitle: "Memasuki dunia di mana keahlian bertemu dengan keunggulan. Gerbang Anda menuju penguasaan bisnis Indonesia.",
      cta: "Masuki Ambang Batas",
      description: "Jelajahi layanan komprehensif kami"
    },
    services: {
      expertise: "KEAHLIAN KAMI",
      title: "Pilar Konten",
      description: "Bali Zero Insights mencakup area paling kritis yang membentuk bisnis dan inovasi di Asia Tenggara dan sekitarnya.",
      swipe: "Geser untuk menjelajahi semua topik",
      explore: "Jelajahi rangkaian lengkap penelitian dan analisis kami",
      browse: "Jelajahi Semua Topik",
      visas: {
        title: "Visa & Imigrasi",
        description: "Tinggal dan bekerja di Bali dengan izin yang tepat. Kami menangani semua dokumen dan proses pemerintahan."
      },
      company: {
        title: "Pendirian Perusahaan",
        description: "Dari lisensi hingga struktur — luncurkan bisnis Anda dengan cepat. PT PMA, CV, atau kantor perwakilan."
      },
      tax: {
        title: "Konsultasi Pajak",
        description: "Navigasi sistem pajak Indonesia dengan percaya diri. Kepatuhan, optimisasi, dan ketenangan pikiran."
      },
      realEstate: {
        title: "Properti",
        description: "Amankan properti dengan kejelasan dan panduan hukum. Sewa vila, kontrak sewa, dan struktur kepemilikan."
      }
    },
    contact: {
      title: "Hubungi Kami",
      subtitle: "Siap memulai perjalanan Anda di Bali? Hubungi tim kami dan kami akan memandu Anda melalui setiap langkah prosesnya.",
      office: "Kantor",
      email: "Email",
      whatsapp: "WhatsApp",
      instagram: "Instagram",
      officeHours: "Jam Kantor",
      responseTime: "Kami akan merespons dalam 24 jam",
      company: "Perusahaan",
      about: "Tentang Kami",
      careers: "Karir",
      press: "Pers",
      contact: "Kontak",
      resources: "Sumber Daya",
      research: "Penelitian",
      reports: "Laporan",
      webinars: "Webinar",
      blog: "Blog",
      legal: "Hukum",
      privacy: "Kebijakan Privasi",
      terms: "Syarat Layanan",
      cookies: "Kebijakan Cookie",
      disclaimer: "Penafian",
      description: "Intelijen bisnis premium dan wawasan AI untuk Asia Tenggara.",
      rights: "Semua hak dilindungi."
    },
    chat: {
      title: "Chat dengan kami",
      support: "Dukungan Bali Zero",
      replies: "Biasanya membalas secara instan",
      welcome: "👋 Hai! Bagaimana kami bisa membantu perjalanan bisnis Indonesia Anda?",
      quickActions: "Tindakan Cepat",
      whatsappChat: "Chat WhatsApp",
      whatsappMessage: "Hai! Saya tertarik dengan layanan bisnis Indonesia Anda. Bisakah Anda membantu saya memulai?",
      instant: "Pesan instan",
      email: "Email Kami",
      contactForm: "Formulir Kontak",
      detailed: "Pertanyaan terperinci",
      officeHours: "Jam Kantor (WITA)",
      weekdays: "Sen-Jum: 9:00-17:00",
      saturday: "Sab: 10:00-14:00",
      whatsapp: "Chat WhatsApp",
      emailUs: "Email Kami"
    },
    common: {
      getStarted: "Mulai",
      learnMore: "Pelajari Lebih Lanjut",
      contactUs: "Hubungi Kami",
      readMore: "Baca Selengkapnya",
      loading: "Memuat...",
      error: "Terjadi kesalahan"
    }
  }
}

export function getTranslations(locale: Locale): Translations {
  return translations[locale] || translations[defaultLocale]
}

// Hook for using translations in components
export function useTranslations(locale: Locale = defaultLocale) {
  return getTranslations(locale)
}