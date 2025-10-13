import logger from '../services/logger.js';
import { Request, Response } from 'express';

// Database completo codici KBLI Indonesia
const KBLI_DATABASE = {
  // FOOD & BEVERAGE
  restaurants: {
    "56101": {
      code: "56101",
      name: "Restoran",
      nameEn: "Restaurant",
      description: "Usaha penyediaan jasa makanan dan minuman dengan tempat dan pelayanan",
      requirements: ["SIUP", "TDP", "HO", "Sertifikat Laik Hygiene", "Izin Lingkungan"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "56102": {
      code: "56102",
      name: "Warung Makan",
      nameEn: "Small Restaurant / Food Stall",
      description: "Usaha penyediaan makanan skala kecil",
      requirements: ["SIUP-Mikro", "Sertifikat Laik Hygiene"],
      minimumCapital: "IDR 50,000,000"
    },
    "56103": {
      code: "56103",
      name: "Bar & Restaurant",
      nameEn: "Bar & Restaurant",
      description: "Restoran dengan penjualan minuman beralkohol",
      requirements: ["SIUP", "TDP", "HO", "Sertifikat Laik Hygiene", "Izin Alkohol", "STPW"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)",
      special: "Requires alcohol license - contact Bali Zero for assistance"
    },
    "56104": {
      code: "56104",
      name: "Kafe",
      nameEn: "Cafe",
      description: "Usaha penyediaan minuman dan makanan ringan",
      requirements: ["SIUP", "TDP", "HO", "Sertifikat Laik Hygiene"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "56301": {
      code: "56301",
      name: "Bar / Klub Malam",
      nameEn: "Bar / Night Club",
      description: "Usaha penyediaan minuman beralkohol sebagai usaha utama",
      requirements: ["SIUP", "TDP", "HO", "Izin Alkohol", "STPW", "Izin Gangguan"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)",
      special: "Special zoning requirements apply"
    }
  },

  // ACCOMMODATION
  accommodation: {
    "55111": {
      code: "55111",
      name: "Hotel Bintang",
      nameEn: "Star Hotel",
      description: "Hotel dengan klasifikasi bintang 1-5",
      requirements: ["SIUP", "TDP", "HO", "Tanda Daftar Usaha Pariwisata", "Sertifikat Klasifikasi Hotel"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "55112": {
      code: "55112",
      name: "Hotel Non-Bintang",
      nameEn: "Non-Star Hotel",
      description: "Hotel tanpa klasifikasi bintang",
      requirements: ["SIUP", "TDP", "HO", "Tanda Daftar Usaha Pariwisata"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "55130": {
      code: "55130",
      name: "Villa",
      nameEn: "Villa Accommodation",
      description: "Penyewaan villa untuk wisatawan",
      requirements: ["SIUP", "TDP", "HO", "Pondok Wisata License", "PBG"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)",
      special: "Maximum 5 rooms for Pondok Wisata classification"
    },
    "55199": {
      code: "55199",
      name: "Guest House / Homestay",
      nameEn: "Guest House / Homestay",
      description: "Akomodasi skala kecil",
      requirements: ["SIUP-Mikro", "Tanda Daftar Usaha Pariwisata"],
      minimumCapital: "IDR 50,000,000"
    }
  },

  // RETAIL & TRADE
  retail: {
    "47111": {
      code: "47111",
      name: "Minimarket",
      nameEn: "Minimarket",
      description: "Perdagangan eceran berbagai macam barang",
      requirements: ["SIUP", "TDP", "HO"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)",
      special: "Location restrictions apply near traditional markets"
    },
    "47190": {
      code: "47190",
      name: "Toko Retail",
      nameEn: "Retail Store",
      description: "Perdagangan eceran umum",
      requirements: ["SIUP", "TDP", "HO"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "47911": {
      code: "47911",
      name: "E-Commerce",
      nameEn: "E-Commerce",
      description: "Perdagangan melalui internet",
      requirements: ["SIUP", "TDP", "PSEF (untuk marketplace)"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    }
  },

  // SERVICES
  services: {
    "62010": {
      code: "62010",
      name: "Pemrograman Komputer",
      nameEn: "Computer Programming",
      description: "Jasa pembuatan software dan aplikasi",
      requirements: ["SIUP", "TDP"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "63110": {
      code: "63110",
      name: "Pengolahan Data",
      nameEn: "Data Processing",
      description: "Jasa pengolahan dan hosting data",
      requirements: ["SIUP", "TDP", "Izin Penyelenggaraan Sistem Elektronik"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "70209": {
      code: "70209",
      name: "Konsultan Bisnis",
      nameEn: "Business Consultant",
      description: "Jasa konsultasi manajemen dan bisnis",
      requirements: ["SIUP", "TDP"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "73100": {
      code: "73100",
      name: "Periklanan",
      nameEn: "Advertising",
      description: "Jasa periklanan dan pemasaran",
      requirements: ["SIUP", "TDP"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "74909": {
      code: "74909",
      name: "Event Organizer",
      nameEn: "Event Organizer",
      description: "Jasa penyelenggaraan acara",
      requirements: ["SIUP", "TDP", "Izin Keramaian (per event)"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "85499": {
      code: "85499",
      name: "Pendidikan Lainnya",
      nameEn: "Other Education",
      description: "Kursus, pelatihan, workshop",
      requirements: ["SIUP", "TDP", "Izin Operasional Pendidikan"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "93290": {
      code: "93290",
      name: "Hiburan dan Rekreasi",
      nameEn: "Entertainment & Recreation",
      description: "Beach club, theme park, entertainment venue",
      requirements: ["SIUP", "TDP", "HO", "Tanda Daftar Usaha Pariwisata"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    }
  },

  // SPECIAL CATEGORIES
  special: {
    "01119": {
      code: "01119",
      name: "Pertanian Organik",
      nameEn: "Organic Farming",
      description: "Budidaya tanaman organik",
      requirements: ["SIUP", "TDP", "Sertifikat Organik"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)"
    },
    "32509": {
      code: "32509",
      name: "Alat Kesehatan",
      nameEn: "Medical Equipment",
      description: "Produksi/distribusi alat kesehatan",
      requirements: ["SIUP", "TDP", "Izin PKRT", "Sertifikat CDAKB"],
      minimumCapital: "IDR 10,000,000,000 (untuk PMA)",
      special: "Requires Ministry of Health approvals"
    }
  }
};

// Helper function to search KBLI
function searchKBLI(query: string) {
  const results: any[] = [];
  const searchTerm = query.toLowerCase();

  Object.values(KBLI_DATABASE).forEach(category => {
    Object.values(category).forEach((item: any) => {
      if (
        item.code.includes(searchTerm) ||
        item.name.toLowerCase().includes(searchTerm) ||
        item.nameEn.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm)
      ) {
        results.push(item);
      }
    });
  });

  return results;
}

// Handler functions
export async function kbliLookup(req: Request, res: Response) {
  try {
    const { query, code, category } = req.body.params || {};

    if (code) {
      // Direct code lookup
      for (const cat of Object.values(KBLI_DATABASE)) {
        if (cat[code as keyof typeof cat]) {
          return res.json({
            ok: true,
            data: {
              found: true,
              kbli: cat[code as keyof typeof cat]
            }
          });
        }
      }
      return res.json({
        ok: true,
        data: {
          found: false,
          message: `KBLI code ${code} not found`
        }
      });
    }

    if (category && KBLI_DATABASE[category as keyof typeof KBLI_DATABASE]) {
      // Category listing
      return res.json({
        ok: true,
        data: {
          category,
          codes: Object.values(KBLI_DATABASE[category as keyof typeof KBLI_DATABASE])
        }
      });
    }

    if (query) {
      // Search
      const results = searchKBLI(query);
      return res.json({
        ok: true,
        data: {
          query,
          results,
          count: results.length
        }
      });
    }

    // Return categories
    return res.json({
      ok: true,
      data: {
        categories: Object.keys(KBLI_DATABASE),
        totalCodes: Object.values(KBLI_DATABASE).reduce(
          (acc, cat) => acc + Object.keys(cat).length,
          0
        ),
        message: "Use query, code, or category parameter to search"
      }
    });
  } catch (error: any) {
    logger.error('kbli.lookup error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to lookup KBLI code'
    });
  }
}

export async function kbliRequirements(req: Request, res: Response) {
  try {
    const { businessType } = req.body.params || {};

    if (!businessType) {
      return res.status(400).json({
        ok: false,
        error: 'businessType parameter required'
      });
    }

    const results = searchKBLI(businessType);

    if (results.length === 0) {
      return res.json({
        ok: true,
        data: {
          found: false,
          message: `No KBLI codes found for "${businessType}"`,
          suggestion: "Try: restaurant, hotel, villa, retail, consulting"
        }
      });
    }

    // Format requirements for business type
    const requirements = results.map(kbli => ({
      code: kbli.code,
      name: kbli.nameEn,
      requirements: kbli.requirements,
      minimumCapital: kbli.minimumCapital,
      special: kbli.special || null
    }));

    return res.json({
      ok: true,
      data: {
        businessType,
        options: requirements,
        totalOptions: requirements.length,
        baliZeroServices: {
          available: true,
          services: [
            "Company Setup (PT PMA)",
            "License Applications",
            "Tax Registration (NPWP)",
            "Alcohol License (if needed)",
            "Complete Business Package"
          ],
          contact: {
            whatsapp: "+62 859 0436 9574",
            email: "info@balizero.com"
          }
        }
      }
    });
  } catch (error: any) {
    logger.error('kbli.requirements error:', error);
    return res.status(500).json({
      ok: false,
      error: error.message || 'Failed to get KBLI requirements'
    });
  }
}