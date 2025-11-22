import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';

type ServiceKey = 'visa' | 'company' | 'tax' | 'real-estate' | 'property' | 'legal';

type DocumentMatrix = {
  title: string;
  required: string[];
  optional?: string[];
  notes?: string[];
};

// DOCUMENT_LIBRARY removed - all document checklists, required/optional documents,
// and service-specific notes are now stored in Qdrant/PostgreSQL and retrieved via RAG backend
// This ensures data accuracy and eliminates hardcoded values from the codebase
const DOCUMENT_LIBRARY: Record<ServiceKey, DocumentMatrix> = {} as any; // Placeholder - data from database

const ROUTING_MESSAGES: Record<string, string> = {
  visa: 'Posso guidarti su tipologie di visto, requisiti e tempistiche.',
  company: 'Posso spiegarti iter, costi e documenti per aprire una società.',
  tax: 'Ti aiuto con registrazioni fiscali, adempimenti e dichiarazioni.',
  property: 'Posso supportarti con verifiche legali, contratti e due diligence immobiliare.',
  urgent: 'Per urgenze immediate ti consiglio WhatsApp: +62 859 0436 9574.',
  general:
    'Posso fornirti informazioni sui servizi Bali Zero e metterti in contatto con il team dedicato.',
};

const ROUTING_CAPABILITIES = [
  'Generare preventivi',
  'Salvare richieste di contatto',
  'Fornire checklist documentali',
  'Organizzare consulti con il team',
  'Gestire follow-up automatici',
];

function resolveKey(raw?: string): ServiceKey {
  const input = (raw || 'visa').toLowerCase();
  if (input.includes('visa')) return 'visa';
  if (input.includes('company') || input.includes('pma')) return 'company';
  if (input.includes('tax')) return 'tax';
  if (input.includes('property') || input.includes('real')) return 'real-estate';
  if (input.includes('legal')) return 'legal';
  return 'visa';
}

export function documentPrepare(params: { service?: string } = {}) {
  const serviceKey = resolveKey(params.service);
  if (!serviceKey) {
    throw new BadRequestError('Service type required for document preparation');
  }

  // Document checklists are now retrieved from RAG backend (Qdrant/PostgreSQL)
  return ok({
    service: serviceKey,
    message: 'Document checklist data is stored in the database. Please query the RAG backend for accurate, up-to-date document requirements.',
    source: 'RAG backend (Qdrant/PostgreSQL)',
    submission: 'Invia la documentazione completa a docs@balizero.com',
    reviewTime: 'Verifica preliminare entro 24 ore lavorative',
  });
}

export function assistantRoute(params: { intent?: string; inquiry?: string } = {}) {
  const intentKey = resolveKey(params.intent);
  const routing = ROUTING_MESSAGES[intentKey] || ROUTING_MESSAGES.general;
  const inquiry = (params.inquiry || '').trim();

  return ok({
    intent: intentKey,
    message: routing,
    capabilities: ROUTING_CAPABILITIES,
    inquiryAnalyzed: inquiry
      ? `Analizzato: "${inquiry.slice(0, 100)}${inquiry.length > 100 ? '…' : ''}"`
      : 'Nessuna richiesta specificata',
    nextSteps: [
      'Chiedi un preventivo dettagliato',
      'Richiedi la checklist documentale',
      'Programma una call con il team Bali Zero',
      'Ricevi aggiornamenti via email o WhatsApp',
    ],
  });
}
