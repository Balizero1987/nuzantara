"""
Quick test to populate Oracle collections with sample documents
This verifies that the Oracle Universal Endpoint works correctly
"""

import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "apps" / "backend-rag" / "backend"
sys.path.insert(0, str(backend_path))

from core.vector_db import ChromaDBClient

def populate_test_data():
    """Add sample documents to Oracle collections"""

    print("🔧 Populating Oracle Collections with Test Data...")

    # Tax Updates
    print("\n📊 1. Tax Updates Collection...")
    tax_updates = ChromaDBClient(
        persist_directory="./apps/backend-rag/backend/data/chroma",
        collection_name="tax_updates"
    )

    tax_updates.add_texts(
        texts=[
            "New PPh 21 regulation 2025: Income tax rates updated. Employee income tax reduced from 25% to 22% for annual income above IDR 500 million. Effective from January 2025.",
            "VAT increase announcement: Value Added Tax (PPN) will increase from 11% to 12% starting April 2025. Applies to all goods and services.",
            "Latest DJP announcement: Tax amnesty program extended until December 2025. Reduced penalties for voluntary disclosure of unreported income."
        ],
        metadatas=[
            {"date": "2025-01-15", "source": "DJP", "type": "tax_rate_change"},
            {"date": "2025-02-01", "source": "Ministry of Finance", "type": "vat_update"},
            {"date": "2025-03-10", "source": "DJP", "type": "tax_amnesty"}
        ],
        ids=["tax_update_1", "tax_update_2", "tax_update_3"]
    )
    print("   ✅ Added 3 tax update documents")

    # Tax Knowledge
    print("\n📚 2. Tax Knowledge Collection...")
    tax_knowledge = ChromaDBClient(
        persist_directory="./apps/backend-rag/backend/data/chroma",
        collection_name="tax_knowledge"
    )

    tax_knowledge.add_texts(
        texts=[
            "PPh 21 calculation guide: Monthly income tax for employees is calculated progressively. Rates: 5% (up to IDR 60M), 15% (IDR 60M-250M), 25% (IDR 250M-500M), 30% (above IDR 500M) annually.",
            "Corporate tax rate in Indonesia: PT companies pay 22% corporate income tax on net profits. Small businesses with revenue under IDR 4.8 billion get 50% reduction.",
            "Transfer pricing regulations: Related party transactions must follow arm's length principle. Documentation required for transactions above IDR 20 billion annually.",
            "VAT (PPN) basics: Value Added Tax is 11% (increasing to 12% in 2025). Applied to most goods and services. Input VAT can offset output VAT for registered businesses."
        ],
        metadatas=[
            {"topic": "pph_21", "category": "income_tax", "level": "basic"},
            {"topic": "corporate_tax", "category": "company_tax", "level": "basic"},
            {"topic": "transfer_pricing", "category": "international_tax", "level": "advanced"},
            {"topic": "vat", "category": "indirect_tax", "level": "basic"}
        ],
        ids=["tax_kb_1", "tax_kb_2", "tax_kb_3", "tax_kb_4"]
    )
    print("   ✅ Added 4 tax knowledge documents")

    # Property Listings
    print("\n🏠 3. Property Listings Collection...")
    property_listings = ChromaDBClient(
        persist_directory="./apps/backend-rag/backend/data/chroma",
        collection_name="property_listings"
    )

    property_listings.add_texts(
        texts=[
            "Luxury 3-bedroom villa for sale in Canggu. Modern design, private pool, 500m from beach. Price: IDR 8.5 billion. Freehold (Hak Milik) available for Indonesian citizens or through PT PMA.",
            "Beachfront property for rent in Seminyak. 4 bedrooms, ocean view, fully furnished. Monthly rent: IDR 150 million. Long-term lease available (25 years).",
            "Land for sale in Ubud. 1000 sqm, suitable for villa development. Leasehold 30 years. Price: IDR 2.2 billion. Zoning: residential/tourism.",
            "Commercial property for lease in Sanur. Ground floor shop space, 200 sqm. Prime location on main road. Annual rent: IDR 400 million."
        ],
        metadatas=[
            {"type": "villa", "location": "Canggu", "for": "sale", "price_idr": 8500000000, "ownership": "freehold"},
            {"type": "house", "location": "Seminyak", "for": "rent", "price_idr": 150000000, "ownership": "leasehold"},
            {"type": "land", "location": "Ubud", "for": "sale", "price_idr": 2200000000, "ownership": "leasehold"},
            {"type": "commercial", "location": "Sanur", "for": "lease", "price_idr": 400000000, "ownership": "lease"}
        ],
        ids=["prop_list_1", "prop_list_2", "prop_list_3", "prop_list_4"]
    )
    print("   ✅ Added 4 property listing documents")

    # Property Knowledge
    print("\n🏛️ 4. Property Knowledge Collection...")
    property_knowledge = ChromaDBClient(
        persist_directory="./apps/backend-rag/backend/data/chroma",
        collection_name="property_knowledge"
    )

    property_knowledge.add_texts(
        texts=[
            "HGB (Hak Guna Bangunan) explained: Right to Build certificate. Valid for 30 years, renewable for another 20. Foreigners cannot own HGB directly - must use PT PMA structure.",
            "Freehold vs Leasehold in Bali: Freehold (Hak Milik) is permanent ownership, only for Indonesian citizens. Leasehold is common for foreigners (25-30 years), renewable. Always verify extension clauses.",
            "Property ownership structures for foreigners: Options include PT PMA (foreign company), leasehold, or nominee agreements. PT PMA is safest legal option for long-term ownership.",
            "IMB (Building Permit) requirements: Mandatory for all construction in Bali. Process takes 3-6 months. Requires land certificate, site plan, and environmental clearance."
        ],
        metadatas=[
            {"topic": "hgb", "category": "ownership_types", "audience": "foreign_investors"},
            {"topic": "freehold_vs_leasehold", "category": "ownership_types", "audience": "general"},
            {"topic": "foreign_ownership", "category": "legal_structures", "audience": "foreign_investors"},
            {"topic": "building_permits", "category": "regulations", "audience": "developers"}
        ],
        ids=["prop_kb_1", "prop_kb_2", "prop_kb_3", "prop_kb_4"]
    )
    print("   ✅ Added 4 property knowledge documents")

    # Legal Updates
    print("\n⚖️ 5. Legal Updates Collection...")
    legal_updates = ChromaDBClient(
        persist_directory="./apps/backend-rag/backend/data/chroma",
        collection_name="legal_updates"
    )

    legal_updates.add_texts(
        texts=[
            "New PT PMA regulation 2025: Minimum capital requirement reduced from IDR 10 billion to IDR 5 billion for certain sectors (tech, creative industries). Effective March 2025.",
            "Labor law update: Minimum wage (UMK) in Bali increased to IDR 3.2 million/month (up 8% from 2024). Companies must adjust employee salaries by February 2025.",
            "OSS system upgrade: Online Single Submission portal now requires face recognition verification for company directors. Mandatory for all new NIB applications from April 2025.",
            "Environmental regulation changes: EIA (AMDAL) now required for all developments above 5000 sqm in Bali. Previously threshold was 10000 sqm. Stricter coastal protection rules."
        ],
        metadatas=[
            {"date": "2025-01-20", "type": "company_law", "impact": "high", "sector": "all"},
            {"date": "2025-01-05", "type": "labor_law", "impact": "high", "sector": "all"},
            {"date": "2025-02-15", "type": "licensing", "impact": "medium", "sector": "all"},
            {"date": "2025-03-01", "type": "environmental", "impact": "high", "sector": "construction"}
        ],
        ids=["legal_update_1", "legal_update_2", "legal_update_3", "legal_update_4"]
    )
    print("   ✅ Added 4 legal update documents")

    print("\n" + "="*70)
    print("✅ TEST DATA POPULATION COMPLETE!")
    print("="*70)
    print("\nCollections populated:")
    print("  • tax_updates: 3 documents")
    print("  • tax_knowledge: 4 documents")
    print("  • property_listings: 4 documents")
    print("  • property_knowledge: 4 documents")
    print("  • legal_updates: 4 documents")
    print("\nTotal: 19 test documents added to Oracle collections")
    print("\n🧪 You can now test POST /api/oracle/query endpoint!")

if __name__ == "__main__":
    populate_test_data()
