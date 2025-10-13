// Creative & Artistic Handlers for ZANTARA v5.2.0 - Simplified Version
// Vision AI, Translation & Creative tools for Bali Zero
import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";

// Minimal API response types (to avoid 'any' where easy)
type VisionAnnotateResponse = {
  responses: Array<{
    textAnnotations?: Array<{ description: string; confidence?: number; boundingPoly?: BoundingPoly }>;
    labelAnnotations?: Array<{ description: string; score: number; topicality?: string }>;
    faceAnnotations?: Array<{
      detectionConfidence: number;
      joyLikelihood: string; sorrowLikelihood: string; angerLikelihood: string; surpriseLikelihood: string;
      boundingPoly: BoundingPoly;
    }>;
    localizedObjectAnnotations?: Array<{ name: string; score: number; boundingPoly: BoundingPoly }>;
  }>;
};

// Refined entities for clean API surface
type Vertex = { x?: number; y?: number };
type BoundingPoly = { vertices?: Vertex[]; normalizedVertices?: Vertex[] };

export type VisionText = { text: string; confidence?: number; boundingBox?: BoundingPoly };
export type VisionLabel = { label: string; confidence: number; category?: string };

export enum EmotionLikelihood {
  UNKNOWN = 'UNKNOWN',
  VERY_UNLIKELY = 'VERY_UNLIKELY',
  UNLIKELY = 'UNLIKELY',
  POSSIBLE = 'POSSIBLE',
  LIKELY = 'LIKELY',
  VERY_LIKELY = 'VERY_LIKELY'
}

export type FaceEmotion = {
  joy: EmotionLikelihood;
  sorrow: EmotionLikelihood;
  anger: EmotionLikelihood;
  surprise: EmotionLikelihood;
};
export type VisionFace = { confidence: number; emotions: FaceEmotion; boundingBox: BoundingPoly };
export type VisionEntity = { name: string; confidence: number; box: BoundingPoly };

type AnalyzeSentimentResponse = { documentSentiment?: { score?: number; magnitude?: number } };
import { getGoogleService } from "../../services/google-auth-service.js";

// =============================================================================
// 🎨 VISION AI - Creative Image Processing
// =============================================================================

async function getVisionService() {
  try {
    const client = await getGoogleService(
      (auth) => auth,
      ['https://www.googleapis.com/auth/cloud-platform'],
      'Vision AI'
    );

    if (!client) {
      throw new BadRequestError('Vision AI service not available');
    }

    return {
      client,
      baseUrl: 'https://vision.googleapis.com/v1'
    };
  } catch (error: any) {
    console.error('🔥 Vision AI service setup failed:', error.message);
    throw new BadRequestError('Vision AI service not available');
  }
}

export async function visionAnalyzeImage(params: any) {
  const {
    imageBase64,
    imageUrl,
    features = ['TEXT_DETECTION', 'LABEL_DETECTION', 'FACE_DETECTION'],
    maxResults = 10
  } = params || {};

  if (!imageBase64 && !imageUrl) {
    throw new BadRequestError('Either imageBase64 or imageUrl is required');
  }

  try {
    const { client, baseUrl } = await getVisionService();
    const accessToken = await client.getAccessToken();

    const image = imageBase64 ?
      { content: imageBase64 } :
      { source: { imageUri: imageUrl } };

    const requestBody = {
      requests: [{
        image,
        features: features.map((feature: string) => ({
          type: feature,
          maxResults
        }))
      }]
    };

    const response = await fetch(`${baseUrl}/images:annotate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Vision API error: ${response.status}`);
    }

    const result: VisionAnnotateResponse = await response.json();
    const annotations = result.responses?.[0] || {} as any;

    return ok<{ analysis: { text: VisionText[]; labels: VisionLabel[]; faces: VisionFace[]; objects: VisionEntity[] }; metadata: any }>({
      analysis: {
        text: (annotations.textAnnotations || []).map((t: any): VisionText => ({
          text: t.description,
          confidence: t.confidence,
          boundingBox: t.boundingPoly
        })),
        labels: (annotations.labelAnnotations || []).map((l: any): VisionLabel => ({
          label: l.description,
          confidence: l.score,
          category: l.topicality
        })),
        faces: (annotations.faceAnnotations || []).map((f: any): VisionFace => ({
          confidence: f.detectionConfidence,
          emotions: {
            joy: f.joyLikelihood as EmotionLikelihood,
            sorrow: f.sorrowLikelihood as EmotionLikelihood,
            anger: f.angerLikelihood as EmotionLikelihood,
            surprise: f.surpriseLikelihood as EmotionLikelihood
          },
          boundingBox: f.boundingPoly
        })),
        objects: (annotations.localizedObjectAnnotations || []).map((o: any): VisionEntity => ({
          name: o.name,
          confidence: o.score,
          box: o.boundingPoly
        }))
      },
      metadata: {
        provider: 'Google Vision AI',
        timestamp: new Date().toISOString(),
        features: features
      }
    });

  } catch (error: any) {
    console.error('🔥 Vision analysis failed:', error.message);
    throw new BadRequestError(`Vision analysis failed: ${error.message}`);
  }
}

export async function visionExtractDocuments(params: any) {
  const { imageBase64, imageUrl, documentType = 'PASSPORT' } = params || {};

  if (!imageBase64 && !imageUrl) {
    throw new BadRequestError('Either imageBase64 or imageUrl is required');
  }

  try {
    // Use DOCUMENT_TEXT_DETECTION for better OCR on documents
    const result = await visionAnalyzeImage({
      imageBase64,
      imageUrl,
      features: ['DOCUMENT_TEXT_DETECTION', 'TEXT_DETECTION'],
      maxResults: 1
    });

    const fullText = result.data.analysis.text[0]?.text || '';

    // Document parsing patterns for Bali Zero business
    const patterns: Record<string, Record<string, RegExp>> = {
      PASSPORT: {
        passportNumber: /(?:Passport\s*No\.?\s*|P<[A-Z]{3})([A-Z0-9]{6,9})/i,
        nationality: /(?:Nationality|Country)[:\s]*([A-Z\s]+)/i,
        name: /(?:Name|Given\s+Names)[:\s]*([A-Z\s]+)/i,
        dateOfBirth: /(?:Date\s+of\s+Birth|DOB)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i,
        expiry: /(?:Date\s+of\s+Expiry|Expiry)[:\s]*(\d{2}[-\/]\d{2}[-\/]\d{4})/i
      },
      ID_CARD: {
        idNumber: /(?:ID\s*No\.?\s*|NIK\s*)[:\s]*(\d{16})/i,
        name: /(?:Name|Nama)[:\s]*([A-Z\s]+)/i,
        address: /(?:Address|Alamat)[:\s]*([A-Z\s,0-9]+)/i,
        dateOfBirth: /(?:Born|Lahir)[:\s]*([A-Z\s,0-9-\/]+)/i
      }
    };

    const currentPatterns = patterns[documentType] || patterns.PASSPORT;
    const extractedData: Record<string, string> = {};

    if (currentPatterns && typeof currentPatterns === 'object') {
      for (const [field, pattern] of Object.entries(currentPatterns)) {
        const match = fullText.match(pattern);
        extractedData[field] = match?.[1] ? match[1].trim() : '';
      }
    }

    return ok({
      documentType,
      extractedText: fullText,
      structuredData: extractedData,
      confidence: result.data.analysis.text[0]?.confidence || 0,
      isValid: Object.values(extractedData).filter(v => v).length > 2,
      metadata: {
        provider: 'Google Vision AI + Bali Zero Parsing',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('🔥 Document extraction failed:', error.message);
    throw new BadRequestError(`Document extraction failed: ${error.message}`);
  }
}

// =============================================================================
// 🎵 SPEECH AI - Simplified REST API Implementation
// =============================================================================

export async function speechTranscribe(params: any) {
  const {
    audioBase64,
    audioUrl,
    language = 'en-US'
  } = params || {};

  if (!audioBase64 && !audioUrl) {
    throw new BadRequestError('Either audioBase64 or audioUrl is required');
  }

  try {
    const { client } = await getVisionService(); // Reuse auth setup
    const accessToken = await client.getAccessToken();

    const audio = audioBase64 ?
      { content: audioBase64 } :
      { uri: audioUrl };

    const config = {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: language,
      enableAutomaticPunctuation: true,
      model: 'latest_long'
    };

    const requestBody = {
      audio,
      config
    };

    const response = await fetch('https://speech.googleapis.com/v1/speech:recognize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Speech API error: ${response.status}`);
    }

    const result = await response.json();
    const transcription = (result.results || [])
      .map((r: any) => r.alternatives?.[0]?.transcript)
      .join('\n') || '';

    return ok({
      transcription,
      confidence: result.results?.[0]?.alternatives?.[0]?.confidence || 0,
      detectedLanguage: result.results?.[0]?.languageCode || language,
      metadata: {
        provider: 'Google Speech-to-Text',
        timestamp: new Date().toISOString(),
        originalLanguage: language
      }
    });

  } catch (error: any) {
    console.error('🔥 Speech transcription failed:', error.message);
    throw new BadRequestError(`Speech transcription failed: ${error.message}`);
  }
}

export async function speechSynthesize(params: any) {
  const {
    text,
    language = 'en-US',
    voice = 'en-US-Standard-A'
  } = params || {};

  if (!text) {
    throw new BadRequestError('Text is required for speech synthesis');
  }

  try {
    const { client } = await getVisionService(); // Reuse auth setup
    const accessToken = await client.getAccessToken();

    const requestBody = {
      input: { text },
      voice: {
        languageCode: language,
        name: voice
      },
      audioConfig: {
        audioEncoding: 'MP3'
      }
    };

    const response = await fetch('https://texttospeech.googleapis.com/v1/text:synthesize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Text-to-Speech API error: ${response.status}`);
    }

    const result: any = await response.json();

    return ok({
      audioBase64: result?.audioContent,
      originalText: text,
      voice: {
        language,
        name: voice
      },
      metadata: {
        provider: 'Google Text-to-Speech',
        timestamp: new Date().toISOString(),
        format: 'MP3'
      }
    });

  } catch (error: any) {
    console.error('🔥 Speech synthesis failed:', error.message);
    throw new BadRequestError(`Speech synthesis failed: ${error.message}`);
  }
}

// =============================================================================
// 🧠 NATURAL LANGUAGE - Simplified Implementation
// =============================================================================

export async function languageAnalyzeSentiment(params: any) {
  const { text } = params || {};

  if (!text) {
    throw new BadRequestError('Text is required for sentiment analysis');
  }

  try {
    const { client } = await getVisionService(); // Reuse auth setup
    const accessToken = await client.getAccessToken();

    const requestBody = {
      document: {
        content: text,
        type: 'PLAIN_TEXT'
      }
    };

    const response = await fetch('https://language.googleapis.com/v1/documents:analyzeSentiment', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error(`Language API error: ${response.status}`);
    }

    const result: AnalyzeSentimentResponse = await response.json();
    const sentiment = result.documentSentiment || {};

    return ok({
      overallSentiment: {
        score: sentiment?.score || 0, // -1 to 1
        magnitude: sentiment?.magnitude || 0, // 0 to infinity
        label: sentiment?.score > 0.1 ? 'POSITIVE' :
               sentiment?.score < -0.1 ? 'NEGATIVE' : 'NEUTRAL'
      },
      businessInsights: {
        customerSatisfaction: sentiment?.score > 0.3 ? 'High' :
                              sentiment?.score < -0.3 ? 'Low' : 'Medium',
        recommendedAction: sentiment?.score < -0.2 ? 'Follow-up required' :
                          sentiment?.score > 0.5 ? 'Potential upsell' : 'Monitor',
        priority: sentiment?.magnitude > 0.8 ? 'High' : 'Normal'
      },
      metadata: {
        provider: 'Google Natural Language AI',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('🔥 Sentiment analysis failed:', error.message);
    throw new BadRequestError(`Sentiment analysis failed: ${error.message}`);
  }
}

// Export all creative handlers
export const creativeHandlers = {
  'vision.analyze': visionAnalyzeImage,
  'vision.extract': visionExtractDocuments,
  'speech.transcribe': speechTranscribe,
  'speech.synthesize': speechSynthesize,
  'language.sentiment': languageAnalyzeSentiment
};
