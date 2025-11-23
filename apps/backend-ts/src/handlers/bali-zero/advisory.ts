import { ok } from '../../utils/response.js';
import { BadRequestError } from '../../utils/errors.js';

type ServiceKey = 'visa' | 'company' | 'tax' | 'real-estate' | 'property' | 'legal';


// All document checklists, required/optional documents,
// and service-specific notes are stored in Qdrant/PostgreSQL and retrieved via RAG backend
// This ensures data accuracy and eliminates hardcoded values from the codebase

// ROUTING_MESSAGES and ROUTING_CAPABILITIES removed
// All routing messages, capabilities, and service-specific information
// are stored in Qdrant/PostgreSQL and retrieved via RAG backend

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

  // Document checklists, submission instructions, and review times
  // are now retrieved from RAG backend (Qdrant/PostgreSQL)
  return ok({
    service: serviceKey,
    message: 'Document checklist data is stored in the database. Please query the RAG backend for accurate, up-to-date document requirements.',
    source: 'RAG backend (Qdrant/PostgreSQL)',
    note: 'All document requirements, submission instructions, and review times are in the database',
  });
}

export function assistantRoute(params: { intent?: string; inquiry?: string } = {}) {
  const intentKey = resolveKey(params.intent);
  const inquiry = (params.inquiry || '').trim();

  // All routing messages, capabilities, and next steps
  // are stored in Qdrant/PostgreSQL and retrieved via RAG backend
  return ok({
    intent: intentKey,
    source: 'RAG backend (Qdrant/PostgreSQL)',
    message: 'Routing information is stored in the database. Please query the RAG backend for service-specific routing.',
    inquiryAnalyzed: inquiry
      ? `Analizzato: "${inquiry.slice(0, 100)}${inquiry.length > 100 ? '…' : ''}"`
      : 'Nessuna richiesta specificata',
    note: 'All capabilities, next steps, and service-specific messages are in the database',
  });
}
