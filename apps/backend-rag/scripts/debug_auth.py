#!/usr/bin/env python3
"""
NUZANTARA PRIME - Auth Debugger Script
Diagnostica il fallimento del login verificando l'hash nel database
"""

import asyncio
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent / "backend"
sys.path.insert(0, str(backend_path))

import asyncpg
import bcrypt

from app.core.config import settings


async def debug_auth():
    """
    Debug authentication: verifica l'hash nel database e testa la verifica
    """
    if not settings.database_url:
        print("❌ ERROR: DATABASE_URL not configured")
        sys.exit(1)

    print("🕵️  NUZANTARA PRIME - Auth Debugger")
    print("=" * 70)
    print("")

    conn = None
    try:
        # Connect to database
        conn = await asyncpg.connect(settings.database_url)
        print("✅ Connected to database")
        print("")

        # Query user
        query = """
            SELECT id, name, email, pin_hash, role, is_active
            FROM team_members
            WHERE LOWER(email) = LOWER($1)
        """

        row = await conn.fetchrow(query, "zero@balizero.com")

        if not row:
            print("❌ User not found: zero@balizero.com")
            sys.exit(1)

        print(f"✅ User found: {row['name']} ({row['email']})")
        print("")

        # ANALISI HASH
        pin_hash_from_db = row["pin_hash"]

        print("=" * 70)
        print("🔍 HASH ANALYSIS")
        print("=" * 70)
        print(f"Type: {type(pin_hash_from_db)}")
        print(f"Length: {len(pin_hash_from_db)}")
        print(f"Value (raw): {repr(pin_hash_from_db)}")
        print(f"Value (str): {pin_hash_from_db}")
        print(f"First 20 chars: {pin_hash_from_db[:20] if pin_hash_from_db else 'None'}")
        print("")

        # Check for common issues
        if pin_hash_from_db.startswith("b'"):
            print("⚠️  PROBLEMA TROVATO: Hash inizia con b' (stringa letterale di bytes)")
            print("   Questo significa che è stato salvato come rappresentazione stringa di bytes")
            print("   invece che come hash pulito.")
        elif pin_hash_from_db.startswith("$2"):
            print("✅ Hash sembra avere formato corretto (inizia con $2)")
        else:
            print("⚠️  Hash non inizia con $2 (formato inaspettato)")

        print("")

        # TEST VERIFICA
        pin = "010719"
        print("=" * 70)
        print("🧪 VERIFICATION TESTS")
        print("=" * 70)
        print(f"PIN da verificare: {pin}")
        print("")

        # Test 1: Standard encode (come nel service)
        print("Test 1: Standard encode (come nel service)")
        try:
            plain_bytes = pin.encode('utf-8')
            hashed_bytes = pin_hash_from_db.encode('utf-8')
            print(f"  plain_bytes type: {type(plain_bytes)}")
            print(f"  hashed_bytes type: {type(hashed_bytes)}")
            print(f"  hashed_bytes length: {len(hashed_bytes)}")
            print(f"  hashed_bytes first 20: {hashed_bytes[:20]}")

            result = bcrypt.checkpw(plain_bytes, hashed_bytes)
            if result:
                print("  ✅ Verification SUCCESS (Standard)")
            else:
                print("  ❌ Verification FAILED (Standard) - Hash non corrisponde")
        except TypeError as e:
            print(f"  💥 TypeError: {e}")
            print("  Probabile causa: hash non è una stringa valida o contiene caratteri non-ASCII")
        except ValueError as e:
            print(f"  💥 ValueError: {e}")
            print("  Probabile causa: hash non è nel formato bcrypt corretto")
        except Exception as e:
            print(f"  💥 Exception: {type(e).__name__}: {e}")
        print("")

        # Test 2: Se l'hash inizia con b', proviamo a pulirlo
        if pin_hash_from_db.startswith("b'") or pin_hash_from_db.startswith('b"'):
            print("Test 2: Tentativo di pulire hash con prefisso b'")
            try:
                # Rimuovi b' e ' finale se presente
                cleaned_hash = pin_hash_from_db
                if cleaned_hash.startswith("b'"):
                    cleaned_hash = cleaned_hash[2:]  # Rimuovi b'
                if cleaned_hash.startswith('b"'):
                    cleaned_hash = cleaned_hash[2:]  # Rimuovi b"
                if cleaned_hash.endswith("'") or cleaned_hash.endswith('"'):
                    cleaned_hash = cleaned_hash[:-1]  # Rimuovi quote finale

                print(f"  Hash pulito: {cleaned_hash[:30]}...")
                plain_bytes = pin.encode('utf-8')
                hashed_bytes = cleaned_hash.encode('utf-8')
                result = bcrypt.checkpw(plain_bytes, hashed_bytes)
                if result:
                    print("  ✅ Verification SUCCESS (Cleaned)")
                else:
                    print("  ❌ Verification FAILED (Cleaned)")
            except Exception as e:
                print(f"  💥 Exception: {type(e).__name__}: {e}")
            print("")

        # Test 3: Verifica diretta con stringa (se bcrypt supporta)
        print("Test 3: Verifica con hash come stringa (senza encode)")
        try:
            # Alcune versioni di bcrypt accettano stringhe direttamente
            result = bcrypt.checkpw(pin.encode('utf-8'), pin_hash_from_db)
            if result:
                print("  ✅ Verification SUCCESS (String direct)")
            else:
                print("  ❌ Verification FAILED (String direct)")
        except Exception as e:
            print(f"  💥 Exception: {type(e).__name__}: {e}")
        print("")

        print("=" * 70)
        print("📋 SUMMARY")
        print("=" * 70)
        print(f"Hash nel DB: {repr(pin_hash_from_db[:50])}...")
        print(f"PIN testato: {pin}")
        print("")
        print("💡 Se tutti i test falliscono, l'hash nel DB potrebbe essere:")
        print("   1. Generato con un algoritmo diverso (passlib vs bcrypt)")
        print("   2. Corrotto o malformato")
        print("   3. Salvato con encoding errato")
        print("")
        print("🔧 Soluzione: Eseguire reset-admin DOPO il deploy con bcrypt nativo")
        print("   per rigenerare l'hash con lo stesso metodo usato per la verifica.")
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
    asyncio.run(debug_auth())

