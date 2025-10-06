/**
 * HANDLERS INTROSPECTION
 * Exposes complete handler registry for RAG backend tool use
 */

import { ok } from "../../utils/response.js";

/**
 * Handler metadata extracted from JSDoc comments in router.ts
 */
interface HandlerMetadata {
  key: string;
  description: string;
  category: string;
  params?: Record<string, {
    type: string;
    description: string;
    required: boolean;
  }>;
  returns?: string;
  example?: string;
}

/**
 * Complete handler registry with categorization
 */
const HANDLER_REGISTRY: Record<string, HandlerMetadata> = {
  // === IDENTITY & ONBOARDING ===
  "identity.resolve": {
    key: "identity.resolve",
    category: "identity",
    description: "Resolve user identity from email or identity hint, creating profile if needed",
    params: {
      email: { type: "string", description: "User email address", required: false },
      identity_hint: { type: "string", description: "Identity hint (mapped to email)", required: false },
      metadata: { type: "object", description: "Additional user metadata (name, company, phone)", required: false }
    },
    returns: "{ ok: boolean, userId: string, email: string, profile: object, isNew: boolean }"
  },
  "onboarding.start": {
    key: "onboarding.start",
    category: "identity",
    description: "Start AMBARADAM onboarding process",
    params: {
      email: { type: "string", description: "User email", required: true }
    }
  },

  // === GOOGLE WORKSPACE ===
  "gmail.read": {
    key: "gmail.read",
    category: "google-workspace",
    description: "Read Gmail messages",
    params: {
      query: { type: "string", description: "Gmail search query", required: false },
      maxResults: { type: "number", description: "Max messages to return", required: false }
    }
  },
  "gmail.send": {
    key: "gmail.send",
    category: "google-workspace",
    description: "Send email via Gmail",
    params: {
      to: { type: "string", description: "Recipient email", required: true },
      subject: { type: "string", description: "Email subject", required: true },
      body: { type: "string", description: "Email body (text or HTML)", required: true }
    }
  },
  "gmail.search": {
    key: "gmail.search",
    category: "google-workspace",
    description: "Search Gmail messages content",
    params: {
      query: { type: "string", description: "Search query", required: true }
    }
  },
  "drive.upload": {
    key: "drive.upload",
    category: "google-workspace",
    description: "Upload file to Google Drive",
    params: {
      fileName: { type: "string", description: "File name", required: true },
      content: { type: "string", description: "File content (base64 or text)", required: true },
      mimeType: { type: "string", description: "MIME type", required: false }
    }
  },
  "drive.list": {
    key: "drive.list",
    category: "google-workspace",
    description: "List files in Google Drive",
    params: {
      query: { type: "string", description: "Drive search query", required: false },
      pageSize: { type: "number", description: "Results per page", required: false }
    }
  },
  "drive.read": {
    key: "drive.read",
    category: "google-workspace",
    description: "Read/download file from Google Drive",
    params: {
      fileId: { type: "string", description: "Google Drive file ID", required: true }
    }
  },
  "drive.search": {
    key: "drive.search",
    category: "google-workspace",
    description: "Search file contents in Google Drive",
    params: {
      query: { type: "string", description: "Search query", required: true }
    }
  },
  "calendar.create": {
    key: "calendar.create",
    category: "google-workspace",
    description: "Create Google Calendar event",
    params: {
      summary: { type: "string", description: "Event title", required: true },
      start: { type: "string", description: "Start datetime (ISO 8601)", required: true },
      end: { type: "string", description: "End datetime (ISO 8601)", required: true },
      description: { type: "string", description: "Event description", required: false }
    }
  },
  "calendar.list": {
    key: "calendar.list",
    category: "google-workspace",
    description: "List Google Calendar events",
    params: {
      timeMin: { type: "string", description: "Start time filter (ISO 8601)", required: false },
      maxResults: { type: "number", description: "Max events to return", required: false }
    }
  },
  "calendar.get": {
    key: "calendar.get",
    category: "google-workspace",
    description: "Get specific Google Calendar event",
    params: {
      eventId: { type: "string", description: "Calendar event ID", required: true }
    }
  },
  "sheets.read": {
    key: "sheets.read",
    category: "google-workspace",
    description: "Read data from Google Sheets",
    params: {
      spreadsheetId: { type: "string", description: "Spreadsheet ID", required: true },
      range: { type: "string", description: "A1 notation range", required: true }
    }
  },
  "sheets.append": {
    key: "sheets.append",
    category: "google-workspace",
    description: "Append data to Google Sheets",
    params: {
      spreadsheetId: { type: "string", description: "Spreadsheet ID", required: true },
      range: { type: "string", description: "A1 notation range", required: true },
      values: { type: "array", description: "2D array of values to append", required: true }
    }
  },
  "sheets.create": {
    key: "sheets.create",
    category: "google-workspace",
    description: "Create new Google Spreadsheet",
    params: {
      title: { type: "string", description: "Spreadsheet title", required: true }
    }
  },
  "docs.create": {
    key: "docs.create",
    category: "google-workspace",
    description: "Create Google Docs document",
    params: {
      title: { type: "string", description: "Document title", required: true },
      content: { type: "string", description: "Initial content", required: false }
    }
  },
  "docs.read": {
    key: "docs.read",
    category: "google-workspace",
    description: "Read Google Docs document",
    params: {
      documentId: { type: "string", description: "Document ID", required: true }
    }
  },
  "docs.update": {
    key: "docs.update",
    category: "google-workspace",
    description: "Update Google Docs document",
    params: {
      documentId: { type: "string", description: "Document ID", required: true },
      content: { type: "string", description: "New content to insert", required: true }
    }
  },
  "slides.create": {
    key: "slides.create",
    category: "google-workspace",
    description: "Create Google Slides presentation",
    params: {
      title: { type: "string", description: "Presentation title", required: true }
    }
  },
  "slides.read": {
    key: "slides.read",
    category: "google-workspace",
    description: "Read Google Slides presentation",
    params: {
      presentationId: { type: "string", description: "Presentation ID", required: true }
    }
  },
  "slides.update": {
    key: "slides.update",
    category: "google-workspace",
    description: "Update Google Slides presentation",
    params: {
      presentationId: { type: "string", description: "Presentation ID", required: true },
      slideId: { type: "string", description: "Slide ID to update", required: true },
      content: { type: "string", description: "New content", required: true }
    }
  },
  "contacts.list": {
    key: "contacts.list",
    category: "google-workspace",
    description: "List Google Contacts",
    params: {
      pageSize: { type: "number", description: "Results per page", required: false }
    }
  },
  "contacts.create": {
    key: "contacts.create",
    category: "google-workspace",
    description: "Create Google Contact",
    params: {
      name: { type: "string", description: "Contact name", required: true },
      email: { type: "string", description: "Contact email", required: false },
      phone: { type: "string", description: "Contact phone", required: false }
    }
  },

  // === AI SERVICES ===
  "ai.chat": {
    key: "ai.chat",
    category: "ai",
    description: "AI chat with automatic fallback (OpenAI → Claude → Gemini)",
    params: {
      message: { type: "string", description: "User message", required: true },
      model: { type: "string", description: "Preferred model", required: false }
    }
  },
  "openai.chat": {
    key: "openai.chat",
    category: "ai",
    description: "Chat with OpenAI GPT models",
    params: {
      message: { type: "string", description: "User message", required: true },
      model: { type: "string", description: "Model (gpt-4, gpt-3.5-turbo)", required: false }
    }
  },
  "claude.chat": {
    key: "claude.chat",
    category: "ai",
    description: "Chat with Anthropic Claude",
    params: {
      message: { type: "string", description: "User message", required: true },
      model: { type: "string", description: "Model (claude-3-opus, sonnet, haiku)", required: false }
    }
  },
  "gemini.chat": {
    key: "gemini.chat",
    category: "ai",
    description: "Chat with Google Gemini",
    params: {
      message: { type: "string", description: "User message", required: true }
    }
  },
  "cohere.chat": {
    key: "cohere.chat",
    category: "ai",
    description: "Chat with Cohere Command",
    params: {
      message: { type: "string", description: "User message", required: true }
    }
  },

  // === MEMORY & PERSISTENCE ===
  "memory.save": {
    key: "memory.save",
    category: "memory",
    description: "Save information to user memory (Firestore)",
    params: {
      userId: { type: "string", description: "User ID", required: true },
      content: { type: "string", description: "Content to save", required: true },
      metadata: { type: "object", description: "Additional metadata", required: false }
    }
  },
  "memory.retrieve": {
    key: "memory.retrieve",
    category: "memory",
    description: "Retrieve user memory entries",
    params: {
      userId: { type: "string", description: "User ID", required: true },
      limit: { type: "number", description: "Max results", required: false }
    }
  },
  "memory.search": {
    key: "memory.search",
    category: "memory",
    description: "Search user memory by keyword",
    params: {
      userId: { type: "string", description: "User ID", required: true },
      query: { type: "string", description: "Search query", required: true }
    }
  },
  "memory.list": {
    key: "memory.list",
    category: "memory",
    description: "List all memory entries for user",
    params: {
      userId: { type: "string", description: "User ID", required: true }
    }
  },

  // === COMMUNICATION ===
  "whatsapp.send": {
    key: "whatsapp.send",
    category: "communication",
    description: "Send WhatsApp message",
    params: {
      to: { type: "string", description: "Recipient phone number", required: true },
      message: { type: "string", description: "Message text", required: true }
    }
  },
  "instagram.send": {
    key: "instagram.send",
    category: "communication",
    description: "Send Instagram direct message",
    params: {
      to: { type: "string", description: "Instagram user ID", required: true },
      message: { type: "string", description: "Message text", required: true }
    }
  },
  "slack.notify": {
    key: "slack.notify",
    category: "communication",
    description: "Send Slack notification",
    params: {
      channel: { type: "string", description: "Slack channel", required: true },
      message: { type: "string", description: "Message text", required: true }
    }
  },
  "discord.notify": {
    key: "discord.notify",
    category: "communication",
    description: "Send Discord notification",
    params: {
      channel: { type: "string", description: "Discord channel ID", required: true },
      message: { type: "string", description: "Message text", required: true }
    }
  },

  // === BALI ZERO SERVICES ===
  "bali.zero.pricing": {
    key: "bali.zero.pricing",
    category: "bali-zero",
    description: "Get Bali Zero pricing for services",
    params: {
      service: { type: "string", description: "Service name (e.g., 'PT PMA', 'KITAS')", required: false }
    }
  },
  "kbli.lookup": {
    key: "kbli.lookup",
    category: "bali-zero",
    description: "Lookup KBLI business classification code",
    params: {
      query: { type: "string", description: "Business activity description", required: true }
    }
  },
  "team.list": {
    key: "team.list",
    category: "bali-zero",
    description: "List Bali Zero team members",
    params: {
      department: { type: "string", description: "Filter by department", required: false }
    }
  },

  // === RAG SYSTEM ===
  "rag.query": {
    key: "rag.query",
    category: "rag",
    description: "Query RAG knowledge base (forwards to Python backend)",
    params: {
      query: { type: "string", description: "Search query", required: true },
      collection: { type: "string", description: "ChromaDB collection", required: false }
    }
  },
  "bali.zero.chat": {
    key: "bali.zero.chat",
    category: "rag",
    description: "Chat with Bali Zero AI (RAG + LLM)",
    params: {
      query: { type: "string", description: "User question", required: true },
      conversation_history: { type: "array", description: "Previous messages", required: false }
    }
  },
};

/**
 * Get all handlers metadata
 */
export async function getAllHandlers() {
  return ok({
    total: Object.keys(HANDLER_REGISTRY).length,
    handlers: HANDLER_REGISTRY,
    categories: getCategories()
  });
}

/**
 * Get handlers by category
 */
export async function getHandlersByCategory(params: { category: string }) {
  const filtered = Object.values(HANDLER_REGISTRY).filter(
    h => h.category === params.category
  );

  return ok({
    category: params.category,
    count: filtered.length,
    handlers: filtered
  });
}

/**
 * Get handler details
 */
export async function getHandlerDetails(params: { key: string }) {
  const handler = HANDLER_REGISTRY[params.key];

  if (!handler) {
    return {
      ok: false,
      error: `Handler '${params.key}' not found`
    };
  }

  return ok(handler);
}

/**
 * Get all categories
 */
function getCategories() {
  const categories = new Set(Object.values(HANDLER_REGISTRY).map(h => h.category));
  return Array.from(categories).sort();
}

/**
 * Generate Anthropic tool definitions for all handlers
 */
export async function getAnthropicToolDefinitions() {
  const tools = Object.values(HANDLER_REGISTRY).map(handler => ({
    name: handler.key.replace(/\./g, '_'), // Anthropic doesn't allow dots in tool names
    description: handler.description,
    input_schema: {
      type: "object",
      properties: handler.params || {},
      required: Object.entries(handler.params || {})
        .filter(([_, meta]) => meta.required)
        .map(([name, _]) => name)
    }
  }));

  return ok({
    total: tools.length,
    tools
  });
}
