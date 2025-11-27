#!/usr/bin/env python3
"""
NUZANTARA PRIME - Team Identity Seeder
Popola il database team_members con i dati reali del team "Bali Zero"
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

import asyncpg

from app.core.config import settings
from app.modules.identity.service import IdentityService

# Team data - Bali Zero Team
TEAM_MEMBERS = [
    {
        "email": "zainal@balizero.com",
        "name": "Zainal Abidin",
        "role": "CEO",
        "pin": "847261",
        "department": "management",
        "language": "id",
        "notes": "52 anni, indonesiano e javanese, Islam"
    },
    {
        "email": "ruslana@balizero.com",
        "name": "Ruslana",
        "role": "Board Member",
        "pin": "293518",
        "department": "management",
        "language": "uk",
        "notes": "39 anni, ucraino, Donna che ama sognare"
    },
    {
        "email": "olena@balizero.com",
        "name": "Olena",
        "role": "Advisory",
        "pin": "925814",
        "department": "advisory",
        "language": "uk",
        "notes": "39 anni, ucraino"
    },
    {
        "email": "marta@balizero.com",
        "name": "Marta",
        "role": "Advisory",
        "pin": "847325",
        "department": "advisory",
        "language": "uk",
        "notes": "29 anni, ucraino"
    },
    {
        "email": "anton@balizero.com",
        "name": "Anton",
        "role": "Executive Consultant",
        "pin": "538147",
        "department": "setup",
        "language": "id",
        "notes": "31 anni, indonesiano/jakarta e javanese, Islam, Poco proattivo nel team"
    },
    {
        "email": "info@balizero.com",
        "name": "Vino",
        "role": "Junior Consultant",
        "pin": "926734",
        "department": "setup",
        "language": "id",
        "notes": "22 anni, indonesiano/jakarta e javanese, Islam, Poca conoscenza dell'inglese e parla pochissimo"
    },
    {
        "email": "krishna@balizero.com",
        "name": "Krishna",
        "role": "Executive Consultant",
        "pin": "471592",
        "department": "setup",
        "language": "id",
        "notes": "24 anni, indonesiano/jakarta e molto balinese, Indu, Ragazzo molto curioso e simpatico. Affabile. sta avendo un flirt con Dea"
    },
    {
        "email": "consulting@balizero.com",
        "name": "Adit",
        "role": "Supervisor",
        "pin": "385216",
        "department": "setup",
        "language": "id",
        "notes": "22 anni, indonesiano/jakarta e javanese e balinese, Islam, E' il mio vice sul campo, Ha cominciato a lavorare con me quando aveva 17 anni. Ha sempre dimostrato fedeltà e affetto verso di me. Ma spesso poco disciplinato e poco organizzato"
    },
    {
        "email": "ari.firda@balizero.com",
        "name": "Ari",
        "role": "Team Leader",
        "pin": "759483",
        "department": "setup",
        "language": "id",
        "notes": "24 anni, indonesiano/jakarta e molto sundanese, Islam, Ragazzo dalla grandissima forza di volontà. Da operaio in fabbrica a consulente legale con grande soddisfazione e ripercussione sulla sua vita privata, in positivo. Si è sposato a ottobre del 2025 con Lilis nella sua città di origine Bandung. Insieme ad Adit sono le mie rocce"
    },
    {
        "email": "dea@balizero.com",
        "name": "Dea",
        "role": "Executive Consultant",
        "pin": "162847",
        "department": "setup",
        "language": "id",
        "notes": "24 anni, indonesiano/jakarta e javanese, Islam, Ragazza curiosa, e disposta al sacrificio. Sta lavorando nel Setup team ma anche nel marketing e nel tax department. Un vero Jolly. Sta avendo un flirt con Krishna"
    },
    {
        "email": "surya@balizero.com",
        "name": "Surya",
        "role": "Team Leader",
        "pin": "894621",
        "department": "setup",
        "language": "id",
        "notes": "24 anni, indonesiano/jakarta e javanese, Islam, Lui è il Professore. Attentissimo alla cura personale e alla cura dei dettagli estetici. Si presenta bene ma deve studiare di più per avere quello scatto"
    },
    {
        "email": "damar@balizero.com",
        "name": "Damar",
        "role": "Junior Consultant",
        "pin": "637519",
        "department": "setup",
        "language": "id",
        "notes": "25 anni, indonesiano/jakarta e javanese, Islam, E' nuovo, ma un ragazzo ben educato. E questo è già sufficiente"
    },
    {
        "email": "tax@balizero.com",
        "name": "Veronika",
        "role": "Tax Manager",
        "pin": "418639",
        "department": "tax",
        "language": "id",
        "notes": "48 anni, indonesiano/jakarta, Cattolica, Il mio manager nel tax department, una donna che adora gli animali domestici. Molto rispettosa con me e ha creato una bella atmosfera con il gruppo del tax"
    },
    {
        "email": "angel.tax@balizero.com",
        "name": "Angel",
        "role": "Tax Lead",
        "pin": "341758",
        "department": "tax",
        "language": "id",
        "notes": "21 anni, indonesiano/jakarta e javanese, Islam, nonostante la sua giovane età è una veterana del tax. Giovane ragazza dedita alla sua task"
    },
    {
        "email": "kadek.tax@balizero.com",
        "name": "Kadek",
        "role": "Tax Lead",
        "pin": "786294",
        "department": "tax",
        "language": "id",
        "notes": "23 anni, indonesiano/jakarta e molto balinese, Indu, Ragazzo brillante che sta crescendo con l'inglese"
    },
    {
        "email": "dewa.ayu.tax@balizero.com",
        "name": "Dewa Ayu",
        "role": "Tax Lead",
        "pin": "259176",
        "department": "tax",
        "language": "id",
        "notes": "24 anni, indonesiano/jakarta e molto balinese, Indu, Dolce e ama Tik Tok"
    },
    {
        "email": "faisha.tax@balizero.com",
        "name": "Faisha",
        "role": "Take Care",
        "pin": "673942",
        "department": "tax",
        "language": "id",
        "notes": "19 anni, indonesiano/jakarta e molto sundanese, Un chiacchierone e si prende paura di tutto"
    },
    {
        "email": "rina@balizero.com",
        "name": "Rina",
        "role": "Reception",
        "pin": "214876",
        "department": "reception",
        "language": "id",
        "notes": "24 anni, indonesiano/jakarta e javanese, Islam, Un po' introversa ma molto buona"
    },
    {
        "email": "sahira@balizero.com",
        "name": "Sahira",
        "role": "Junior Marketing e Accounting",
        "pin": "512638",
        "department": "marketing",
        "language": "id",
        "notes": "24 anni, indonesiano/jakarta e javanese, Islam, cerca di darsi un tono a lavoro e questo mi piace"
    },
    {
        "email": "zero@balizero.com",
        "name": "Zero",
        "role": "Founder",
        "pin": "010719",
        "department": "leadership",
        "language": "it",
        "notes": "Founder and Tech Lead"
    },
    {
        "email": "amanda@balizero.com",
        "name": "Amanda",
        "role": "Consultant",
        "pin": "614829",
        "department": "setup",
        "language": "id",
        "notes": "Consultant"
    },
    {
        "email": "nina@balizero.com",
        "name": "Nina",
        "role": "Advisory",
        "pin": "582931",
        "department": "marketing",
        "language": "id",
        "notes": "Advisory"
    },
]


async def seed_team():
    """
    Popola il database con i membri del team Bali Zero
    """
    if not settings.database_url:
        print("❌ ERROR: DATABASE_URL not configured")
        sys.exit(1)

    print("🌱 NUZANTARA PRIME - Team Identity Seeder")
    print("=" * 70)
    print(f"📋 Seeding {len(TEAM_MEMBERS)} team members...")
    print("")

    # Initialize identity service for password hashing
    identity_service = IdentityService()

    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(settings.database_url)
        print("✅ Connected to database")
        print("")

        # Ensure table exists
        await conn.execute(
            """
            CREATE TABLE IF NOT EXISTS team_members (
                id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                pin_hash VARCHAR(255) NOT NULL,
                role VARCHAR(100) NOT NULL DEFAULT 'member',
                department VARCHAR(100),
                language VARCHAR(10) DEFAULT 'en',
                personalized_response BOOLEAN DEFAULT false,
                is_active BOOLEAN DEFAULT true,
                last_login TIMESTAMP,
                failed_attempts INTEGER DEFAULT 0,
                locked_until TIMESTAMP,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW(),
                notes TEXT
            )
            """
        )

        # Create index if not exists
        await conn.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_team_members_email ON team_members(LOWER(email))
            """
        )

        created_count = 0
        updated_count = 0
        error_count = 0

        for member in TEAM_MEMBERS:
            try:
                # Hash PIN using identity service (bcrypt native)
                pin_hash = identity_service.get_password_hash(member["pin"])

                # Check if user exists
                existing = await conn.fetchrow(
                    """
                    SELECT id, name, email FROM team_members
                    WHERE LOWER(email) = LOWER($1)
                    """,
                    member["email"]
                )

                if existing:
                    # Update existing user
                    await conn.execute(
                        """
                        UPDATE team_members
                        SET name = $1,
                            pin_hash = $2,
                            role = $3,
                            department = $4,
                            language = $5,
                            notes = $6,
                            is_active = true,
                            failed_attempts = 0,
                            locked_until = NULL,
                            updated_at = NOW()
                        WHERE LOWER(email) = LOWER($7)
                        """,
                        member["name"],
                        pin_hash,
                        member["role"],
                        member["department"],
                        member.get("language", "en"),
                        member.get("notes"),
                        member["email"]
                    )
                    updated_count += 1
                    print(f"  🔄 Updated: {member['name']} ({member['email']})")
                else:
                    # Create new user
                    await conn.execute(
                        """
                        INSERT INTO team_members (
                            name, email, pin_hash, role, department, language, 
                            notes, is_active
                        )
                        VALUES ($1, $2, $3, $4, $5, $6, $7, true)
                        """,
                        member["name"],
                        member["email"],
                        pin_hash,
                        member["role"],
                        member["department"],
                        member.get("language", "en"),
                        member.get("notes")
                    )
                    created_count += 1
                    print(f"  ✅ Created: {member['name']} ({member['email']})")

            except Exception as e:
                error_count += 1
                print(f"  ❌ Error processing {member['email']}: {e}")

        print("")
        print("=" * 70)
        print("📊 SEEDING SUMMARY")
        print("=" * 70)
        print(f"  ✅ Created: {created_count}")
        print(f"  🔄 Updated: {updated_count}")
        print(f"  ❌ Errors: {error_count}")
        print(f"  📋 Total: {len(TEAM_MEMBERS)}")
        print("")
        print("🎉 Team seeding completed!")
        print("")

        # Verify final count
        final_count = await conn.fetchval(
            "SELECT COUNT(*) FROM team_members WHERE is_active = true"
        )
        print(f"📈 Active team members in database: {final_count}")
        print("")

    except asyncpg.exceptions.PostgresError as e:
        print(f"❌ Database error: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        if conn:
            await conn.close()
            print("✅ Database connection closed")


if __name__ == "__main__":
    asyncio.run(seed_team())

