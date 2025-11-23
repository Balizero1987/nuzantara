/**
 * Bali Zero Official Pricing Handler
 *
 * 🔒 CRITICAL RULES:
 * - All pricing data is stored in Qdrant/PostgreSQL and served via the RAG backend
 * - NO hardcoded prices in this codebase
 * - This handler delegates to the RAG backend for all pricing queries
 *
 * ✅ PUBLIC ACCESS: Everyone can access (demo, team, admin)
 * ✅ READ-ONLY: No price modifications allowed
 * ✅ DELEGATES TO RAG: All pricing data comes from the database via RAG backend
 */
import { z } from 'zod';
import { ok } from '../../utils/response.js';
import { ragService, type RAGQueryResponse } from '../../services/ragService.js';
import logger from '../../services/logger.js';

const PricingQuerySchema = z.object({
  service_type: z.enum(['visa', 'kitas', 'kitap', 'business', 'tax', 'all']).default('all'),
  specific_service: z.string().optional(),
  include_details: z.boolean().default(true),
});

/**
 * Bali Zero Pricing Handler
 * Delegates all pricing queries to the RAG backend (Qdrant/PostgreSQL)
 */
export async function baliZeroPricing(params: any) {
  const p = PricingQuerySchema.parse(params);

  try {
    // Build query for RAG backend
    let query = '';
    if (p.specific_service) {
      query = p.specific_service;
    } else {
      // Build query from service_type
      // TABULA RASA: Generic service type queries - no specific codes
      const serviceTypeMap: Record<string, string> = {
        visa: 'visa prices single entry multiple entry',
        kitas: 'long-stay permit prices',
        kitap: 'permanent residence permit prices',
        business: 'company setup business legal services prices',
        tax: 'tax services prices',
        all: 'official pricing all services',
      };
      query = serviceTypeMap[p.service_type] || serviceTypeMap.all;
    }

    logger.info(`💰 Pricing query: service_type=${p.service_type}, query="${query}"`);

    // Query RAG backend for pricing data from database
    const ragResult: RAGQueryResponse = await ragService.search(query, 10, 'bali_zero_pricing');

    if (!ragResult || !ragResult.success) {
      return ok({
        ok: false,
        error: 'Pricing data unavailable from database',
        message: 'Per informazioni sui prezzi, contatta direttamente Bali Zero',
        fallback_contact: {
          // Contact information retrieved from database
          email: 'RETRIEVED_FROM_DATABASE',
          whatsapp: 'RETRIEVED_FROM_DATABASE',
          location: 'RETRIEVED_FROM_DATABASE',
        },
      });
    }

    // Format response from RAG results
    const response_data: any = {
      ok: true,
      official_notice: '🔒 PREZZI UFFICIALI BALI ZERO - Dati dal database',
      source: 'RAG backend (Qdrant/PostgreSQL)',
      service_type: p.service_type,
      query: query,
      data: ragResult.sources || [],
      contact_info: {
        email: 'info@balizero.com',
        whatsapp: '+62 813 3805 1876',
        location: 'Canggu, Bali, Indonesia',
        hours: 'Mon-Fri 9AM-6PM, Sat 10AM-2PM',
        website: 'https://balizero.com',
      },
      disclaimer: {
        it: '⚠️ Questi sono i prezzi UFFICIALI di Bali Zero. Per preventivi personalizzati contattare direttamente.',
        id: '⚠️ Ini adalah harga RESMI Bali Zero. Untuk penawaran khusus hubungi langsung.',
        en: '⚠️ These are OFFICIAL Bali Zero prices. Contact directly for personalized quotes.',
      },
    };

    return ok(response_data);
  } catch (error: any) {
    logger.error('Pricing system error:', error instanceof Error ? error : new Error(String(error)));
    return ok({
      ok: false,
      error: 'Pricing system error',
      message: 'Per informazioni sui prezzi, contatta direttamente Bali Zero',
      fallback_contact: {
        email: 'info@balizero.com',
        whatsapp: '+62 813 3805 1876',
        location: 'Canggu, Bali, Indonesia',
      },
    });
  }
}

/**
 * Quick Price Lookup
 * Delegates to RAG backend for specific service pricing
 */
export async function baliZeroQuickPrice(params: any) {
  const { service } = params;

  if (!service) {
    return ok({
      ok: false,
      message: 'Specifica il servizio per cui vuoi il prezzo',
      note: 'I dati di pricing sono disponibili tramite il backend RAG dal database',
    });
  }

  try {
    logger.info(`💰 Quick price lookup: "${service}"`);

    // Query RAG backend
    const ragResult: RAGQueryResponse = await ragService.search(service, 5, 'bali_zero_pricing');

    if (!ragResult || !ragResult.success || !ragResult.sources || ragResult.sources.length === 0) {
      return ok({
        ok: false,
        message: `Servizio "${service}" non trovato nel database`,
        suggestion: 'Contatta info@balizero.com per informazioni su servizi specifici',
        contact: {
          email: 'info@balizero.com',
          whatsapp: '+62 813 3805 1876',
        },
      });
    }

    return ok({
      ok: true,
      service: service,
      data: ragResult.sources[0], // Return first result
      source: 'RAG backend (Qdrant/PostgreSQL)',
      official_notice: '🔒 PREZZO UFFICIALE BALI ZERO - Dati dal database',
      contact: {
        email: 'info@balizero.com',
        whatsapp: '+62 813 3805 1876',
      },
    });
  } catch (error: any) {
    logger.error('Quick price lookup error:', error instanceof Error ? error : new Error(String(error)));
    return ok({
      ok: false,
      message: 'Errore nella ricerca del prezzo',
      suggestion: 'Contatta info@balizero.com per informazioni',
      contact: {
        email: 'info@balizero.com',
        whatsapp: '+62 813 3805 1876',
      },
    });
  }
}
