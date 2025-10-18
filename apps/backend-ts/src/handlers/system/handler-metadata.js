/**
 * Centralised handler metadata for system introspection/tooling.
 * Generated from router JSDoc descriptions and shared across services.
 */
/**
 * Complete handler registry with categorization
 */
export const HANDLER_REGISTRY = {
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
    // === MEMORY PHASE 1&2 (NEW - Priority HIGH) ===
    "memory.search.semantic": {
        key: "memory.search.semantic",
        category: "memory-advanced",
        description: "Semantic search using vector embeddings (searches by meaning, not keywords)",
        params: {
            query: { type: "string", description: "Search query (natural language)", required: true },
            userId: { type: "string", description: "Optional filter by user", required: false },
            limit: { type: "number", description: "Max results (default 10)", required: false }
        },
        returns: "{ ok: boolean, results: Array<{userId, content, similarity, entities}>, count: number }"
    },
    "memory.search.hybrid": {
        key: "memory.search.hybrid",
        category: "memory-advanced",
        description: "Hybrid search (combines keyword + semantic for best results)",
        params: {
            query: { type: "string", description: "Search query", required: true },
            userId: { type: "string", description: "Optional filter by user", required: false },
            limit: { type: "number", description: "Max results (default 10)", required: false }
        },
        returns: "{ ok: boolean, results: Array, count: number, sources: {semantic, keyword, combined} }"
    },
    "memory.entity.info": {
        key: "memory.entity.info",
        category: "memory-advanced",
        description: "Get complete entity profile (semantic facts + episodic events)",
        params: {
            entity: { type: "string", description: "Entity name (zero, zantara, pricing, etc)", required: true },
            category: { type: "string", description: "Entity category (people/projects/skills/companies)", required: false }
        },
        returns: "{ ok: boolean, entity: string, semantic: {memories, count}, episodic: {events, count} }"
    },
    "memory.event.save": {
        key: "memory.event.save",
        category: "memory-advanced",
        description: "Save timestamped event to episodic memory",
        params: {
            userId: { type: "string", description: "User ID", required: true },
            event: { type: "string", description: "Event description", required: true },
            type: { type: "string", description: "Event type (deployment/meeting/task/decision)", required: false },
            metadata: { type: "object", description: "Additional event metadata", required: false },
            timestamp: { type: "string", description: "ISO timestamp (defaults to now)", required: false }
        },
        returns: "{ ok: boolean, eventId: string, saved: boolean, entities: Array }"
    },
    "memory.entities": {
        key: "memory.entities",
        category: "memory-advanced",
        description: "Get all entities (people/projects/skills) related to a user",
        params: {
            userId: { type: "string", description: "User ID", required: true }
        },
        returns: "{ ok: boolean, entities: {people, projects, skills, companies}, total: number }"
    },
    "memory.search.entity": {
        key: "memory.search.entity",
        category: "memory-advanced",
        description: "Search memories by entity (person, project, skill)",
        params: {
            entity: { type: "string", description: "Entity name to search for", required: true },
            category: { type: "string", description: "Entity category (people/projects/skills/companies)", required: false },
            limit: { type: "number", description: "Max results (default 20)", required: false }
        },
        returns: "{ ok: boolean, entity: string, memories: Array, count: number }"
    },
    // === BUSINESS OPERATIONS (NEW - Priority HIGH) ===
    "lead.save": {
        key: "lead.save",
        category: "business",
        description: "Save new lead from chat conversation for follow-up",
        params: {
            name: { type: "string", description: "Lead name", required: false },
            email: { type: "string", description: "Lead email address", required: false },
            service: { type: "string", description: "Service type (visa/company/tax/real-estate)", required: true },
            details: { type: "string", description: "Service details or requirements", required: false },
            nationality: { type: "string", description: "Lead nationality", required: false },
            urgency: { type: "string", description: "Urgency level (normal/high/urgent)", required: false }
        },
        returns: "{ ok: boolean, leadId: string, followUpScheduled: boolean, message: string, nextSteps: Array }"
    },
    "quote.generate": {
        key: "quote.generate",
        category: "business",
        description: "Generate price quote for Bali Zero services",
        params: {
            service: { type: "string", description: "Service type (visa/company/tax/real-estate)", required: true },
            details: { type: "string", description: "Service details for accurate quote", required: false }
        },
        returns: "{ ok: boolean, quote: {price: string, timeline: string}, service: string }"
    },
    "document.prepare": {
        key: "document.prepare",
        category: "business",
        description: "Prepare documents for visa/legal/tax services",
        params: {
            type: { type: "string", description: "Document type to prepare", required: true },
            userId: { type: "string", description: "User ID requesting document", required: true },
            data: { type: "object", description: "Document data/fields", required: false }
        },
        returns: "{ ok: boolean, documentId: string, status: string, downloadUrl: string }"
    },
    // === MAPS & LOCATION (NEW - Priority HIGH) ===
    "maps.directions": {
        key: "maps.directions",
        category: "location",
        description: "Get directions between locations in Bali (offices, immigration, notaries)",
        params: {
            origin: { type: "string", description: "Starting location", required: true },
            destination: { type: "string", description: "Destination location", required: true },
            mode: { type: "string", description: "Travel mode (driving/walking/transit)", required: false }
        },
        returns: "{ ok: boolean, directions: Array, distance: string, duration: string }"
    },
    "maps.places": {
        key: "maps.places",
        category: "location",
        description: "Search for nearby places (banks, notaries, immigration offices)",
        params: {
            query: { type: "string", description: "Search query (e.g., 'notary near Seminyak')", required: true },
            location: { type: "string", description: "Center location for search", required: false },
            radius: { type: "number", description: "Search radius in meters", required: false }
        },
        returns: "{ ok: boolean, places: Array<{name, address, rating, distance}>, count: number }"
    },
    "maps.placeDetails": {
        key: "maps.placeDetails",
        category: "location",
        description: "Get detailed information about a specific place (hours, contact, reviews)",
        params: {
            placeId: { type: "string", description: "Google Place ID", required: true }
        },
        returns: "{ ok: boolean, place: {name, address, phone, hours, rating, reviews} }"
    },
    // === DASHBOARD & MONITORING (NEW - Priority MEDIUM) ===
    "dashboard.health": {
        key: "dashboard.health",
        category: "monitoring",
        description: "Get system health status and diagnostics",
        params: {},
        returns: "{ ok: boolean, status: string, services: object, uptime: number, metrics: object }"
    },
    "dashboard.users": {
        key: "dashboard.users",
        category: "monitoring",
        description: "Get active users information and statistics",
        params: {
            filter: { type: "string", description: "Filter (active/inactive/all)", required: false },
            limit: { type: "number", description: "Max users to return", required: false }
        },
        returns: "{ ok: boolean, users: Array, count: number, stats: object }"
    },
    "daily.recap.current": {
        key: "daily.recap.current",
        category: "monitoring",
        description: "Get current daily activity recap and statistics",
        params: {},
        returns: "{ ok: boolean, date: string, activities: Array, stats: object, summary: string }"
    },
    "activity.track": {
        key: "activity.track",
        category: "monitoring",
        description: "Track and log user/system activity",
        params: {
            userId: { type: "string", description: "User ID performing activity", required: true },
            activity: { type: "string", description: "Activity description", required: true },
            type: { type: "string", description: "Activity type", required: false },
            metadata: { type: "object", description: "Additional activity data", required: false }
        },
        returns: "{ ok: boolean, activityId: string, tracked: boolean, timestamp: string }"
    },
};
