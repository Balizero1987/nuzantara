export type Locale = 'en' | 'id'

export const defaultLocale: Locale = 'en'

export interface Translations {
  // Navigation
  nav: {
    home: string
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
    title: string
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
  }
  
  // Chat Widget
  chat: {
    title: string
    subtitle: string
    welcome: string
    whatsapp: string
    emailUs: string
    contactForm: string
    officeHours: string
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
      title: "Build Your Indonesian Dream with Confidence",
      subtitle: "We simplify your journey in Bali: visas, business setup, taxes, and real estate — all under one roof.",
      cta: "Enter The Threshold"
    },
    threshold: {
      title: "The Threshold",
      subtitle: "Cross into a world where expertise meets excellence. Your gateway to Indonesian business mastery.",
      cta: "Enter The Threshold",
      description: "Explore our comprehensive services"
    },
    services: {
      title: "Our Services",
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
      responseTime: "We'll respond within 24 hours"
    },
    chat: {
      title: "Bali Zero Support",
      subtitle: "Usually replies instantly",
      welcome: "Hi! How can we help you with your Indonesian business journey?",
      whatsapp: "WhatsApp Chat",
      emailUs: "Email Us",
      contactForm: "Contact Form",
      officeHours: "Office Hours (WITA)"
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
      title: "Wujudkan Impian Indonesia Anda dengan Percaya Diri",
      subtitle: "Kami menyederhanakan perjalanan Anda di Bali: visa, pendirian usaha, pajak, dan properti — semua dalam satu atap.",
      cta: "Masuki Ambang Batas"
    },
    threshold: {
      title: "Ambang Batas",
      subtitle: "Memasuki dunia di mana keahlian bertemu dengan keunggulan. Gerbang Anda menuju penguasaan bisnis Indonesia.",
      cta: "Masuki Ambang Batas",
      description: "Jelajahi layanan komprehensif kami"
    },
    services: {
      title: "Layanan Kami",
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
      responseTime: "Kami akan merespons dalam 24 jam"
    },
    chat: {
      title: "Dukungan Bali Zero",
      subtitle: "Biasanya membalas secara instan",
      welcome: "Hai! Bagaimana kami bisa membantu perjalanan bisnis Indonesia Anda?",
      whatsapp: "Chat WhatsApp",
      emailUs: "Email Kami",
      contactForm: "Formulir Kontak",
      officeHours: "Jam Kantor (WITA)"
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