"""
Knowledge Base Ingestion Script

This script:
1. Reads all .txt files from kb/ directory
2. Chunks the text into manageable pieces
3. Generates embeddings using nomic-embed-text
4. Stores embeddings in ChromaDB for semantic search

Usage:
    cd /path/to/backend
    source venv/bin/activate
    python scripts/run_ingestion.py

Note:
    - This will DELETE existing ChromaDB and recreate it
    - Make a backup before running if needed
    - Requires kb/ directory with .txt files
"""

import sys
from pathlib import Path

# Add parent directory to Python path
sys.path.append(str(Path(__file__).parent.parent))

try:
    from services.kb_ingestion import ingest_documents
    KB_SERVICE_AVAILABLE = True
except ImportError:
    KB_SERVICE_AVAILABLE = False

def run_ingestion():
    """Run the knowledge base ingestion process"""

    if not KB_SERVICE_AVAILABLE:
        print("❌ Servizio kb_ingestion non disponibile!")
        print("\nQuesto script richiede:")
        print("  - services/kb_ingestion.py")
        print("  - ChromaDB installato (pip install chromadb)")
        print("  - Sentence transformers (pip install sentence-transformers)")
        print("\nAlternativamente, usa il backend RAG completo con:")
        print("  - Endpoint POST /api/rag/ingest")
        print("  - Oppure controlla se esiste un altro script di ingestion\n")
        return False

    print("="*60)
    print("🔄 Knowledge Base Ingestion")
    print("="*60)
    print("Starting KB ingestion process...\n")

    # Check kb/ directory
    kb_dir = Path(__file__).parent.parent / "kb"
    if not kb_dir.exists():
        print(f"❌ Directory KB non trovata: {kb_dir}")
        print(f"\nCrea la directory e aggiungi file .txt:")
        print(f"  mkdir -p {kb_dir}")
        print(f"  # Copia i tuoi .txt nella directory")
        print(f"  python scripts/fix_pdf_encoding.py  # Genera .txt da PDF")
        return False

    txt_files = list(kb_dir.glob("*.txt"))
    if not txt_files:
        print(f"❌ Nessun file .txt trovato in {kb_dir}")
        print(f"\nGenera file .txt dai PDF:")
        print(f"  python scripts/fix_pdf_encoding.py")
        return False

    print(f"📁 Trovati {len(txt_files)} file .txt in kb/")
    print(f"Directory: {kb_dir}\n")

    # Confirm deletion of existing ChromaDB
    chroma_dir = Path(__file__).parent.parent / "chroma_db"
    if chroma_dir.exists():
        print("⚠️  ChromaDB esistente trovato!")
        print(f"   {chroma_dir}")
        print("\n🗑️  Questo processo CANCELLERÀ il database esistente.")
        response = input("\n   Continuare? [y/N]: ").strip().lower()
        if response not in ['y', 'yes']:
            print("\n❌ Operazione annullata.")
            return False
        print()

    try:
        # Run ingestion
        print("🚀 Avvio ingestion...\n")
        result = ingest_documents()

        print("\n" + "="*60)
        print("✅ INGESTION COMPLETE!")
        print("="*60)

        if result:
            print(f"📊 Risultati: {result}")

        print("\n📋 PROSSIMI STEP:")
        print("1. Riavvia il backend:")
        print("   uvicorn app.main:app --reload --port 8000")
        print("\n2. Testa le risposte:")
        print("   curl -X POST http://127.0.0.1:8000/bali-zero/chat \\")
        print("     -H 'Content-Type: application/json' \\")
        print("     -d '{\"query\": \"What is PT PMA?\", \"user_role\": \"member\"}'")
        print("\n3. Verifica qualità:")
        print("   - Nessun carattere corrotto")
        print("   - Risposte contestuali dai documenti")
        print("   - Citazioni leggibili\n")

        return True

    except Exception as e:
        print(f"\n❌ ERRORE durante ingestion: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    try:
        success = run_ingestion()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Operazione interrotta dall'utente.")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ ERRORE FATALE: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)