import { ok } from "../../utils/response.js";
import { BadRequestError } from "../../utils/errors.js";

type ServiceKey = "visa" | "company" | "tax" | "real-estate" | "property" | "legal";

type DocumentMatrix = {
  title: string;
  required: string[];
  optional?: string[];
  notes?: string[];
};

const DOCUMENT_LIBRARY: Record<ServiceKey, DocumentMatrix> = {
  visa: {
    title: "Visa Application Checklist",
    required: [
      "Passport copy with 6+ months validity",
      "Recent passport photo (white background)",
      "Bank statement (last 3 months)",
      "Return/onward flight itinerary",
      "Accommodation booking or sponsor letter"
    ],
    optional: [
      "Employment contract",
      "Insurance policy covering stay",
      "Supporting invitation letters"
    ],
    notes: [
      "Ensure passport signature matches application",
      "Photos must be taken within the last 6 months",
      "Bank balance should cover projected stay"
    ]
  },
  company: {
    title: "Company Incorporation Checklist",
    required: [
      "Passport copies of shareholders",
      "Shareholder CV/resume",
      "Company name options (3 choices)",
      "Business plan outline",
      "Capitalisation statement"
    ],
    optional: [
      "Office lease letter",
      "Existing NPWP (if applicable)",
      "Letter of intent with partners"
    ],
    notes: [
      "Capital proof can be bank statement or auditor letter",
      "Reserve unique company names to avoid delays",
      "Provide industry classification (KBLI) in advance"
    ]
  },
  tax: {
    title: "Tax Compliance Checklist",
    required: [
      "Latest NPWP certificate",
      "Financial statements (last 12 months)",
      "Payroll records",
      "Vendor invoices",
      "Bank statements"
    ],
    optional: [
      "Tax planning reports",
      "Historical tax filings",
      "Supporting contracts"
    ],
    notes: [
      "Ensure all invoices have valid tax serial numbers",
      "Maintain digital backup of original documents",
      "Cross-check withholding tax records"
    ]
  },
  "real-estate": {
    title: "Real Estate Legal Checklist",
    required: [
      "Land certificate (SHM/HGB)",
      "Seller's KTP & KK",
      "Tax receipts (PBB)",
      "Zoning confirmation (SLF/IMB)",
      "Existing lease agreements"
    ],
    optional: [
      "Power of attorney (if represented)",
      "Company deed for corporate seller",
      "Environmental clearance"
    ],
    notes: [
      "Verify certificate history for encumbrances",
      "Ensure seller is legally authorised to transact",
      "Perform site inspection before final payment"
    ]
  },
  property: {
    title: "Property Legal Checklist",
    required: [
      "Current land certificate",
      "Notary draft agreements",
      "Nominee structure documents",
      "Tax clearance letters",
      "Latest utility bills"
    ],
    optional: [
      "Survey reports",
      "Environmental assessments",
      "Insurance policies"
    ],
    notes: [
      "Align nominee agreements with local compliance",
      "Budget for annual lease renewals",
      "Prepare bilingual agreements if foreign stakeholders"
    ]
  },
  legal: {
    title: "Legal Engagement Checklist",
    required: [
      "Client identification documents",
      "Scope of work description",
      "Relevant contracts or drafts",
      "Existing correspondence",
      "Supporting evidence (if litigation)"
    ],
    optional: [
      "Transactional history",
      "Board resolutions",
      "Witness statements"
    ],
    notes: [
      "Clarify desired outcomes before drafting",
      "Provide deadlines from counterparties",
      "Share previous legal opinions if available"
    ]
  }
};

const ROUTING_MESSAGES: Record<string, string> = {
  visa: "Posso guidarti su tipologie di visto, requisiti e tempistiche.",
  company: "Posso spiegarti iter, costi e documenti per aprire una società.",
  tax: "Ti aiuto con registrazioni fiscali, adempimenti e dichiarazioni.",
  property: "Posso supportarti con verifiche legali, contratti e due diligence immobiliare.",
  urgent: "Per urgenze immediate ti consiglio WhatsApp: +62 859 0436 9574.",
  general: "Posso fornirti informazioni sui servizi Bali Zero e metterti in contatto con il team dedicato."
};

const ROUTING_CAPABILITIES = [
  "Generare preventivi",
  "Salvare richieste di contatto",
  "Fornire checklist documentali",
  "Organizzare consulti con il team",
  "Gestire follow-up automatici"
];

function resolveKey(raw?: string): ServiceKey {
  const input = (raw || "visa").toLowerCase();
  if (input.includes("visa")) return "visa";
  if (input.includes("company") || input.includes("pma")) return "company";
  if (input.includes("tax")) return "tax";
  if (input.includes("property") || input.includes("real")) return "real-estate";
  if (input.includes("legal")) return "legal";
  return "visa";
}

export function documentPrepare(params: { service?: string } = {}) {
  const profile = DOCUMENT_LIBRARY[resolveKey(params.service)];
  if (!profile) {
    throw new BadRequestError("Service type required for document preparation");
  }

  return ok({
    checklist: profile.title,
    required: profile.required,
    optional: profile.optional || [],
    notes: profile.notes || [],
    submission: "Invia la documentazione completa a docs@balizero.com",
    reviewTime: "Verifica preliminare entro 24 ore lavorative"
  });
}

export function assistantRoute(params: { intent?: string; inquiry?: string } = {}) {
  const intentKey = resolveKey(params.intent);
  const routing = ROUTING_MESSAGES[intentKey] || ROUTING_MESSAGES.general;
  const inquiry = (params.inquiry || "").trim();

  return ok({
    intent: intentKey,
    message: routing,
    capabilities: ROUTING_CAPABILITIES,
    inquiryAnalyzed: inquiry ? `Analizzato: "${inquiry.slice(0, 100)}${inquiry.length > 100 ? "…" : ""}"` : "Nessuna richiesta specificata",
    nextSteps: [
      "Chiedi un preventivo dettagliato",
      "Richiedi la checklist documentale",
      "Programma una call con il team Bali Zero",
      "Ricevi aggiornamenti via email o WhatsApp"
    ]
  });
}
