// Bali Zero Official Pricing Handler 2025
// ONLY OFFICIAL PRICES - NO AI GENERATION ALLOWED
import { z } from "zod";
import { ok } from "../../utils/response.js";

const PricingQuerySchema = z.object({
  service_type: z.enum([
    "visa", "kitas", "kitap", "business", "tax", "all"
  ]).default("all"),
  specific_service: z.string().optional(),
  include_details: z.boolean().default(true)
});

// OFFICIAL BALI ZERO PRICELIST 2025 - HARDCODED
const OFFICIAL_PRICES = {
  single_entry_visas: {
    "C1 Tourism": {
      price: "2.300.000 IDR",
      extension: "1.700.000 IDR",
      notes: "Single entry, extendable"
    },
    "C2 Business": {
      price: "3.600.000 IDR",
      extension: "1.700.000 IDR",
      notes: "Single entry, extendable"
    },
    "C7 Professional": {
      price: "5.000.000 IDR",
      extension: "Not extendable",
      notes: "30 days only, not extendable"
    },
    "C7 A&B Music": {
      price: "4.500.000 IDR",
      extension: "Not extendable",
      notes: "30 days only, not extendable"
    },
    "C18 Work Trial": {
      price: "Contact for quote",
      extension: "Not extendable",
      notes: "NEW: Max 90 days, skill assessment only"
    },
    "C22A Academy Internship": {
      price_60d: "4.800.000 IDR",
      price_180d: "5.800.000 IDR",
      notes: "Academic internship program"
    },
    "C22B Company Internship": {
      price_60d: "4.800.000 IDR",
      price_180d: "5.800.000 IDR",
      notes: "Company internship program"
    }
  },

  multiple_entry_visas: {
    "D1 Tourism/Meetings": {
      price_1y: "5.000.000 IDR",
      price_2y: "7.000.000 IDR",
      notes: "Multiple entry tourist visa"
    },
    "D2 Business": {
      price_1y: "6.000.000 IDR",
      price_2y: "8.000.000 IDR",
      notes: "Multiple entry business visa"
    },
    "D12 Business Investigation": {
      price_1y: "7.500.000 IDR",
      price_2y: "10.000.000 IDR",
      notes: "Business investigation purposes"
    }
  },

  kitas_permits: {
    "Freelance KITAS (E23)": {
      offshore: "26.000.000 IDR",
      onshore: "28.000.000 IDR",
      notes: "Freelancer long stay permit"
    },
    "Working KITAS (E23)": {
      offshore: "34.500.000 IDR",
      onshore: "36.000.000 IDR",
      notes: "Employment long stay permit"
    },
    "Investor KITAS (E28A)": {
      offshore: "17.000.000 IDR",
      onshore: "19.000.000 IDR",
      notes: "Investment long stay permit"
    },
    "Retirement KITAS (E33F)": {
      offshore: "14.000.000 IDR",
      onshore: "16.000.000 IDR",
      notes: "Retirement long stay permit"
    },
    "Remote Worker KITAS (E33G)": {
      offshore: "12.500.000 IDR",
      onshore: "14.000.000 IDR",
      notes: "Digital nomad long stay permit"
    },
    "Spouse KITAS (E31A)": {
      price_1y_off: "11.000.000 IDR",
      price_2y_off: "15.000.000 IDR",
      notes: "Spouse of Indonesian/foreigner"
    },
    "Dependent KITAS (E31B/E)": {
      price_1y_off: "11.000.000 IDR",
      price_2y_off: "15.000.000 IDR",
      notes: "Dependent family member"
    }
  },

  kitap_permits: {
    "Investor KITAP": {
      price: "Contact for quote",
      notes: "Permanent residence through investment"
    },
    "Working KITAP": {
      price: "Contact for quote",
      notes: "Permanent residence through employment"
    },
    "Family KITAP": {
      price: "Contact for quote",
      notes: "Permanent residence through family"
    },
    "Retirement KITAP": {
      price: "Contact for quote",
      notes: "Permanent residence for retirees"
    }
  },

  business_legal_services: {
    "PT PMA Company Setup": {
      price: "Starting from 20.000.000 IDR",
      notes: "Foreign investment company setup"
    },
    "Company Revision": {
      price: "Starting from 7.000.000 IDR",
      notes: "Company structure modifications"
    },
    "Alcohol License": {
      price: "Starting from 15.000.000 IDR",
      notes: "Alcohol distribution/retail license"
    },
    "Legal Real Estate": {
      price: "Contact for quote",
      notes: "Property legal services"
    },
    "Building Permit PBG & SLF": {
      price: "Contact for quote",
      notes: "Construction permits and certificates"
    }
  },

  taxation_services: {
    "NPWP Personal + Coretax": {
      price: "1.000.000 IDR per person",
      notes: "Personal tax number + online tax system"
    },
    "NPWPD Company": {
      price: "2.500.000 IDR per company",
      notes: "Company regional tax number"
    },
    "Monthly Tax Report": {
      price: "Starting from 1.500.000 IDR",
      notes: "Monthly corporate tax reporting"
    },
    "Annual Tax Report (Operational)": {
      price: "Starting from 4.000.000 IDR",
      notes: "Annual operational company tax"
    },
    "Annual Tax Report (Zero)": {
      price: "Starting from 3.000.000 IDR",
      notes: "Annual zero-activity company tax"
    },
    "Annual Personal Tax": {
      price: "2.000.000 IDR",
      notes: "Annual individual tax return"
    },
    "BPJS Health Insurance": {
      price: "1.500.000 IDR per company (min 2 people)",
      notes: "Mandatory health insurance setup"
    },
    "BPJS Employment Insurance": {
      price: "1.500.000 IDR per company (min 2 people)",
      notes: "Mandatory employment insurance setup"
    },
    "LKPM Report": {
      price: "1.000.000 IDR per report (3 months)",
      notes: "Quarterly foreign investment report"
    }
  },

  contact_info: {
    email: "info@balizero.com",
    whatsapp: "+62 813 3805 1876",
    location: "Canggu, Bali, Indonesia",
    hours: "Mon-Fri 9AM-6PM, Sat 10AM-2PM",
    website: "https://ayo.balizero.com"
  }
};

export async function baliZeroPricing(params: any) {
  const p = PricingQuerySchema.parse(params);

  try {
    let response_data: any = {
      official_notice: "🔒 PREZZI UFFICIALI BALI ZERO 2025 - Non generati da AI",
      last_updated: "2025-01-01",
      currency: "IDR (Indonesian Rupiah)",
      contact_info: OFFICIAL_PRICES.contact_info
    };

    // Return specific service category or all
    switch (p.service_type) {
      case "visa":
        response_data.single_entry_visas = OFFICIAL_PRICES.single_entry_visas;
        response_data.multiple_entry_visas = OFFICIAL_PRICES.multiple_entry_visas;
        break;
      case "kitas":
        response_data.kitas_permits = OFFICIAL_PRICES.kitas_permits;
        break;
      case "kitap":
        response_data.kitap_permits = OFFICIAL_PRICES.kitap_permits;
        break;
      case "business":
        response_data.business_legal_services = OFFICIAL_PRICES.business_legal_services;
        break;
      case "tax":
        response_data.taxation_services = OFFICIAL_PRICES.taxation_services;
        break;
      case "all":
      default:
        response_data = { ...response_data, ...OFFICIAL_PRICES };
        break;
    }

    // Search for specific service if requested
    if (p.specific_service) {
      const searchTerm = p.specific_service.toLowerCase();
      const found_services: any = {};

      // Search across all categories
      Object.entries(OFFICIAL_PRICES).forEach(([category, services]) => {
        if (typeof services === 'object' && services !== null && !Array.isArray(services)) {
          Object.entries(services).forEach(([service_name, service_data]) => {
            if (service_name.toLowerCase().includes(searchTerm) ||
                (typeof service_data === 'object' &&
                 JSON.stringify(service_data).toLowerCase().includes(searchTerm))) {
              if (!found_services[category]) found_services[category] = {};
              found_services[category][service_name] = service_data;
            }
          });
        }
      });

      if (Object.keys(found_services).length > 0) {
        response_data.search_results = found_services;
        response_data.search_term = p.specific_service;
      } else {
        response_data.search_results = "Nessun servizio trovato. Contatta info@balizero.com per servizi specifici.";
      }
    }

    response_data.disclaimer = {
      it: "⚠️ Questi sono i prezzi UFFICIALI di Bali Zero 2025. Per preventivi personalizzati contattare direttamente.",
      id: "⚠️ Ini adalah harga RESMI Bali Zero 2025. Untuk penawaran khusus hubungi langsung.",
      en: "⚠️ These are OFFICIAL Bali Zero 2025 prices. Contact directly for personalized quotes."
    };

    return ok(response_data);

  } catch (error: any) {
    return ok({
      error: "Pricing system error",
      fallback_contact: OFFICIAL_PRICES.contact_info,
      message: "Per informazioni sui prezzi, contatta direttamente Bali Zero"
    });
  }
}

// Quick price lookup functions
export async function baliZeroQuickPrice(params: any) {
  const { service } = params;

  if (!service) {
    return ok({
      message: "Specifica il servizio per cui vuoi il prezzo",
      examples: ["C1 Tourism", "Working KITAS", "PT PMA Setup", "NPWP Personal"]
    });
  }

  // Search in all categories for the service
  const searchTerm = service.toLowerCase();
  let found_service = null;
  let category = null;

  Object.entries(OFFICIAL_PRICES).forEach(([cat, services]) => {
    if (typeof services === 'object' && services !== null && !Array.isArray(services)) {
      Object.entries(services).forEach(([service_name, service_data]) => {
        if (service_name.toLowerCase().includes(searchTerm)) {
          found_service = { name: service_name, ...service_data };
          category = cat;
        }
      });
    }
  });

  if (found_service) {
    return ok({
      service: found_service,
      category: category,
      contact: OFFICIAL_PRICES.contact_info,
      official_notice: "🔒 PREZZO UFFICIALE BALI ZERO 2025"
    });
  } else {
    return ok({
      message: `Servizio "${service}" non trovato nella pricelist ufficiale`,
      suggestion: "Contatta info@balizero.com per informazioni su servizi specifici",
      contact: OFFICIAL_PRICES.contact_info
    });
  }
}