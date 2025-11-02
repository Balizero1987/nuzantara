// Google Translate Handlers for ZANTARA v5.2.0
// Multilingual support: EN/ID/IT + auto-detection
import logger from '../../services/logger.js';
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";
// import { getTranslate } from "../../services/google-auth-service.js";

// Temporary stub - replace with REST API call when needed
const getTranslate = () => {
  throw new Error("Google Translate not configured - use REST API instead");
};

// Language mappings for Bali Zero business
const SUPPORTED_LANGUAGES = {
  'en': 'English',
  'id': 'Indonesian',
  'it': 'Italian',
  'nl': 'Dutch',
  'de': 'German',
  'fr': 'French',
  'es': 'Spanish',
  'ja': 'Japanese',
  'ko': 'Korean',
  'zh': 'Chinese',
  'th': 'Thai',
  'vi': 'Vietnamese'
} as const;

async function getTranslateService() {
  try {
    const service = await getTranslate();
    if (!service) {
      throw new BadRequestError('Translation service not available');
    }

    // Extract auth client (JWT for Service Account with DWD)
    const client = (service as any).auth || (service as any).context?._options?.auth;

    if (!client) {
      logger.warn('⚠️ No auth client found in translate service, will use API key only');
    }

    return {
      service,
      client,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.GOOGLE_CLOUD_PROJECT_ID || 'involuted-box-469105-r0',
      baseUrl: 'https://translation.googleapis.com/language/translate/v2'
    };
  } catch (error: any) {
    logger.error('🔥 Translation service setup failed:', error.message);
    throw new BadRequestError('Translation service not available');
  }
}

export async function translateText(params: any) {
  const {
    text,
    targetLanguage = 'en',
    sourceLanguage = 'auto',
    format = 'text'
  } = params || {};

  if (!text) {
    throw new BadRequestError('Text is required for translation');
  }

  if (!SUPPORTED_LANGUAGES[targetLanguage as keyof typeof SUPPORTED_LANGUAGES]) {
    throw new BadRequestError(`Unsupported target language: ${targetLanguage}. Supported: ${Object.keys(SUPPORTED_LANGUAGES).join(', ')}`);
  }

  try {
    const { client, baseUrl } = await getTranslateService();

    const requestBody = {
      q: Array.isArray(text) ? text : [text],
      target: targetLanguage,
      ...(sourceLanguage !== 'auto' && { source: sourceLanguage }),
      format: format
    };

    // Use Service Account JWT (with DWD) instead of API Key for Translation
    // API Keys often have restrictions that block Translation API
    const url = baseUrl;

    const headers: any = {
      'Content-Type': 'application/json'
    };

    // Add Authorization header using Service Account JWT
    if (client && typeof client.getAccessToken === 'function') {
      try {
        const accessToken = await client.getAccessToken();
        if (accessToken && accessToken.token) {
          headers['Authorization'] = `Bearer ${accessToken.token}`;
        } else {
          throw new Error('Failed to get access token from Service Account');
        }
      } catch (error: any) {
        logger.error('❌ Failed to get access token:', error.message);
        throw new Error(`Translation service authentication failed: ${error.message}`);
      }
    } else {
      throw new Error('Translation service not properly configured');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Translation API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;
    const translations = result.data.translations;

    return ok({
      originalText: text,
      translatedText: Array.isArray(text) ?
        translations.map((t: any) => t.translatedText) :
        translations[0].translatedText,
      sourceLanguage: translations[0].detectedSourceLanguage || sourceLanguage,
      targetLanguage,
      confidence: translations[0].confidence || null,
      provider: 'Google Translate',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('🔥 Translation failed:', error.message);
    throw new BadRequestError(`Translation failed: ${error.message}`);
  }
}

export async function translateBatch(params: any) {
  const {
    texts,
    targetLanguage = 'en',
    sourceLanguage = 'auto'
  } = params || {};

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    throw new BadRequestError('Array of texts is required for batch translation');
  }

  if (texts.length > 100) {
    throw new BadRequestError('Maximum 100 texts allowed per batch');
  }

  try {
    const result = await translateText({
      text: texts,
      targetLanguage,
      sourceLanguage
    });

    return ok({
      batchSize: texts.length,
      results: result.data.translatedText.map((translated: string, index: number) => ({
        original: texts[index],
        translated,
        index
      })),
      sourceLanguage: result.data.sourceLanguage,
      targetLanguage,
      provider: 'Google Translate',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('🔥 Batch translation failed:', error.message);
    throw new BadRequestError(`Batch translation failed: ${error.message}`);
  }
}

export async function detectLanguage(params: any) {
  const { text } = params || {};

  if (!text) {
    throw new BadRequestError('Text is required for language detection');
  }

  try {
    const { client, baseUrl } = await getTranslateService();

    // Use Service Account JWT (with DWD) for language detection
    const url = `${baseUrl}/detect`;

    const headers: any = {
      'Content-Type': 'application/json'
    };

    // Add Authorization header using Service Account JWT
    if (client && typeof client.getAccessToken === 'function') {
      try {
        const accessToken = await client.getAccessToken();
        if (accessToken && accessToken.token) {
          headers['Authorization'] = `Bearer ${accessToken.token}`;
        } else {
          throw new Error('Failed to get access token from Service Account');
        }
      } catch (error: any) {
        logger.error('❌ Failed to get access token for language detection:', error.message);
        throw new Error(`Language detection authentication failed: ${error.message}`);
      }
    } else {
      throw new Error('Language detection service not properly configured');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        q: Array.isArray(text) ? text : [text]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Language detection API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json() as any;
    const detections = result.data.detections[0];

    const bestDetection = detections.reduce((best: any, current: any) =>
      current.confidence > (best.confidence || 0) ? current : best
    );

    return ok({
      detectedLanguage: bestDetection.language,
      confidence: bestDetection.confidence,
      languageName: SUPPORTED_LANGUAGES[bestDetection.language as keyof typeof SUPPORTED_LANGUAGES] || bestDetection.language,
      isReliable: bestDetection.confidence > 0.8,
      allDetections: detections.map((d: any) => ({
        language: d.language,
        confidence: d.confidence,
        name: SUPPORTED_LANGUAGES[d.language as keyof typeof SUPPORTED_LANGUAGES] || d.language
      })),
      originalText: text,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    logger.error('🔥 Language detection failed:', error.message);
    throw new BadRequestError(`Language detection failed: ${error.message}`);
  }
}

// Business-specific translation templates for Bali Zero
export async function translateBusinessTemplate(params: any) {
  const {
    templateType = 'visa_info',
    targetLanguage = 'id',
    customData = {}
  } = params || {};

  const templates = {
    visa_info: {
      en: `Welcome to Bali Zero! We help with your ${customData.visaType || 'visa'} application. Processing time: ${customData.processingTime || '5-7 days'}. Contact us: ${customData.contact || '+62 859 0436 9574'}`,
      id: `Selamat datang di Bali Zero! Kami membantu aplikasi ${customData.visaType || 'visa'} Anda. Waktu proses: ${customData.processingTime || '5-7 hari'}. Hubungi kami: ${customData.contact || '+62 859 0436 9574'}`,
      it: `Benvenuti a Bali Zero! Ti aiutiamo con la tua richiesta di ${customData.visaType || 'visto'}. Tempo di elaborazione: ${customData.processingTime || '5-7 giorni'}. Contattaci: ${customData.contact || '+62 859 0436 9574'}`
    },
    company_setup: {
      en: `Bali Zero - Company Setup Services. We establish your ${customData.companyType || 'PT PMA'} in Indonesia. Timeline: ${customData.timeline || '30-45 days'}`,
      id: `Bali Zero - Layanan Pendirian Perusahaan. Kami mendirikan ${customData.companyType || 'PT PMA'} Anda di Indonesia. Jadwal: ${customData.timeline || '30-45 hari'}`,
      it: `Bali Zero - Servizi Costituzione Società. Stabiliamo la tua ${customData.companyType || 'PT PMA'} in Indonesia. Tempistica: ${customData.timeline || '30-45 giorni'}`
    },
    welcome_message: {
      en: `Hello! Welcome to Bali Zero. How can we help you today with visas, company setup, or tax consulting?`,
      id: `Halo! Selamat datang di Bali Zero. Bagaimana kami bisa membantu Anda hari ini dengan visa, pendirian perusahaan, atau konsultasi pajak?`,
      it: `Ciao! Benvenuto a Bali Zero. Come possiamo aiutarti oggi con visti, costituzione società, o consulenza fiscale?`
    }
  };

  const template = templates[templateType as keyof typeof templates];
  if (!template) {
    throw new BadRequestError(`Unknown template type: ${templateType}. Available: ${Object.keys(templates).join(', ')}`);
  }

  const sourceText = template[targetLanguage as keyof typeof template] || template.en;

  return ok({
    templateType,
    targetLanguage,
    text: sourceText,
    customData,
    availableLanguages: Object.keys(template),
    provider: 'Bali Zero Templates',
    timestamp: new Date().toISOString()
  });
}

// Export all handlers
export const translateHandlers = {
  'translate.text': translateText,
  'translate.batch': translateBatch,
  'translate.detect': detectLanguage,
  'translate.template': translateBusinessTemplate
};