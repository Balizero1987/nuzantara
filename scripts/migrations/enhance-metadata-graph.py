#!/usr/bin/env python3
"""
METADATA ENHANCEMENT - Knowledge Graph Architecture
Arricchisce metadata con edges per navigation e display hints per UI
"""
import chromadb
import json
from typing import Dict, List, Any

SOURCE_PATH = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_FULL_deploy"
TARGET_PATH = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/apps/backend-rag/chroma_db_GRAPH_enhanced"

print("🎓 METADATA ENHANCEMENT - Knowledge Graph\n")

# Collection-specific metadata enhancement rules
COLLECTION_RULES = {
    "visa_oracle": {
        "type": "actionable_guide",
        "layer": "ACTION",
        "display": {"component": "StepByStepGuide", "icon": "visa", "color": "blue", "interactive": True},
        "cache_layer": "L1",
        "priority": "high",
        "edge_patterns": {
            "requires": ["kbli_unified", "legal_intelligence", "tax_genius"],
            "referenced_by": []
        }
    },
    "bali_zero_pricing": {
        "type": "pricing",
        "layer": "ACTION",
        "display": {"component": "PricingCard", "icon": "dollar", "color": "green", "interactive": True},
        "cache_layer": "L1",
        "priority": "critical",
        "edge_patterns": {
            "requires": ["tax_genius"],
            "referenced_by": ["visa_oracle", "kbli_unified"]
        }
    },
    "tax_genius": {
        "type": "calculation",
        "layer": "ACTION",
        "display": {"component": "TaxCalculator", "icon": "calculator", "color": "purple", "interactive": True},
        "cache_layer": "L2",
        "priority": "high",
        "edge_patterns": {
            "requires": ["legal_intelligence", "kbli_unified"],
            "referenced_by": ["visa_oracle", "bali_zero_pricing"]
        }
    },
    "kbli_unified": {
        "type": "business_code",
        "layer": "BUSINESS",
        "display": {"component": "BusinessCodeTable", "icon": "briefcase", "color": "orange", "interactive": False},
        "cache_layer": "L2",
        "priority": "high",
        "edge_patterns": {
            "requires": ["legal_intelligence", "visa_oracle"],
            "referenced_by": ["visa_oracle", "tax_genius"]
        }
    },
    "legal_intelligence": {
        "type": "legal_text",
        "layer": "REFERENCE",
        "display": {"component": "LegalDocument", "icon": "scale", "color": "gray", "interactive": False},
        "cache_layer": "L2",
        "priority": "medium",
        "edge_patterns": {
            "requires": [],
            "referenced_by": ["visa_oracle", "kbli_unified", "tax_genius", "property_unified"]
        }
    },
    "property_unified": {
        "type": "property_guide",
        "layer": "BUSINESS",
        "display": {"component": "PropertyCard", "icon": "home", "color": "teal", "interactive": False},
        "cache_layer": "L3",
        "priority": "medium",
        "edge_patterns": {
            "requires": ["legal_intelligence", "kbli_unified"],
            "referenced_by": []
        }
    },
    "books_intelligence": {
        "type": "knowledge",
        "layer": "REFERENCE",
        "display": {"component": "KnowledgeCard", "icon": "book", "color": "indigo", "interactive": False},
        "cache_layer": "L3",
        "priority": "low",
        "edge_patterns": {
            "requires": [],
            "referenced_by": ["visa_oracle", "kbli_unified"]  # For cultural context
        }
    },
    "cultural_insights": {
        "type": "cultural_guide",
        "layer": "REFERENCE",
        "display": {"component": "CultureCard", "icon": "globe", "color": "pink", "interactive": False},
        "cache_layer": "L3",
        "priority": "low",
        "edge_patterns": {
            "requires": [],
            "referenced_by": ["visa_oracle"]
        }
    }
}

# Content-based edge detection patterns
EDGE_PATTERNS = {
    "visa_codes": r"E\d{2}[A-Z]",  # E28A, E33F, etc.
    "kbli_codes": r"\b\d{5}\b",     # 46391, 56101, etc.
    "law_ids": r"(UU|PP|PERPRES|PERMEN)[-\s]?\d+[-\s]?(TAHUN[-\s]?)?\d{4}",
    "tax_types": r"(PPh|PPN|BPHTB|PBB)\s?\d{0,2}",
}

def enhance_metadata(doc: Dict[str, Any], collection_name: str, all_docs: Dict) -> Dict[str, Any]:
    """
    Arricchisce metadata di un singolo documento
    """
    rules = COLLECTION_RULES.get(collection_name, {})
    content = doc.get("documents", [""])[0] if doc.get("documents") else ""
    current_meta = doc.get("metadatas", [{}])[0] if doc.get("metadatas") else {}
    
    # Enhanced metadata structure
    enhanced = {
        **current_meta,  # Keep existing
        
        # Identity
        "collection": collection_name,
        "doc_type": rules.get("type", "unknown"),
        "layer": rules.get("layer", "REFERENCE"),
        
        # Edges (knowledge graph)
        "edges": {
            "requires": [],      # Will be populated by content analysis
            "referenced_by": [],  # Will be populated later
            "related": []        # Will be populated by similarity
        },
        
        # Business logic
        "cache_layer": rules.get("cache_layer", "L3"),
        "priority": rules.get("priority", "medium"),
        "cache_ttl": 3600 if rules.get("priority") == "critical" else 7200,
        
        # UI hints
        "display": rules.get("display", {
            "component": "StandardCard",
            "icon": "document",
            "color": "gray",
            "interactive": False
        }),
        
        # Analytics placeholders
        "stats": {
            "query_count": 0,
            "avg_session_depth": 0,
            "last_queried": None
        }
    }
    
    return enhanced

def extract_edges_from_content(content: str, metadata: Dict) -> Dict[str, List[str]]:
    """
    Estrae edges dai pattern nel content
    """
    import re
    
    edges = {
        "visa_codes": [],
        "kbli_codes": [],
        "law_ids": [],
        "tax_types": []
    }
    
    for edge_type, pattern in EDGE_PATTERNS.items():
        matches = re.findall(pattern, content, re.IGNORECASE)
        edges[edge_type] = list(set(matches))  # Deduplicate
    
    return edges

print("🔄 Enhancing metadata for knowledge graph...\n")

# Load source database
source_client = chromadb.PersistentClient(path=SOURCE_PATH)
collections = source_client.list_collections()

print(f"📚 Found {len(collections)} collections to enhance:\n")

# Phase 1: Enhance metadata for each document
enhanced_data = {}

for collection in collections:
    coll_name = collection.name
    print(f"   Processing: {coll_name} ({collection.count():,} docs)...", end=" ")
    
    # Get all documents
    all_docs = collection.get(include=["documents", "metadatas", "embeddings"])
    
    enhanced_docs = []
    for i in range(len(all_docs["ids"])):
        doc = {
            "id": all_docs["ids"][i],
            "documents": [all_docs["documents"][i]] if all_docs["documents"] else None,
            "metadatas": [all_docs["metadatas"][i]] if all_docs["metadatas"] else None,
            "embeddings": [all_docs["embeddings"][i]] if all_docs["embeddings"] else None
        }
        
        # Enhance metadata
        enhanced_meta = enhance_metadata(doc, coll_name, all_docs)
        
        # Extract edges from content
        if doc["documents"]:
            content_edges = extract_edges_from_content(doc["documents"][0], enhanced_meta)
            enhanced_meta["content_references"] = content_edges
        
        enhanced_docs.append({
            **doc,
            "enhanced_metadata": enhanced_meta
        })
    
    enhanced_data[coll_name] = enhanced_docs
    print("✅")

print(f"\n✅ Metadata enhancement complete!")
print(f"\n📊 Summary:")
print(f"   Collections: {len(enhanced_data)}")
print(f"   Total docs: {sum(len(docs) for docs in enhanced_data.values()):,}")
print(f"\n💡 Enhanced metadata includes:")
print(f"   • Knowledge graph edges (requires, referenced_by)")
print(f"   • Display hints for UI rendering")
print(f"   • Cache layer assignment (L1/L2/L3)")
print(f"   • Priority for routing")
print(f"   • Analytics placeholders")

# Save enhanced structure (for inspection)
output_file = "/Users/antonellosiano/Desktop/NUZANTARA-FLY/metadata_graph_structure.json"
sample = {}
for coll_name, docs in enhanced_data.items():
    if docs:
        sample[coll_name] = docs[0]["enhanced_metadata"]

with open(output_file, "w") as f:
    json.dump(sample, f, indent=2)

print(f"\n📄 Sample metadata saved to: {output_file}")
print(f"\n🎯 Next step: Create new ChromaDB with enhanced metadata")
