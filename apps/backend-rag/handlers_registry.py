# ZANTARA Handler Registry v1.0
# Central registry for all available handlers/tools in the ecosystem

AVAILABLE_HANDLERS = {
    # ZANTARA v3 Ω Core Handlers
    "zantara_unified_query": {
        "endpoint": "/api/v3/zantara/unified",
        "method": "POST",
        "backend": "ts",
        "params": ["query", "domain", "mode", "include_sources"],
        "description": "Unified knowledge query across all domains (KBLI, pricing, team, legal, etc.)",
        "category": "zantara_core",
        "examples": [
            {"call": "CALL_HANDLER[zantara_unified_query](restaurant, kbli, detailed)", "result": "Restaurant KBLI codes and requirements"},
            {"call": "CALL_HANDLER[zantara_unified_query](visa pricing, pricing, quick)", "result": "Current visa pricing information"}
        ]
    },

    "zantara_collective_intelligence": {
        "endpoint": "/api/v3/zantara/collective",
        "method": "POST",
        "backend": "ts",
        "params": ["action", "data", "userId", "confidence"],
        "description": "Collective intelligence and shared learning across users",
        "category": "zantara_core",
        "examples": [
            {"call": "CALL_HANDLER[zantara_collective_intelligence](query, {query: 'restaurant setup'}, demo, 0.7)", "result": "Community insights about restaurant setup"}
        ]
    },

    "zantara_ecosystem_analysis": {
        "endpoint": "/api/v3/zantara/ecosystem",
        "method": "POST",
        "backend": "ts",
        "params": ["scenario", "business_type", "ownership", "scope", "location"],
        "description": "Complete business ecosystem analysis with recommendations",
        "category": "zantara_core",
        "examples": [
            {"call": "CALL_HANDLER[zantara_ecosystem_analysis](business_setup, restaurant, foreign, detailed, bali)", "result": "Full restaurant business analysis"}
        ]
    },

    # Bali Zero Services Handlers
    "kbli_lookup": {
        "endpoint": "/api/kbli/lookup",
        "method": "POST",
        "backend": "ts",
        "params": ["query", "business_type", "category"],
        "description": "KBLI business code classification lookup",
        "category": "business_services",
        "examples": [
            {"call": "CALL_HANDLER[kbli_lookup](restaurant, restaurant, , )", "result": "Restaurant KBLI codes"}
        ]
    },

    "bali_zero_pricing": {
        "endpoint": "/api/pricing/services",
        "method": "GET",
        "backend": "ts",
        "params": ["service_type"],
        "description": "Official Bali Zero service pricing",
        "category": "business_services",
        "examples": [
            {"call": "CALL_HANDLER[bali_zero_pricing](visa)", "result": "Visa service pricing"}
        ]
    },

    "team_overview": {
        "endpoint": "/api/team/overview",
        "method": "GET",
        "backend": "ts",
        "params": [],
        "description": "Complete Bali Zero team overview with departments and expertise",
        "category": "team_management",
        "examples": [
            {"call": "CALL_HANDLER[team_overview]()", "result": "Full team structure and members"}
        ]
    },

    # RAG Knowledge Base Handlers
    "rag_query": {
        "endpoint": "/api/rag/query",
        "method": "POST",
        "backend": "rag",
        "params": ["query", "context_filter", "limit"],
        "description": "Query RAG knowledge base with semantic search",
        "category": "knowledge_base",
        "examples": [
            {"call": "CALL_HANDLER[rag_query](immigration requirements, legal, 5)", "result": "Relevant legal documents"}
        ]
    },

    "search_collections": {
        "endpoint": "/api/rag/collections/search",
        "method": "POST",
        "backend": "rag",
        "params": ["query", "collections", "limit"],
        "description": "Search across specific RAG collections",
        "category": "knowledge_base",
        "examples": [
            {"call": "CALL_HANDLER[search_collections](PT PMA, [legal_framework, business_setup], 10)", "result": "PT PMA formation documents"}
        ]
    },

    # Authentication & User Management
    "authenticate_user": {
        "endpoint": "/api/auth/authenticate",
        "method": "POST",
        "backend": "ts",
        "params": ["username", "password"],
        "description": "Authenticate user credentials",
        "category": "authentication",
        "examples": [
            {"call": "CALL_HANDLER[authenticate_user](user@example.com, password123)", "result": "Authentication token"}
        ]
    },

    "get_user_permissions": {
        "endpoint": "/api/auth/permissions/{user_id}",
        "method": "GET",
        "backend": "ts",
        "params": ["user_id"],
        "description": "Get user permissions and access level",
        "category": "authentication",
        "examples": [
            {"call": "CALL_HANDLER[get_user_permissions](user123)", "result": "User permissions"}
        ]
    },

    # CRM & Client Management (Future)
    "query_crm_clients": {
        "endpoint": "/api/crm/clients",
        "method": "POST",
        "backend": "future",
        "params": ["filters"],
        "description": "Query CRM clients with filters",
        "category": "crm",
        "examples": [
            {"call": "CALL_HANDLER[query_crm_clients]({status: 'active'})", "result": "Active clients list"}
        ]
    },

    "get_client_status": {
        "endpoint": "/api/crm/client/{client_id}/status",
        "method": "GET",
        "backend": "future",
        "params": ["client_id"],
        "description": "Get specific client status and details",
        "category": "crm",
        "examples": [
            {"call": "CALL_HANDLER[get_client_status](client123)", "result": "Client details"}
        ]
    },

    # System & Monitoring
    "system_health": {
        "endpoint": "/health",
        "method": "GET",
        "backend": "rag",
        "params": [],
        "description": "System health check and status",
        "category": "system",
        "examples": [
            {"call": "CALL_HANDLER[system_health]()", "result": "System status"}
        ]
    },

    "system_metrics": {
        "endpoint": "/metrics",
        "method": "GET",
        "backend": "rag",
        "params": [],
        "description": "System performance metrics",
        "category": "system",
        "examples": [
            {"call": "CALL_HANDLER[system_metrics]()", "result": "Performance data"}
        ]
    }
}

# Handler categories for organization
HANDLER_CATEGORIES = {
    "zantara_core": {
        "name": "ZANTARA v3 Ω Core",
        "description": "Primary ZANTARA intelligence endpoints",
        "priority": "critical"
    },
    "business_services": {
        "name": "Business Services",
        "description": "Bali Zero business process handlers",
        "priority": "high"
    },
    "knowledge_base": {
        "name": "Knowledge Base",
        "description": "RAG and document retrieval handlers",
        "priority": "high"
    },
    "team_management": {
        "name": "Team Management",
        "description": "Team and organizational handlers",
        "priority": "medium"
    },
    "authentication": {
        "name": "Authentication",
        "description": "User authentication and authorization",
        "priority": "critical"
    },
    "crm": {
        "name": "CRM & Client Management",
        "description": "Client relationship management (future)",
        "priority": "low"
    },
    "system": {
        "name": "System & Monitoring",
        "description": "System health and monitoring",
        "priority": "medium"
    }
}

# Statistics
HANDLER_STATS = {
    "total_handlers": len(AVAILABLE_HANDLERS),
    "categories": len(HANDLER_CATEGORIES),
    "backends": {
        "ts": len([h for h in AVAILABLE_HANDLERS.values() if h["backend"] == "ts"]),
        "rag": len([h for h in AVAILABLE_HANDLERS.values() if h["backend"] == "rag"]),
        "future": len([h for h in AVAILABLE_HANDLERS.values() if h["backend"] == "future"])
    },
    "priority_distribution": {
        "critical": len([h for h in AVAILABLE_HANDLERS.values() if HANDLER_CATEGORIES.get(h["category"], {}).get("priority") == "critical"]),
        "high": len([h for h in AVAILABLE_HANDLERS.values() if HANDLER_CATEGORIES.get(h["category"], {}).get("priority") == "high"]),
        "medium": len([h for h in AVAILABLE_HANDLERS.values() if HANDLER_CATEGORIES.get(h["category"], {}).get("priority") == "medium"]),
        "low": len([h for h in AVAILABLE_HANDLERS.values() if HANDLER_CATEGORIES.get(h["category"], {}).get("priority") == "low"])
    }
}