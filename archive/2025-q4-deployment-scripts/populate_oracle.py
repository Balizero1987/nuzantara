#!/usr/bin/env python3
"""
Oracle ChromaDB Population Script for Railway
Standalone script to populate Oracle collections on production

Usage:
  railway run python populate_oracle.py
"""

import sys
import os
from pathlib import Path

# Add backend to Python path
backend_path = Path(__file__).parent / "apps" / "backend-rag" / "backend"
sys.path.insert(0, str(backend_path))

# Set environment variables for ChromaDB
os.environ["CHROMA_DB_PATH"] = str(backend_path / "data" / "chroma")

from core.embeddings import EmbeddingsGenerator
from core.vector_db import ChromaDBClient

print("="*70)
print("ORACLE PRODUCTION MIGRATION - Railway")
print("="*70)
print(f"Backend Path: {backend_path}")
print(f"ChromaDB Path: {os.environ['CHROMA_DB_PATH']}")
print("="*70 + "\n")

# Initialize embeddings generator
embedder = EmbeddingsGenerator()

# ========================================
# 1. TAX UPDATES
# ========================================
print("📊 Migrating Tax Updates...")

tax_updates = [
    {
        "id": "tax_update_2025_001",
        "date": "2025-01-15",
        "title": "New PPh 21 Regulation 2025",
        "source": "DJP (Direktorat Jenderal Pajak)",
        "category": "income_tax",
        "impact": "high",
        "summary": "Income tax rates updated for employees - top rate reduced from 25% to 22%",
        "details": "Progressive tax rates changed. Top bracket (>IDR 500M annually) now 22% instead of 25%. Middle bracket (IDR 250M-500M) remains at 22%. Effective retroactively from January 1, 2025."
    },
    {
        "id": "tax_update_2025_002",
        "date": "2025-04-01",
        "title": "VAT Increase to 12%",
        "source": "Ministry of Finance - Regulation PMK-131/2024",
        "category": "vat",
        "impact": "critical",
        "summary": "VAT rate increases from 11% to 12% effective April 1, 2025",
        "details": "All businesses must update invoicing systems, pricing, and contracts. Transitional period allows old rate for contracts signed before March 1. Digital platforms must update by March 15."
    },
    {
        "id": "tax_update_2025_003",
        "date": "2025-03-10",
        "title": "Tax Amnesty Extension Program",
        "source": "DJP Circular SE-12/2025",
        "category": "tax_amnesty",
        "impact": "medium",
        "summary": "Voluntary disclosure program extended until June 30, 2025",
        "details": "Reduced penalties (50% discount) for voluntary disclosure of unreported income from previous years. Special rates for repatriation of offshore assets."
    },
    {
        "id": "tax_update_2025_004",
        "date": "2025-02-01",
        "title": "Carbon Tax Implementation",
        "source": "Ministry of Finance - UU HPP Amendment",
        "category": "carbon_tax",
        "impact": "high",
        "summary": "Carbon tax of IDR 30,000/ton CO2 for coal power plants",
        "details": "Pilot phase: coal-based power generation only. Expansion to other sectors in 2026. Revenue to fund renewable energy transition programs."
    },
    {
        "id": "tax_update_2025_005",
        "date": "2025-01-20",
        "title": "E-Invoicing Mandatory Expansion",
        "source": "DJP Regulation PER-03/2025",
        "category": "compliance",
        "impact": "critical",
        "summary": "E-faktur 4.0 mandatory for all PKP (Pengusaha Kena Pajak) by July 1",
        "details": "Phase 1: Large taxpayers (turnover >IDR 50B) by April 1. Phase 2: All other PKP by July 1. Real-time reporting to DJP systems required."
    },
    {
        "id": "tax_update_2025_006",
        "date": "2025-03-01",
        "title": "Transfer Pricing Documentation Updates",
        "source": "DJP Regulation PER-04/2025",
        "category": "transfer_pricing",
        "impact": "medium",
        "summary": "New Country-by-Country Reporting (CbCR) thresholds and deadlines",
        "details": "Threshold reduced to IDR 10 trillion consolidated revenue (from IDR 11 trillion). Master File and Local File deadline moved to 4 months after fiscal year end (from 6 months)."
    }
]

tax_texts = []
tax_metadatas = []
tax_ids = []

for update in tax_updates:
    text = f"""Tax Update: {update['title']}
Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}
Summary: {update['summary']}
Details: {update['details']}"""

    tax_texts.append(text)
    tax_metadatas.append({
        "id": update["id"],
        "title": update["title"],
        "date": update["date"],
        "category": update["category"],
        "impact": update["impact"]
    })
    tax_ids.append(update["id"])

print(f"   🔄 Generating embeddings for {len(tax_texts)} documents...")
tax_embeddings = [embedder.generate_single_embedding(text) for text in tax_texts]

tax_collection = ChromaDBClient(collection_name="tax_updates")
tax_collection.upsert_documents(
    chunks=tax_texts,
    embeddings=tax_embeddings,
    metadatas=tax_metadatas,
    ids=tax_ids
)
print(f"   ✅ Added {len(tax_texts)} tax updates\n")

# ========================================
# 2. LEGAL UPDATES
# ========================================
print("⚖️  Migrating Legal Updates...")

legal_updates = [
    {
        "id": "legal_2025_001",
        "date": "2025-01-20",
        "title": "PT PMA Minimum Capital Reduced",
        "source": "BKPM Regulation No. 4/2025",
        "category": "company_law",
        "impact": "medium",
        "summary": "Minimum capital requirement reduced from IDR 10 billion to IDR 5 billion for tech/creative sectors",
        "details": "Applies to technology startups, creative industries, and research companies. Standard capital requirement remains IDR 10B for other sectors. Aims to attract more foreign investment in innovation-driven sectors."
    },
    {
        "id": "legal_2025_002",
        "date": "2025-02-15",
        "title": "Minimum Wage Increase 2025",
        "source": "Ministry of Manpower Decree 2/2025",
        "category": "labor_law",
        "impact": "high",
        "summary": "Provincial minimum wages increased 6.5% average nationwide",
        "details": "Jakarta: IDR 5.3M (up from IDR 5.0M). Bali: IDR 3.2M (up from IDR 3.0M). DKI Jakarta highest. Companies must adjust by March 1, 2025."
    },
    {
        "id": "legal_2025_003",
        "date": "2025-01-10",
        "title": "OSS Face Recognition Requirement",
        "source": "BKPM Circular SE-1/2025",
        "category": "business_licensing",
        "impact": "medium",
        "summary": "Biometric verification required for all new business license applications",
        "details": "Directors and commissioners must complete face recognition verification at OSS centers. Aims to prevent identity fraud. Existing licenses unaffected."
    },
    {
        "id": "legal_2025_004",
        "date": "2025-03-05",
        "title": "AMDAL Stricter Requirements",
        "source": "Ministry of Environment Regulation 5/2025",
        "category": "environmental_law",
        "impact": "high",
        "summary": "Environmental impact assessments now required for smaller projects",
        "details": "Threshold reduced to land >2 hectares (from 5 ha). Tourism projects in conservation areas face stricter review. Processing time increased to 90 days."
    },
    {
        "id": "legal_2025_005",
        "date": "2025-02-20",
        "title": "IMB Digitalization Complete",
        "source": "Ministry of Public Works Regulation 3/2025",
        "category": "construction_permits",
        "impact": "medium",
        "summary": "Building permits (IMB) now fully digital in all provinces",
        "details": "Average processing time reduced to 7 working days. Integration with OSS system. Real-time tracking available. Manual applications no longer accepted."
    },
    {
        "id": "legal_2025_006",
        "date": "2025-01-25",
        "title": "Property Leasehold Extension Simplified",
        "source": "Ministry of Agrarian Affairs Regulation 2/2025",
        "category": "property_law",
        "impact": "medium",
        "summary": "Leasehold (Hak Pakai) extension process streamlined - now 30 days instead of 90",
        "details": "Automatic extension granted if no violations. Fee structure simplified: flat IDR 10M for residential, IDR 25M for commercial. Applies to renewals filed from Feb 2025."
    },
    {
        "id": "legal_2025_007",
        "date": "2025-03-15",
        "title": "Foreign Worker Quota Changes",
        "source": "Ministry of Manpower Regulation 4/2025",
        "category": "immigration_labor",
        "impact": "high",
        "summary": "Expatriate quotas increased for IT and healthcare sectors",
        "details": "IT/software: 50% foreign workers allowed (up from 30%). Healthcare: 40% (up from 25%). Other sectors remain at 30%. Companies must demonstrate local training programs."
    }
]

legal_texts = []
legal_metadatas = []
legal_ids = []

for update in legal_updates:
    text = f"""Legal Update: {update['title']}
Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}
Summary: {update['summary']}
Details: {update['details']}"""

    legal_texts.append(text)
    legal_metadatas.append({
        "id": update["id"],
        "title": update["title"],
        "date": update["date"],
        "category": update["category"],
        "impact": update["impact"]
    })
    legal_ids.append(update["id"])

print(f"   🔄 Generating embeddings for {len(legal_texts)} documents...")
legal_embeddings = [embedder.generate_single_embedding(text) for text in legal_texts]

legal_collection = ChromaDBClient(collection_name="legal_updates")
legal_collection.upsert_documents(
    chunks=legal_texts,
    embeddings=legal_embeddings,
    metadatas=legal_metadatas,
    ids=legal_ids
)
print(f"   ✅ Added {len(legal_texts)} legal updates\n")

# ========================================
# 3. PROPERTY LISTINGS
# ========================================
print("🏠 Migrating Property Listings...")

property_listings = [
    {
        "id": "prop_001",
        "title": "Luxury Villa in Canggu",
        "location": "Canggu, Bali",
        "type": "villa",
        "price": "IDR 15,000,000,000",
        "ownership": "Leasehold (Hak Pakai) 25 years",
        "description": "Modern 4-bedroom villa with ocean view, 500m² land, private pool, 5 min to Echo Beach",
        "features": ["4 bedrooms", "4 bathrooms", "ocean view", "private pool", "modern kitchen", "parking 2 cars"]
    },
    {
        "id": "prop_002",
        "title": "Seminyak Beachfront Villa",
        "location": "Seminyak, Bali",
        "type": "villa",
        "price": "IDR 25,000,000,000",
        "ownership": "Freehold (Hak Milik) via Nominee",
        "description": "6-bedroom beachfront villa, 800m² land, direct beach access, fully furnished",
        "features": ["6 bedrooms", "beachfront", "800m² land", "staff quarters", "tropical garden", "gym"]
    },
    {
        "id": "prop_003",
        "title": "Ubud Rice Field Villa",
        "location": "Ubud, Bali",
        "type": "villa",
        "price": "IDR 8,500,000,000",
        "ownership": "Leasehold (Hak Pakai) 30 years renewable",
        "description": "3-bedroom eco villa overlooking rice terraces, 400m² land, bamboo construction",
        "features": ["3 bedrooms", "rice field view", "eco-friendly", "yoga pavilion", "organic garden"]
    },
    {
        "id": "prop_004",
        "title": "Sanur Commercial Property",
        "location": "Sanur, Bali",
        "type": "commercial",
        "price": "IDR 45,000,000,000",
        "ownership": "HGB (Hak Guna Bangunan) 30 years",
        "description": "Prime commercial building, 1200m² land, suitable for hotel/restaurant, beach road location",
        "features": ["commercial zoning", "beach road", "1200m² land", "2-story building", "high traffic area"]
    }
]

prop_texts = []
prop_metadatas = []
prop_ids = []

for prop in property_listings:
    text = f"""Property: {prop['title']}
Location: {prop['location']}
Type: {prop['type']}
Price: {prop['price']}
Ownership: {prop['ownership']}
Description: {prop['description']}
Features: {', '.join(prop['features'])}"""

    prop_texts.append(text)
    prop_metadatas.append({
        "id": prop["id"],
        "title": prop["title"],
        "location": prop["location"],
        "type": prop["type"],
        "price": prop["price"]
    })
    prop_ids.append(prop["id"])

print(f"   🔄 Generating embeddings for {len(prop_texts)} listings...")
prop_embeddings = [embedder.generate_single_embedding(text) for text in prop_texts]

prop_collection = ChromaDBClient(collection_name="property_listings")
prop_collection.upsert_documents(
    chunks=prop_texts,
    embeddings=prop_embeddings,
    metadatas=prop_metadatas,
    ids=prop_ids
)
print(f"   ✅ Added {len(prop_texts)} property listings\n")

# ========================================
# SUMMARY
# ========================================
print("="*70)
print("✅ ORACLE MIGRATION COMPLETE!")
print("="*70)

total_docs = len(tax_texts) + len(legal_texts) + len(prop_texts)

print("\nCollections populated:")
print(f"  ✅ tax_updates: {len(tax_texts)} documents")
print(f"  ✅ legal_updates: {len(legal_texts)} documents")
print(f"  ✅ property_listings: {len(prop_texts)} documents")
print(f"\nTotal: {total_docs} documents")
print("\n🧪 Oracle system ready for production queries!")
print("="*70)
