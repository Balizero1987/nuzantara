"""
Migrate Oracle System Knowledge Bases to PostgreSQL + ChromaDB
Reads JSON files from projects/oracle-system/agents/knowledge-bases/
Populates PostgreSQL tables and ChromaDB collections
"""

import json
import os
import sys
from pathlib import Path
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_values, Json
import chromadb
from loguru import logger

# Add parent directory to path
sys.path.append(str(Path(__file__).parent / "backend"))

from core.embeddings import EmbeddingsGenerator


class OracleKBMigrator:
    """Migrate Oracle knowledge bases to PostgreSQL + ChromaDB"""

    def __init__(self):
        # PostgreSQL connection (optional for local dev)
        database_url = os.getenv("DATABASE_URL")
        if database_url:
            try:
                self.pg_conn = psycopg2.connect(database_url)
                self.pg_cursor = self.pg_conn.cursor()
                logger.info("✅ PostgreSQL connected")
            except Exception as e:
                logger.warning(f"⚠️  PostgreSQL not available: {e}")
                logger.info("📁 Will use ChromaDB only (local development mode)")
                self.pg_conn = None
                self.pg_cursor = None
        else:
            logger.info("📁 DATABASE_URL not set - using ChromaDB only (local development)")
            self.pg_conn = None
            self.pg_cursor = None

        # ChromaDB
        self.chroma_client = chromadb.PersistentClient(path="./data/oracle_kb")
        self.embedder = EmbeddingsGenerator()

        # Load Oracle JSON files
        self.oracle_path = Path(__file__).parent.parent / "projects" / "oracle-system" / "agents" / "knowledge-bases"
        logger.info(f"Loading Oracle KBs from: {self.oracle_path}")

        with open(self.oracle_path / "visa-oracle-kb.json") as f:
            self.visa_kb = json.load(f)

        with open(self.oracle_path / "kbli-eye-kb.json") as f:
            self.kbli_kb = json.load(f)

    def migrate_visa_types(self):
        """Migrate visa types from visa-oracle-kb.json"""
        logger.info("Migrating visa types...")

        visa_types = self.visa_kb.get("visaTypes", {})
        rows = []

        for code, data in visa_types.items():
            row = (
                code,
                data.get("name"),
                data.get("duration"),
                data.get("extensions"),
                data.get("totalStay"),
                data.get("renewable", False),
                data.get("processingTime", {}).get("normal") if isinstance(data.get("processingTime"), dict) else None,
                data.get("processingTime", {}).get("express") if isinstance(data.get("processingTime"), dict) else None,
                Json(data.get("processingTime", {})) if isinstance(data.get("processingTime"), dict) else None,
                data.get("cost", {}).get("visa") if isinstance(data.get("cost"), dict) else None,
                data.get("cost", {}).get("extension") if isinstance(data.get("cost"), dict) else None,
                Json(data.get("cost", {})),
                data.get("requirements", []),
                data.get("restrictions", []),
                data.get("allowedActivities", []),
                data.get("benefits", []),
                data.get("process", []),
                data.get("tips", []),
                self._classify_visa_category(code),
                True,  # foreign_eligible default
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO visa_types (
                code, name, duration, extensions, total_stay, renewable,
                processing_time_normal, processing_time_express, processing_timeline,
                cost_visa, cost_extension, cost_details,
                requirements, restrictions, allowed_activities, benefits, process_steps, tips,
                category, foreign_eligible, metadata
            ) VALUES %s
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                duration = EXCLUDED.duration,
                last_updated = NOW()
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} visa types")

    def migrate_immigration_offices(self):
        """Migrate immigration offices"""
        logger.info("Migrating immigration offices...")

        offices = self.visa_kb.get("immigrationOffices", {})
        rows = []

        for code, data in offices.items():
            row = (
                code,
                code.title(),  # name
                data.get("address"),
                code.title() if code not in ["AIRPORT"] else "Ngurah Rai",  # city
                "Bali",
                data.get("hours"),
                data.get("bestTime"),
                data.get("avoidTime"),
                data.get("parking"),
                data.get("tips", []),
                data.get("lessCredits", False) or data.get("lessCrowded", False),
                data.get("services", []) if isinstance(data.get("services"), list) else [data.get("services")] if data.get("services") else [],
                None,  # lat
                None,  # lng
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO immigration_offices (
                code, name, address, city, province, hours, best_time, avoid_time,
                parking, tips, less_crowded, services, lat, lng, metadata
            ) VALUES %s
            ON CONFLICT (code) DO UPDATE SET
                address = EXCLUDED.address,
                last_updated = NOW()
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} immigration offices")

    def migrate_immigration_issues(self):
        """Migrate common immigration issues"""
        logger.info("Migrating immigration issues...")

        common_issues = self.visa_kb.get("commonIssues", {})
        rows = []

        # Rejections
        for issue in common_issues.get("rejections", []):
            row = (
                "rejection",
                issue.get("reason"),
                issue.get("solution"),
                float(issue.get("frequency", "0%").replace("%", "").split()[0]) if issue.get("frequency") else None,
                None,
                None,
                None,
                None,
                Json({}),
            )
            rows.append(row)

        # Delays
        for issue in common_issues.get("delays", []):
            row = (
                "delay",
                issue.get("cause"),
                issue.get("prevention"),
                None,
                int(issue.get("impact", "0 days").split("-")[0].split()[0]) if issue.get("impact") else None,
                issue.get("prevention"),
                None,
                None,
                Json({}),
            )
            rows.append(row)

        # Emergency procedures
        emergency = self.visa_kb.get("emergencyProcedures", {})

        # Overstay
        if "overstay" in emergency:
            overstay = emergency["overstay"]
            row = (
                "overstay",
                "Visa overstay violation",
                overstay.get("process", ""),
                None,
                None,
                None,
                None,
                None,
                Json({"fine": overstay.get("fine"), "maxFine": overstay.get("maxFine"), "consequences": overstay.get("consequences")}),
            )
            rows.append(row)

        # Lost passport
        if "lostPassport" in emergency:
            lost = emergency["lostPassport"]
            row = (
                "lost_passport",
                "Passport lost in Indonesia",
                "Follow emergency procedure",
                None,
                None,
                None,
                lost.get("steps", []),
                lost.get("timeline"),
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO immigration_issues (
                issue_type, reason_or_cause, solution, frequency_pct, impact_days,
                prevention, steps, timeline, metadata
            ) VALUES %s
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} immigration issues")

    def migrate_business_structures(self):
        """Migrate business structures from KBLI KB"""
        logger.info("Migrating business structures...")

        structures = self.kbli_kb.get("businessStructures", {})
        rows = []

        for code, data in structures.items():
            row = (
                code,
                data.get("name"),
                None,  # indonesian name
                data.get("minimumCapital"),
                data.get("minimumInvestment"),
                data.get("ownership"),
                data.get("requirements", []),
                Json(data.get("timeline", {})) if isinstance(data.get("timeline"), dict) else None,
                data.get("timeline") if isinstance(data.get("timeline"), str) else None,
                Json(data.get("costs", {})),
                data.get("advantages", []),
                data.get("restrictions", []),
                data.get("structure"),
                data.get("purpose"),
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO business_structures (
                code, name, name_indonesian, minimum_capital, minimum_investment, ownership_rules,
                requirements, timeline_details, timeline_total, costs, advantages, restrictions,
                structure_info, purpose, metadata
            ) VALUES %s
            ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                last_updated = NOW()
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} business structures")

    def migrate_kbli_codes(self):
        """Migrate KBLI codes"""
        logger.info("Migrating KBLI codes...")

        popular_kbli = self.kbli_kb.get("kbliDatabase", {}).get("popularKBLI", {})
        rows = []

        for code, data in popular_kbli.items():
            row = (
                code,
                data.get("title"),
                data.get("description"),
                data.get("category"),
                self._get_category_name(data.get("category")),
                data.get("foreignEligible", False),
                data.get("minimumInvestment"),
                data.get("licenses", []),
                data.get("popularity"),
                data.get("tips"),
                data.get("restrictions"),
                data.get("alternative"),
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO kbli_codes (
                code, title, description, category_letter, category_name, foreign_eligible,
                minimum_investment, licenses, popularity, tips, restrictions, alternative_code, metadata
            ) VALUES %s
            ON CONFLICT (code) DO UPDATE SET
                title = EXCLUDED.title,
                last_updated = NOW()
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} KBLI codes")

    def migrate_kbli_combinations(self):
        """Migrate KBLI combinations/packages"""
        logger.info("Migrating KBLI combinations...")

        combinations = self.kbli_kb.get("kbliDatabase", {}).get("combinations", {})
        rows = []

        for package_name, codes in combinations.items():
            row = (
                package_name,
                package_name.replace("Package", " Package").title(),
                codes,
                None,
                None,
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO kbli_combinations (
                package_name, display_name, kbli_codes, description, use_case, metadata
            ) VALUES %s
            ON CONFLICT (package_name) DO UPDATE SET
                kbli_codes = EXCLUDED.kbli_codes
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} KBLI combinations")

    def migrate_licenses(self):
        """Migrate Indonesian licenses"""
        logger.info("Migrating licenses...")

        licenses_data = self.kbli_kb.get("licenses", {})
        rows = []

        for code, data in licenses_data.items():
            status = "active"
            integrated_into = None

            if data.get("now") and "Integrated" in data.get("now"):
                status = "integrated_in_nib"
                integrated_into = "NIB"

            row = (
                code,
                data.get("fullName"),
                data.get("purpose"),
                data.get("validity"),
                data.get("process"),
                data.get("requirements", []),
                data.get("required"),
                data.get("restrictions", []),
                status,
                integrated_into,
                data.get("sectors", []),
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO indonesian_licenses (
                code, full_name, purpose, validity, process_info, requirements, required_for,
                restrictions, status, integrated_into, applicable_sectors, metadata
            ) VALUES %s
            ON CONFLICT (code) DO UPDATE SET
                full_name = EXCLUDED.full_name,
                last_updated = NOW()
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} licenses")

    def migrate_oss_info(self):
        """Migrate OSS system information"""
        logger.info("Migrating OSS system info...")

        oss = self.kbli_kb.get("ossSystem", {})
        rows = []

        # Basic fields
        for key in ["url", "status", "maintenanceSchedule"]:
            if key in oss:
                rows.append((key, str(oss[key]), None, Json({})))

        # Array fields
        if "features" in oss:
            rows.append(("features", None, oss["features"], Json({})))

        if "tips" in oss:
            rows.append(("tips", None, oss["tips"], Json({})))

        query = """
            INSERT INTO oss_system_info (key, value, value_array, metadata)
            VALUES %s
            ON CONFLICT (key) DO UPDATE SET
                value = EXCLUDED.value,
                value_array = EXCLUDED.value_array,
                last_updated = NOW()
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} OSS system info items")

    def migrate_oss_issues(self):
        """Migrate OSS common issues"""
        logger.info("Migrating OSS issues...")

        common_issues = self.kbli_kb.get("ossSystem", {}).get("commonIssues", {})
        rows = []

        for category, issues in common_issues.items():
            for issue in issues:
                row = (
                    category,
                    issue.get("error") or issue.get("issue"),
                    issue.get("solution"),
                    issue.get("frequency"),
                    issue.get("timeline"),
                    issue.get("browser"),
                    Json({}),
                )
                rows.append(row)

        query = """
            INSERT INTO oss_issues (
                issue_category, error_or_issue, solution, frequency_description,
                timeline, browser_recommendation, metadata
            ) VALUES %s
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} OSS issues")

    def migrate_compliance_calendar(self):
        """Migrate compliance deadlines"""
        logger.info("Migrating compliance calendar...")

        compliance = self.kbli_kb.get("complianceCalendar", {})
        rows = []

        # Monthly
        for day, tasks in compliance.get("monthly", {}).items():
            if isinstance(tasks, list):
                for task in tasks:
                    rows.append(("monthly", day, task, None, None, None, True, Json({})))

        # Quarterly
        for key, data in compliance.get("quarterly", {}).items():
            if isinstance(data, dict):
                rows.append((
                    "quarterly",
                    data.get("deadline"),
                    key,
                    data.get("applies"),
                    data.get("platform"),
                    data.get("penalty"),
                    True,
                    Json({})
                ))

        # Annual
        for month, tasks in compliance.get("annual", {}).items():
            if isinstance(tasks, list):
                for task in tasks:
                    rows.append(("annual", month, task, None, None, None, True, Json({})))
            elif isinstance(tasks, str):
                rows.append(("annual", month, tasks, None, None, None, True, Json({})))

        query = """
            INSERT INTO compliance_deadlines (
                deadline_type, deadline_day, task_name, applies_to, platform, penalty, recurring, metadata
            ) VALUES %s
        """

        execute_values(self.pg_cursor, query, rows)
        self.pg_conn.commit()
        logger.success(f"Migrated {len(rows)} compliance deadlines")

    def migrate_recent_updates(self):
        """Migrate recent regulatory updates"""
        logger.info("Migrating recent updates...")

        updates = self.visa_kb.get("recentUpdates", [])
        rows = []

        for update in updates:
            row = (
                update.get("date"),
                "visa_oracle",
                update.get("update"),
                update.get("update"),
                update.get("impact"),
                "system_change",
                "medium",
                None,
                Json({}),
            )
            rows.append(row)

        query = """
            INSERT INTO regulatory_updates (
                update_date, source, update_title, update_description, impact,
                update_type, impact_level, url, metadata
            ) VALUES %s
        """

        if rows:
            execute_values(self.pg_cursor, query, rows)
            self.pg_conn.commit()
            logger.success(f"Migrated {len(rows)} recent updates")

    def populate_chromadb(self):
        """Populate ChromaDB with searchable content"""
        logger.info("Populating ChromaDB with Oracle knowledge...")

        # Create collections
        try:
            visa_collection = self.chroma_client.get_or_create_collection("oracle_visa_knowledge")
            kbli_collection = self.chroma_client.get_or_create_collection("oracle_kbli_knowledge")
        except Exception as e:
            logger.error(f"ChromaDB error: {e}")
            return

        # Add visa types to ChromaDB
        visa_docs = []
        visa_ids = []
        visa_metas = []

        for code, data in self.visa_kb.get("visaTypes", {}).items():
            doc = f"""
Visa Type: {data.get('name')} ({code})
Duration: {data.get('duration')}
Extensions: {data.get('extensions')}
Total Stay: {data.get('totalStay')}

Requirements:
{chr(10).join('- ' + r for r in data.get('requirements', []))}

Restrictions:
{chr(10).join('- ' + r for r in data.get('restrictions', []))}

Tips:
{chr(10).join('- ' + t for t in data.get('tips', []))}
"""
            visa_docs.append(doc)
            visa_ids.append(f"visa_{code}")
            visa_metas.append({"code": code, "name": data.get("name"), "category": self._classify_visa_category(code)})

        if visa_docs:
            embeddings = [self.embedder.generate_single_embedding(doc) for doc in visa_docs]
            visa_collection.upsert(ids=visa_ids, documents=visa_docs, embeddings=embeddings, metadatas=visa_metas)
            logger.success(f"Added {len(visa_docs)} visa types to ChromaDB")

        # Add KBLI codes to ChromaDB
        kbli_docs = []
        kbli_ids = []
        kbli_metas = []

        for code, data in self.kbli_kb.get("kbliDatabase", {}).get("popularKBLI", {}).items():
            doc = f"""
KBLI Code: {code} - {data.get('title')}
Category: {data.get('category')}
Foreign Eligible: {'Yes' if data.get('foreignEligible') else 'No'}
Minimum Investment: {data.get('minimumInvestment', 'N/A')}

Description: {data.get('description')}

Licenses Required:
{chr(10).join('- ' + lic for lic in data.get('licenses', []))}

Tips: {data.get('tips', '')}
Restrictions: {data.get('restrictions', '')}
"""
            kbli_docs.append(doc)
            kbli_ids.append(f"kbli_{code}")
            kbli_metas.append({
                "code": code,
                "title": data.get("title"),
                "category": data.get("category"),
                "foreign_eligible": str(data.get("foreignEligible", False)),
                "popularity": data.get("popularity", "")
            })

        if kbli_docs:
            embeddings = [self.embedder.generate_single_embedding(doc) for doc in kbli_docs]
            kbli_collection.upsert(ids=kbli_ids, documents=kbli_docs, embeddings=embeddings, metadatas=kbli_metas)
            logger.success(f"Added {len(kbli_docs)} KBLI codes to ChromaDB")

    def _classify_visa_category(self, code: str) -> str:
        """Classify visa type into category"""
        if "B211A" in code:
            return "tourism"
        elif "B211B" in code:
            return "business"
        elif "INVESTOR" in code:
            return "investor"
        elif "WORKING" in code:
            return "working"
        elif "KITAP" in code:
            return "permanent"
        elif "C1" in code:
            return "multiple_entry"
        return "other"

    def _get_category_name(self, letter: str) -> str:
        """Get category name from letter"""
        categories = self.kbli_kb.get("kbliDatabase", {}).get("categories", {})
        return categories.get(letter, "Unknown")

    def run_full_migration(self):
        """Run complete migration"""
        logger.info("=" * 70)
        logger.info("ORACLE KNOWLEDGE BASE MIGRATION - Starting")
        logger.info("=" * 70)

        try:
            # PostgreSQL migrations
            self.migrate_visa_types()
            self.migrate_immigration_offices()
            self.migrate_immigration_issues()
            self.migrate_business_structures()
            self.migrate_kbli_codes()
            self.migrate_kbli_combinations()
            self.migrate_licenses()
            self.migrate_oss_info()
            self.migrate_oss_issues()
            self.migrate_compliance_calendar()
            self.migrate_recent_updates()

            # ChromaDB population
            self.populate_chromadb()

            logger.info("=" * 70)
            logger.success("MIGRATION COMPLETE!")
            logger.info("=" * 70)

        except Exception as e:
            logger.error(f"Migration failed: {e}")
            self.pg_conn.rollback()
            raise
        finally:
            self.pg_cursor.close()
            self.pg_conn.close()


if __name__ == "__main__":
    migrator = OracleKBMigrator()
    migrator.run_full_migration()
