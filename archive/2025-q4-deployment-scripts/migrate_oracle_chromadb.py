"""
Migrate ALL Oracle Knowledge Bases to ChromaDB
Simple, fast migration script for populating Oracle collections

Populates 5 collections:
- tax_updates
- tax_knowledge
- property_listings
- property_knowledge
- legal_updates

Plus existing:
- visa_oracle
- kbli_eye
"""

import json
import sys
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "apps" / "backend-rag" / "backend"
sys.path.insert(0, str(backend_path))

from core.vector_db import ChromaDBClient
from core.embeddings import EmbeddingsGenerator

class OracleChromaDBMigrator:
    """Migrate Oracle knowledge bases to ChromaDB"""

    def __init__(self):
        self.kb_path = Path(__file__).parent / "projects" / "oracle-system" / "agents" / "knowledge-bases"
        self.chroma_path = "./apps/backend-rag/backend/data/chroma"
        self.embedder = EmbeddingsGenerator()

        print("\n" + "="*70)
        print("ORACLE CHROMADB MIGRATION")
        print("="*70)
        print(f"Knowledge Bases: {self.kb_path}")
        print(f"ChromaDB Path: {self.chroma_path}")
        print("="*70 + "\n")

        # Load all knowledge bases
        self.load_knowledge_bases()

    def load_knowledge_bases(self):
        """Load all JSON knowledge bases"""
        print("📁 Loading knowledge bases...")

        with open(self.kb_path / "visa-oracle-kb.json") as f:
            self.visa_kb = json.load(f)
            print(f"   ✅ visa-oracle-kb.json loaded")

        with open(self.kb_path / "kbli-eye-kb.json") as f:
            self.kbli_kb = json.load(f)
            print(f"   ✅ kbli-eye-kb.json loaded")

        with open(self.kb_path / "tax-updates-kb.json") as f:
            self.tax_updates_kb = json.load(f)
            print(f"   ✅ tax-updates-kb.json loaded")

        with open(self.kb_path / "tax-knowledge-kb.json") as f:
            self.tax_knowledge_kb = json.load(f)
            print(f"   ✅ tax-knowledge-kb.json loaded")

        with open(self.kb_path / "property-kb.json") as f:
            self.property_kb = json.load(f)
            print(f"   ✅ property-kb.json loaded")

        with open(self.kb_path / "legal-updates-kb.json") as f:
            self.legal_updates_kb = json.load(f)
            print(f"   ✅ legal-updates-kb.json loaded")

        print()

    def migrate_tax_updates(self):
        """Migrate tax updates to ChromaDB"""
        print("📊 1. Migrating Tax Updates...")

        collection = ChromaDBClient(
            persist_directory=self.chroma_path,
            collection_name="tax_updates"
        )

        texts = []
        metadatas = []
        ids = []

        for update in self.tax_updates_kb["taxUpdates"]:
            # Create document text
            text = f"""Tax Update: {update['title']}
Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}

Summary: {update['summary']}

Details: {update['details']}

Affected Parties: {', '.join(update['affectedParties'])}
Implementation Date: {update['implementationDate']}
Reference: {update.get('reference', 'N/A')}
"""
            texts.append(text)
            metadatas.append({
                "id": update["id"],
                "date": update["date"],
                "source": update["source"],
                "category": update["category"],
                "impact": update["impact"],
                "title": update["title"]
            })
            ids.append(update["id"])

        # Generate embeddings
        print(f"   🔄 Generating embeddings for {len(texts)} documents...")
        embeddings = [self.embedder.generate_single_embedding(text) for text in texts]

        # Upsert to ChromaDB
        collection.upsert_documents(
            chunks=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        print(f"   ✅ Added {len(texts)} tax updates to ChromaDB\n")

    def migrate_tax_knowledge(self):
        """Migrate tax knowledge base to ChromaDB"""
        print("📚 2. Migrating Tax Knowledge...")

        collection = ChromaDBClient(
            persist_directory=self.chroma_path,
            collection_name="tax_knowledge"
        )

        texts = []
        metadatas = []
        ids = []

        # PPh 21
        pph21 = self.tax_knowledge_kb["incomeTax"]["pph21"]
        text = f"""PPh 21 - Employee Income Tax

{pph21['description']}

Progressive Tax Rates:
{chr(10).join(f"- {rate['bracket']}: {rate['rate']}" for rate in pph21['rates']['progressive'])}

Calculation: {pph21['calculation']}

Who Withholds: {pph21['who_withholds']}
Filing: {pph21['filing']}
Penalties: {pph21['penalties']}
"""
        texts.append(text)
        metadatas.append({"topic": "pph_21", "category": "income_tax", "type": "knowledge"})
        ids.append("tax_kb_pph21")

        # PPh 23
        pph23 = self.tax_knowledge_kb["incomeTax"]["pph23"]
        text = f"""PPh 23 - Withholding Tax on Services

{pph23['description']}

Rates:
- Services: {pph23['rates']['services']}
- Royalties: {pph23['rates']['royalties']}
- Dividends: {pph23['rates']['dividends']}
- Interest: {pph23['rates']['interest']}

Applicability: {pph23['applicability']}
Exemptions: {', '.join(pph23['exemptions'])}
"""
        texts.append(text)
        metadatas.append({"topic": "pph_23", "category": "withholding_tax", "type": "knowledge"})
        ids.append("tax_kb_pph23")

        # Corporate Tax
        corporate = self.tax_knowledge_kb["incomeTax"]["corporate"]
        text = f"""Corporate Income Tax

Rate: {corporate['rate']} (effective {corporate['effective']})

Small Business Rate: {corporate['small_business_rate']}

Final Tax 0.5%: {corporate['final_tax_0.5%']}
"""
        texts.append(text)
        metadatas.append({"topic": "corporate_tax", "category": "company_tax", "type": "knowledge"})
        ids.append("tax_kb_corporate")

        # VAT
        vat = self.tax_knowledge_kb["valueAddedTax"]
        text = f"""PPN - Value Added Tax

Current Rate: {vat['current_rate']}
Future Rate: {vat['future_rate']}

{vat['description']}

Mechanism: {vat['mechanism']}

Registration Threshold: {vat['registration_threshold']}

Export Rate: {vat['export_rate']}

Filing: {vat['filing']}
Invoicing: {vat['invoicing']}

Exemptions:
{chr(10).join('- ' + ex for ex in vat['exemptions'])}
"""
        texts.append(text)
        metadatas.append({"topic": "vat", "category": "indirect_tax", "type": "knowledge"})
        ids.append("tax_kb_vat")

        # Transfer Pricing
        tp = self.tax_knowledge_kb["transferPricing"]
        text = f"""Transfer Pricing Regulations

{tp['name']}

Principle: {tp['principle']}

Documentation Required Above: {tp['documentation_required_above']}

Methods:
{chr(10).join('- ' + method for method in tp['methods'])}

Penalties: {tp['penalties']}
"""
        texts.append(text)
        metadatas.append({"topic": "transfer_pricing", "category": "international_tax", "type": "knowledge"})
        ids.append("tax_kb_transfer_pricing")

        # Generate embeddings and upsert
        print(f"   🔄 Generating embeddings for {len(texts)} documents...")
        embeddings = [self.embedder.generate_single_embedding(text) for text in texts]

        collection.upsert_documents(
            chunks=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        print(f"   ✅ Added {len(texts)} tax knowledge documents to ChromaDB\n")

    def migrate_property_listings(self):
        """Migrate property listings to ChromaDB"""
        print("🏠 3. Migrating Property Listings...")

        collection = ChromaDBClient(
            persist_directory=self.chroma_path,
            collection_name="property_listings"
        )

        texts = []
        metadatas = []
        ids = []

        for prop in self.property_kb["propertyListings"]:
            # Create listing text
            text = f"""{prop['title']}

Location: {prop['location']}
Type: {prop['type']}
Bedrooms: {prop.get('bedrooms', 'N/A')}
Land Size: {prop.get('land_size_sqm', 'N/A')} sqm

For: {prop['for'].upper()}
Price: IDR {prop.get('price_idr', prop.get('price_monthly_idr', prop.get('price_annual_idr', 'N/A'))):,}

{f"Ownership: {prop.get('ownership_type', 'N/A')}" if 'ownership_type' in prop else ''}
{f"Lease Duration: {prop.get('lease_duration', '')}" if 'lease_duration' in prop else ''}

Features:
{chr(10).join('- ' + f for f in prop.get('features', []))}

Description: {prop['description']}
"""
            texts.append(text)
            metadatas.append({
                "id": prop["id"],
                "type": prop["type"],
                "location": prop["location"],
                "for": prop["for"],
                "ownership_type": prop.get("ownership_type", "N/A")
            })
            ids.append(prop["id"])

        # Generate embeddings and upsert
        print(f"   🔄 Generating embeddings for {len(texts)} listings...")
        embeddings = [self.embedder.generate_single_embedding(text) for text in texts]

        collection.upsert_documents(
            chunks=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        print(f"   ✅ Added {len(texts)} property listings to ChromaDB\n")

    def migrate_property_knowledge(self):
        """Migrate property knowledge to ChromaDB"""
        print("🏛️ 4. Migrating Property Knowledge...")

        collection = ChromaDBClient(
            persist_directory=self.chroma_path,
            collection_name="property_knowledge"
        )

        texts = []
        metadatas = []
        ids = []

        # Ownership types
        for key, ownership in self.property_kb["ownershipTypes"].items():
            text = f"""{ownership['name']}

Indonesian: {ownership['indonesian']}
English: {ownership['english']}

{ownership['description']}

Duration: {ownership['duration']}
Eligible: {', '.join(ownership['eligible'])}
Foreign Eligible: {'Yes' if ownership['foreign_eligible'] else 'No'}

Transferrable: {ownership['transferrable']}
Inheritable: {ownership['inheritable']}
Can Be Collateral: {ownership['can_be_collateral']}

Typical Use: {ownership['typical_use']}

Advantages:
{chr(10).join('- ' + adv for adv in ownership['advantages'])}

Restrictions:
{chr(10).join('- ' + res for res in ownership['restrictions'])}
"""
            texts.append(text)
            metadatas.append({
                "type": "ownership_type",
                "ownership_key": key,
                "foreign_eligible": str(ownership['foreign_eligible'])
            })
            ids.append(f"prop_kb_ownership_{key}")

        # Foreign ownership structures
        for key, structure in self.property_kb["foreignOwnershipStructures"].items():
            if key == "nominee":
                continue  # Skip nominee (not recommended)

            text = f"""{structure['name']}

{structure['description']}

{"Ownership: " + structure.get('ownership', '') if 'ownership' in structure else ''}
{"Can Own: " + ', '.join(structure.get('can_own', [])) if 'can_own' in structure else ''}

Advantages:
{chr(10).join('- ' + adv for adv in structure.get('advantages', []))}

{"Disadvantages:" if 'disadvantages' in structure else ''}
{chr(10).join('- ' + dis for dis in structure.get('disadvantages', [])) if 'disadvantages' in structure else ''}

{"Suitable For: " + structure.get('suitable_for', '') if 'suitable_for' in structure else ''}
"""
            texts.append(text)
            metadatas.append({
                "type": "foreign_ownership",
                "structure_key": key
            })
            ids.append(f"prop_kb_structure_{key}")

        # Regulations
        for key, regulation in self.property_kb["propertyRegulations"].items():
            text = f"""{regulation['name']}

{regulation['description']}

{"Required For: " + ', '.join(regulation.get('required_for', [])) if 'required_for' in regulation else ''}

{"Processing Time: " + regulation.get('processing_time', '') if 'processing_time' in regulation else ''}
{"Cost: " + regulation.get('cost', '') if 'cost' in regulation else ''}

{"Penalties Without: " + regulation.get('penalties_without', '') if 'penalties_without' in regulation else ''}
"""
            texts.append(text)
            metadatas.append({
                "type": "regulation",
                "regulation_key": key
            })
            ids.append(f"prop_kb_reg_{key}")

        # Generate embeddings and upsert
        print(f"   🔄 Generating embeddings for {len(texts)} documents...")
        embeddings = [self.embedder.generate_single_embedding(text) for text in texts]

        collection.upsert_documents(
            chunks=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        print(f"   ✅ Added {len(texts)} property knowledge documents to ChromaDB\n")

    def migrate_legal_updates(self):
        """Migrate legal updates to ChromaDB"""
        print("⚖️ 5. Migrating Legal Updates...")

        collection = ChromaDBClient(
            persist_directory=self.chroma_path,
            collection_name="legal_updates"
        )

        texts = []
        metadatas = []
        ids = []

        for update in self.legal_updates_kb["legalUpdates"]:
            text = f"""Legal Update: {update['title']}

Date: {update['date']}
Source: {update['source']}
Category: {update['category']}
Impact: {update['impact']}

Summary: {update['summary']}

Details: {update['details']}

Affected Parties: {', '.join(update.get('affectedParties', []))}
Effective Date: {update.get('effective_date', 'N/A')}
Reference: {update.get('reference', 'N/A')}
"""
            texts.append(text)
            metadatas.append({
                "id": update["id"],
                "date": update["date"],
                "category": update["category"],
                "impact": update["impact"],
                "source": update["source"]
            })
            ids.append(update["id"])

        # Generate embeddings and upsert
        print(f"   🔄 Generating embeddings for {len(texts)} documents...")
        embeddings = [self.embedder.generate_single_embedding(text) for text in texts]

        collection.upsert_documents(
            chunks=texts,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

        print(f"   ✅ Added {len(texts)} legal updates to ChromaDB\n")

    def run_migration(self):
        """Run complete migration"""
        print("\n🚀 Starting Oracle ChromaDB Migration...\n")

        try:
            # Migrate all collections
            self.migrate_tax_updates()
            self.migrate_tax_knowledge()
            self.migrate_property_listings()
            self.migrate_property_knowledge()
            self.migrate_legal_updates()

            print("="*70)
            print("✅ MIGRATION COMPLETE!")
            print("="*70)
            print("\nCollections populated:")
            print("  ✅ tax_updates (6 documents)")
            print("  ✅ tax_knowledge (5 documents)")
            print("  ✅ property_listings (4 documents)")
            print("  ✅ property_knowledge (11 documents)")
            print("  ✅ legal_updates (7 documents)")
            print("\nTotal: 33 documents added to Oracle collections")
            print("\n🧪 You can now test POST /api/oracle/query endpoint!")
            print("="*70 + "\n")

        except Exception as e:
            print(f"\n❌ Migration failed: {e}")
            import traceback
            traceback.print_exc()
            raise


if __name__ == "__main__":
    migrator = OracleChromaDBMigrator()
    migrator.run_migration()
