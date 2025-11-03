#!/usr/bin/env python3
"""
PP 28/2025 Interactive Law Viewer
Explore the processed law data with search and filters
"""

import json
from pathlib import Path
from typing import List, Dict

KB_DIR = Path("/Users/antonellosiano/Desktop/NUZANTARA-FLY/oracle-data/PP_28_2025/kb_ready")

def load_data():
    """Load all processed data"""
    with open(KB_DIR / "chunks_articles.json", 'r', encoding='utf-8') as f:
        chunks = json.load(f)
    
    with open(KB_DIR / "obligations_matrix.json", 'r', encoding='utf-8') as f:
        obligations = json.load(f)
    
    return chunks, obligations

def search_pasal(chunks: List[Dict], query: str) -> List[Dict]:
    """Search for Pasal by number or content"""
    results = []
    
    # Search by pasal number
    if query.isdigit():
        results = [c for c in chunks if c['pasal'] == query]
    else:
        # Search in text content
        query_lower = query.lower()
        results = [c for c in chunks if query_lower in c['text'].lower()]
    
    return results

def show_pasal(chunk: Dict):
    """Display a single Pasal with formatting"""
    print("\n" + "="*80)
    print(f"📜 PASAL {chunk['pasal']}")
    print("="*80)
    print(f"\n{chunk['text']}\n")
    
    if chunk['signals']:
        print("🎯 SIGNALS:")
        for key, value in chunk['signals'].items():
            print(f"   • {key}: {value}")
    
    print(f"\n📊 Ayat count: {chunk['ayat_count']}")
    print(f"🆔 Chunk ID: {chunk['chunk_id']}")
    print("="*80)

def show_obligations_by_type(obligations: List[Dict]):
    """Show obligations grouped by type"""
    by_type = {}
    for ob in obligations:
        type_key = ob['type']
        if type_key not in by_type:
            by_type[type_key] = []
        by_type[type_key].append(ob)
    
    print("\n" + "="*80)
    print("⚖️  OBLIGATIONS BY TYPE")
    print("="*80)
    
    for type_key, obs in by_type.items():
        print(f"\n📌 {type_key.upper()} ({len(obs)} obligations)")
        for ob in obs[:3]:  # Show first 3
            print(f"   • {ob['pasal']}: {ob['content'][:100]}...")
        if len(obs) > 3:
            print(f"   ... and {len(obs)-3} more")

def show_kbli_requirements(chunks: List[Dict]):
    """Show all Pasal related to KBLI"""
    print("\n" + "="*80)
    print("📋 KBLI REQUIREMENTS")
    print("="*80)
    
    kbli_chunks = [c for c in chunks if 'kbli' in c['text'].lower()]
    
    print(f"\nFound {len(kbli_chunks)} Pasal mentioning KBLI\n")
    
    # Show critical ones
    critical = [c for c in kbli_chunks if c.get('signals', {}).get('kbli_required')]
    
    if critical:
        print("🔴 CRITICAL REQUIREMENTS:")
        for c in critical:
            print(f"   • Pasal {c['pasal']}: {c['text'][:150]}...")
            if c['signals']:
                print(f"     Signals: {c['signals']}")

def show_system_integration(obligations: List[Dict]):
    """Show system integrations (OSS, Imigrasi, etc.)"""
    print("\n" + "="*80)
    print("🔗 SYSTEM INTEGRATIONS")
    print("="*80)
    
    by_system = {}
    for ob in obligations:
        for system in ob.get('systems', []):
            if system not in by_system:
                by_system[system] = []
            by_system[system].append(ob)
    
    for system, obs in sorted(by_system.items()):
        print(f"\n🖥️  {system} ({len(obs)} mentions)")
        for ob in obs[:2]:
            print(f"   • {ob['pasal']}: {ob['content'][:80]}...")

def show_stats(chunks: List[Dict], obligations: List[Dict]):
    """Show overall statistics"""
    print("\n" + "="*80)
    print("📊 PP 28/2025 STATISTICS")
    print("="*80)
    
    print(f"\n📜 Total Pasal: {len(chunks)}")
    print(f"⚖️  Total Obligations: {len(obligations)}")
    
    # Ayat distribution
    total_ayats = sum(c['ayat_count'] for c in chunks)
    avg_ayats = total_ayats / len(chunks) if chunks else 0
    print(f"📝 Total Ayats: {total_ayats}")
    print(f"📈 Average Ayats per Pasal: {avg_ayats:.2f}")
    
    # Signals analysis
    with_signals = len([c for c in chunks if c.get('signals')])
    print(f"🎯 Pasal with signals: {with_signals}")
    
    # KBLI mentions
    kbli_mentions = len([c for c in chunks if 'kbli' in c['text'].lower()])
    print(f"📋 KBLI mentions: {kbli_mentions}")
    
    # System mentions
    systems_count = {}
    for ob in obligations:
        for sys in ob.get('systems', []):
            systems_count[sys] = systems_count.get(sys, 0) + 1
    
    if systems_count:
        print(f"\n🖥️  System Integration Points:")
        for sys, count in sorted(systems_count.items(), key=lambda x: -x[1]):
            print(f"   • {sys}: {count}")

def interactive_search(chunks: List[Dict], obligations: List[Dict]):
    """Interactive search interface"""
    print("\n" + "="*80)
    print("🔍 PP 28/2025 INTERACTIVE SEARCH")
    print("="*80)
    print("\nCommands:")
    print("  • pasal <number>  - View specific Pasal")
    print("  • search <term>   - Search in content")
    print("  • kbli            - Show KBLI requirements")
    print("  • obligations     - Show obligations by type")
    print("  • systems         - Show system integrations")
    print("  • stats           - Show statistics")
    print("  • quit            - Exit")
    
    while True:
        try:
            cmd = input("\n> ").strip().lower()
            
            if cmd == 'quit':
                break
            elif cmd == 'stats':
                show_stats(chunks, obligations)
            elif cmd == 'kbli':
                show_kbli_requirements(chunks)
            elif cmd == 'obligations':
                show_obligations_by_type(obligations)
            elif cmd == 'systems':
                show_system_integration(obligations)
            elif cmd.startswith('pasal '):
                num = cmd.split()[1]
                results = search_pasal(chunks, num)
                if results:
                    show_pasal(results[0])
                else:
                    print(f"❌ Pasal {num} not found")
            elif cmd.startswith('search '):
                term = cmd[7:]
                results = search_pasal(chunks, term)
                print(f"\n✅ Found {len(results)} results")
                for r in results[:5]:
                    print(f"\n• Pasal {r['pasal']}: {r['text'][:100]}...")
                if len(results) > 5:
                    print(f"\n... and {len(results)-5} more results")
            else:
                print("❌ Unknown command. Type 'quit' to exit.")
                
        except KeyboardInterrupt:
            print("\n\n👋 Bye!")
            break
        except Exception as e:
            print(f"❌ Error: {e}")

def main():
    """Main entry point"""
    print("=" * 80)
    print("PP 28/2025 LAW VIEWER")
    print("=" * 80)
    
    print("\n⏳ Loading data...")
    chunks, obligations = load_data()
    print(f"✅ Loaded {len(chunks)} Pasal and {len(obligations)} obligations")
    
    # Show quick stats
    show_stats(chunks, obligations)
    
    # Start interactive search
    interactive_search(chunks, obligations)

if __name__ == "__main__":
    main()
