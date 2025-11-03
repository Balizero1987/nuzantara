#!/usr/bin/env python3
"""
Test PP28/2025 Knowledge in Local ChromaDB
Runs 15 test questions and reports results
"""

import chromadb
from pathlib import Path
import time

# Config
CHROMADB_PATH = Path(__file__).parent.parent / "data" / "chromadb"
COLLECTION = "legal_intelligence"

QUESTIONS = [
    "Cosa dice PP 28/2025 sul requisito KBLI a 5 cifre per l'OSS?",
    "Quali sono le categorie di rischio nel sistema PBBR secondo PP 28/2025?",
    "Come funziona l'integrazione del sistema OSS con i ministeri secondo PP 28/2025?",
    "Qual è il flusso per l'utilizzo di lavoratori stranieri (TKA) in PP 28/2025?",
    "Quali sono i tempi di approvazione (SLA) per le licenze secondo PP 28/2025?",
    "Come si richiede l'approvazione per l'uso di aree forestali in PP 28/2025?",
    "Qual è il ruolo di Administrator KEK e Badan Pengusahaan KPBPB in PP 28/2025?",
    "Cosa dice PP 28/2025 sui requisiti ambientali (UKL-UPL)?",
    "Come viene verificata la location del business secondo PP 28/2025?",
    "Quando inizia il calcolo del tempo per l'approvazione secondo PP 28/2025?",
    "Qual è la differenza tra PB e PB UMKU in PP 28/2025?",
    "Quali business ottengono auto-approval secondo PP 28/2025?",
    "Dove sono definiti i metodi di analisi del rischio in PP 28/2025?",
    "Dove si trova la mappatura tra KBLI, livello di rischio e PB richiesti?",
    "Quando è entrata in vigore PP 28/2025?"
]

def main():
    print("="*70)
    print("🧪 PP 28/2025 Knowledge Test - 15 Questions")
    print("="*70)
    print()
    
    # Connect
    print(f"🔌 ChromaDB: {CHROMADB_PATH}")
    client = chromadb.PersistentClient(path=str(CHROMADB_PATH))
    collection = client.get_collection(name=COLLECTION)
    print(f"✅ Collection: {COLLECTION} ({collection.count()} docs)\n")
    
    # Test questions
    results = []
    
    for i, question in enumerate(QUESTIONS, 1):
        print(f"\n{'─'*70}")
        print(f"[{i}/15] {question[:60]}...")
        print(f"{'─'*70}")
        
        try:
            # Query
            start = time.time()
            response = collection.query(
                query_texts=[question],
                n_results=3
            )
            elapsed = time.time() - start
            
            docs = response['documents'][0] if response['documents'] else []
            
            if docs:
                print(f"✅ Found {len(docs)} results ({elapsed:.2f}s)")
                
                # Show top result preview
                top_doc = docs[0]
                lines = top_doc.split('\n')
                preview = '\n'.join(lines[:8])  # First 8 lines
                
                print(f"\n📄 Top Result:")
                print(f"{preview}")
                if len(lines) > 8:
                    print("   [...]")
                
                results.append({
                    'question': i,
                    'status': '✅',
                    'count': len(docs),
                    'time': elapsed
                })
            else:
                print(f"❌ No results found ({elapsed:.2f}s)")
                results.append({
                    'question': i,
                    'status': '❌',
                    'count': 0,
                    'time': elapsed
                })
                
        except Exception as e:
            print(f"❌ Error: {e}")
            results.append({
                'question': i,
                'status': '❌',
                'count': 0,
                'time': 0,
                'error': str(e)
            })
        
        time.sleep(0.3)  # Prevent overload
    
    # Summary
    print("\n\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    print()
    
    successful = sum(1 for r in results if r['status'] == '✅')
    failed = len(results) - successful
    avg_time = sum(r['time'] for r in results) / len(results)
    
    print(f"Total Questions: {len(results)}")
    print(f"Successful:      {successful} ✅")
    print(f"Failed:          {failed} ❌")
    print(f"Success Rate:    {successful/len(results)*100:.1f}%")
    print(f"Avg Query Time:  {avg_time:.2f}s")
    print()
    
    # Detailed results table
    print("Detailed Results:")
    print("-" * 70)
    print(f"{'Q#':<5} {'Status':<8} {'Results':<10} {'Time':<10}")
    print("-" * 70)
    
    for r in results:
        print(f"{r['question']:<5} {r['status']:<8} {r['count']:<10} {r['time']:.2f}s")
    
    print()
    
    if successful == len(results):
        print("🎉 PERFECT SCORE! PP28/2025 knowledge is fully operational!")
    elif successful >= len(results) * 0.8:
        print("✅ GOOD! Most questions answered correctly.")
    elif successful >= len(results) * 0.5:
        print("⚠️  PARTIAL. Some gaps in PP28/2025 coverage.")
    else:
        print("❌ INSUFFICIENT. PP28/2025 needs better indexing.")
    
    print("\n✅ Test complete!")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n⚠️ Test interrupted")
    except Exception as e:
        print(f"\n\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
