"""
Oracle ChromaDB Migration Script for Railway Production
Populates Oracle collections with knowledge base data
"""

import sys
import json
from pathlib import Path

# Add current directory to path
sys.path.insert(0, str(Path(__file__).parent))

from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

def migrate_oracle_collections():
    """Migrate Oracle knowledge bases to ChromaDB"""

    print("\n" + "="*70)
    print("ORACLE PRODUCTION MIGRATION")
    print("="*70)

    # Paths - relative from backend directory
    kb_path = Path(__file__).parent.parent.parent.parent / "projects" / "oracle-system" / "agents" / "knowledge-bases"
    chroma_path = "./data/chroma"

    print(f"Knowledge Bases: {kb_path}")
    print(f"ChromaDB Path: {chroma_path}")
    print("="*70 + "\n")

    # Initialize embeddings generator
    embedder = EmbeddingsGenerator()

    # 1. Migrate tax_updates
    print("📊 1. Migrating Tax Updates...")
    with open(kb_path / "tax-updates-kb.json") as f:
        tax_data = json.load(f)

    tax_texts = []
    tax_metadatas = []
    tax_ids = []

    for update in tax_data["taxUpdates"]:
        text = f"""
Tax Update: {update['title']}
Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}
Summary: {update['summary']}
Details: {update['details']}
Affected Parties: {', '.join(update.get('affectedParties', []))}
Implementation Date: {update.get('implementationDate', 'N/A')}
Reference: {update['reference']}
""".strip()

        tax_texts.append(text)
        tax_metadatas.append({
            "id": update["id"],
            "title": update["title"],
            "date": update["date"],
            "category": update["category"],
            "impact": update["impact"],
            "source": update["source"]
        })
        tax_ids.append(update["id"])

    print(f"   🔄 Generating embeddings for {len(tax_texts)} documents...")
    tax_embeddings = [embedder.generate_single_embedding(text) for text in tax_texts]

    tax_collection = ChromaDBClient(
        persist_directory=chroma_path,
        collection_name="tax_updates"
    )
    tax_collection.upsert_documents(
        chunks=tax_texts,
        embeddings=tax_embeddings,
        metadatas=tax_metadatas,
        ids=tax_ids
    )
    print(f"   ✅ Added {len(tax_texts)} tax updates\n")

    # 2. Migrate tax_knowledge
    print("📚 2. Migrating Tax Knowledge...")
    with open(kb_path / "tax-knowledge-kb.json") as f:
        tax_kb_data = json.load(f)

    tax_kb_texts = []
    tax_kb_metadatas = []
    tax_kb_ids = []

    # PPh 21
    pph21 = tax_kb_data["incomeTax"]["pph21"]
    text = f"""
Tax Type: PPh 21 (Employee Income Tax)
Description: {pph21['description']}
Progressive Rates:
{chr(10).join([f"- {rate['bracket']}: {rate['rate']}" for rate in pph21['rates']['progressive']])}
Calculation Method: {pph21['calculation']['method']}
"""
    tax_kb_texts.append(text)
    tax_kb_metadatas.append({"type": "pph21", "category": "income_tax"})
    tax_kb_ids.append("tax_kb_pph21")

    # PPh 23
    pph23 = tax_kb_data["incomeTax"]["pph23"]
    text = f"""
Tax Type: PPh 23 (Withholding Tax on Services)
Description: {pph23['description']}
Rate: {pph23['rate']}
Covered Services:
{chr(10).join([f"- {service}" for service in pph23['applicable_services']])}
"""
    tax_kb_texts.append(text)
    tax_kb_metadatas.append({"type": "pph23", "category": "income_tax"})
    tax_kb_ids.append("tax_kb_pph23")

    # Corporate Tax
    corporate = tax_kb_data["corporateTax"]
    text = f"""
Tax Type: Corporate Income Tax
Standard Rate: {corporate['standard_rate']}
Small Business Rate: {corporate['small_business_rate']}
Small Business Criteria: Annual revenue < {corporate['small_business_criteria']}
"""
    tax_kb_texts.append(text)
    tax_kb_metadatas.append({"type": "corporate", "category": "corporate_tax"})
    tax_kb_ids.append("tax_kb_corporate")

    # VAT
    vat = tax_kb_data["valueAddedTax"]
    text = f"""
Tax Type: Value Added Tax (PPN)
Current Rate: {vat['current_rate']}
Future Rate: {vat['future_rate']}
Exemptions: {', '.join(vat['exemptions'])}
Registration Threshold: Annual turnover > {vat['pkp_registration_threshold']}
"""
    tax_kb_texts.append(text)
    tax_kb_metadatas.append({"type": "vat", "category": "value_added_tax"})
    tax_kb_ids.append("tax_kb_vat")

    # Transfer Pricing
    tp = tax_kb_data["transferPricing"]
    text = f"""
Tax Area: Transfer Pricing
Description: {tp['description']}
Documentation Threshold: {tp['documentation_threshold']}
Methods:
{chr(10).join([f"- {method['name']}: {method['description']}" for method in tp['methods']])}
"""
    tax_kb_texts.append(text)
    tax_kb_metadatas.append({"type": "transfer_pricing", "category": "compliance"})
    tax_kb_ids.append("tax_kb_transfer_pricing")

    print(f"   🔄 Generating embeddings for {len(tax_kb_texts)} documents...")
    tax_kb_embeddings = [embedder.generate_single_embedding(text) for text in tax_kb_texts]

    tax_kb_collection = ChromaDBClient(
        persist_directory=chroma_path,
        collection_name="tax_knowledge"
    )
    tax_kb_collection.upsert_documents(
        chunks=tax_kb_texts,
        embeddings=tax_kb_embeddings,
        metadatas=tax_kb_metadatas,
        ids=tax_kb_ids
    )
    print(f"   ✅ Added {len(tax_kb_texts)} tax knowledge documents\n")

    # 3. Migrate property_listings
    print("🏠 3. Migrating Property Listings...")
    with open(kb_path / "property-kb.json") as f:
        property_data = json.load(f)

    prop_texts = []
    prop_metadatas = []
    prop_ids = []

    for listing in property_data["propertyListings"]:
        text = f"""
Property: {listing['title']}
Location: {listing['location']}
Type: {listing['type']}
Price: {listing['price']}
{"Ownership: " + listing.get('ownership_type', 'N/A') if 'ownership_type' in listing else ''}
Description: {listing['description']}
Features: {', '.join(listing['features'])}
""".strip()

        prop_texts.append(text)
        prop_metadatas.append({
            "id": listing["id"],
            "title": listing["title"],
            "location": listing["location"],
            "type": listing["type"],
            "ownership_type": listing.get("ownership_type", "N/A")
        })
        prop_ids.append(listing["id"])

    print(f"   🔄 Generating embeddings for {len(prop_texts)} listings...")
    prop_embeddings = [embedder.generate_single_embedding(text) for text in prop_texts]

    prop_collection = ChromaDBClient(
        persist_directory=chroma_path,
        collection_name="property_listings"
    )
    prop_collection.upsert_documents(
        chunks=prop_texts,
        embeddings=prop_embeddings,
        metadatas=prop_metadatas,
        ids=prop_ids
    )
    print(f"   ✅ Added {len(prop_texts)} property listings\n")

    # 4. Migrate property_knowledge
    print("🏛️ 4. Migrating Property Knowledge...")

    prop_kb_texts = []
    prop_kb_metadatas = []
    prop_kb_ids = []

    # Ownership types
    for key, ownership in property_data["ownershipTypes"].items():
        text = f"""
Ownership Type: {ownership['name']}
Duration: {ownership['duration']}
Eligible: {', '.join(ownership['eligible']) if isinstance(ownership['eligible'], list) else ownership['eligible']}
Foreign Eligible: {ownership.get('foreign_eligible', 'N/A')}
Renewable: {ownership.get('renewable', 'N/A')}
Extension: {ownership.get('extension', 'N/A')}
Notes: {ownership.get('notes', 'N/A')}
"""
        prop_kb_texts.append(text)
        prop_kb_metadatas.append({"type": "ownership", "key": key})
        prop_kb_ids.append(f"prop_kb_{key}")

    # Foreign ownership structures
    for key, structure in property_data["foreignOwnershipStructures"].items():
        text = f"""
Foreign Ownership Structure: {structure['name']}
Safety Level: {structure['safety_level']}
Description: {structure['description']}
Requirements: {', '.join(structure['requirements'])}
Pros: {', '.join(structure['pros'])}
Cons: {', '.join(structure['cons'])}
"""
        prop_kb_texts.append(text)
        prop_kb_metadatas.append({"type": "foreign_structure", "key": key})
        prop_kb_ids.append(f"prop_kb_foreign_{key}")

    # Regulations
    for key, regulation in property_data["regulations"].items():
        text = f"""
Regulation: {regulation['name']}
Description: {regulation['description']}
Requirements: {', '.join(regulation['requirements'])}
Timeline: {regulation['timeline']}
Cost: {regulation['cost']}
"""
        prop_kb_texts.append(text)
        prop_kb_metadatas.append({"type": "regulation", "key": key})
        prop_kb_ids.append(f"prop_kb_reg_{key}")

    print(f"   🔄 Generating embeddings for {len(prop_kb_texts)} documents...")
    prop_kb_embeddings = [embedder.generate_single_embedding(text) for text in prop_kb_texts]

    prop_kb_collection = ChromaDBClient(
        persist_directory=chroma_path,
        collection_name="property_knowledge"
    )
    prop_kb_collection.upsert_documents(
        chunks=prop_kb_texts,
        embeddings=prop_kb_embeddings,
        metadatas=prop_kb_metadatas,
        ids=prop_kb_ids
    )
    print(f"   ✅ Added {len(prop_kb_texts)} property knowledge documents\n")

    # 5. Migrate legal_updates
    print("⚖️ 5. Migrating Legal Updates...")
    with open(kb_path / "legal-updates-kb.json") as f:
        legal_data = json.load(f)

    legal_texts = []
    legal_metadatas = []
    legal_ids = []

    for update in legal_data["legalUpdates"]:
        text = f"""
Legal Update: {update['title']}
Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}
Summary: {update['summary']}
Details: {update['details']}
Affected Parties: {', '.join(update.get('affectedParties', []))}
Effective Date: {update.get('effective_date', 'N/A')}
Reference: {update.get('reference', 'N/A')}
""".strip()

        legal_texts.append(text)
        legal_metadatas.append({
            "id": update["id"],
            "title": update["title"],
            "date": update["date"],
            "category": update["category"],
            "impact": update["impact"],
            "source": update["source"]
        })
        legal_ids.append(update["id"])

    print(f"   🔄 Generating embeddings for {len(legal_texts)} documents...")
    legal_embeddings = [embedder.generate_single_embedding(text) for text in legal_texts]

    legal_collection = ChromaDBClient(
        persist_directory=chroma_path,
        collection_name="legal_updates"
    )
    legal_collection.upsert_documents(
        chunks=legal_texts,
        embeddings=legal_embeddings,
        metadatas=legal_metadatas,
        ids=legal_ids
    )
    print(f"   ✅ Added {len(legal_texts)} legal updates\n")

    # Summary
    print("="*70)
    print("✅ MIGRATION COMPLETE!")
    print("="*70 + "\n")

    total_docs = len(tax_texts) + len(tax_kb_texts) + len(prop_texts) + len(prop_kb_texts) + len(legal_texts)

    print("Collections populated:")
    print(f"  ✅ tax_updates ({len(tax_texts)} documents)")
    print(f"  ✅ tax_knowledge ({len(tax_kb_texts)} documents)")
    print(f"  ✅ property_listings ({len(prop_texts)} documents)")
    print(f"  ✅ property_knowledge ({len(prop_kb_texts)} documents)")
    print(f"  ✅ legal_updates ({len(legal_texts)} documents)")
    print(f"\nTotal: {total_docs} documents")
    print("\n🧪 Oracle system ready for production queries!")
    print("="*70 + "\n")


if __name__ == "__main__":
    migrate_oracle_collections()
