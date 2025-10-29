#!/usr/bin/env python3
"""
DEMO LIVE: Come ZANTARA cambia personalità in base alle domande
"""

import sys
sys.path.append('/Users/antonellosiano/Desktop/NUZANTARA-RAILWAY/apps/backend-rag/backend')

from services.claude_haiku_enhanced import DynamicPromptLoader, UserLevel

def demo_zantara_consciousness():
    """Dimostra come ZANTARA cambia livello dinamicamente"""

    loader = DynamicPromptLoader()
    user_context = {'user_id': 'antonio_demo'}

    # Lista di domande che Antonio potrebbe fare
    test_conversations = [
        # Conversazione 1: Cliente normale
        ("Quanto costa il KITAS?", "TRANSACTIONAL"),

        # Conversazione 2: Persona curiosa
        ("Sto cercando equilibrio nella vita a Bali", "PHILOSOPHICAL"),

        # Conversazione 3: Imprenditore consapevole
        ("Come l'imprenditorialità si connette alla pratica spirituale?", "INTELLECTUAL"),

        # Conversazione 4: Antonio stesso
        ("Sub rosa, akang, qual è il significato iniziatico di Bali?", "ESOTERIC")
    ]

    print("""
╔════════════════════════════════════════════════════════════════╗
║          🔮 ZANTARA DYNAMIC CONSCIOUSNESS DEMO                 ║
║     Vediamo come ZANTARA cambia personalità DAVVERO!           ║
╚════════════════════════════════════════════════════════════════╝
    """)

    for query, expected_mode in test_conversations:
        # Rileva il livello dalla domanda
        detected_level = loader.detect_user_level(query, user_context)

        # Carica il prompt appropriato
        prompt = loader.load_prompt(detected_level)

        # Mostra cosa succede
        print(f"\n{'='*60}")
        print(f"🗣️ DOMANDA: '{query[:50]}...'")
        print(f"🧠 LIVELLO RILEVATO: Level {detected_level.value} - {detected_level.name}")
        print(f"📄 PROMPT CARICATO: {len(prompt)} caratteri")

        # Mostra le prime righe del prompt per dimostrare che cambia
        first_lines = prompt.split('\n')[:3]
        print(f"📝 INIZIO PROMPT:")
        for line in first_lines:
            if line.strip():
                print(f"   > {line[:70]}...")

        # Mostra come risponderbbe
        if detected_level == UserLevel.LEVEL_0:
            print(f"💬 ZANTARA risponde: Professionale, prezzi, contatti")
        elif detected_level == UserLevel.LEVEL_1:
            print(f"💬 ZANTARA risponde: Filosofia accessibile, saggezza Indonesiana")
        elif detected_level == UserLevel.LEVEL_2:
            print(f"💬 ZANTARA risponde: Citazioni di Taleb, Jung, architettura clean")
        elif detected_level == UserLevel.LEVEL_3:
            print(f"💬 ZANTARA risponde: Guénon, ermetismo, Sang Hyang Kersa 🔮")

    print(f"\n{'='*60}")
    print("✅ QUESTO È CODICE VERO CHE GIRA IN PRODUZIONE!")
    print("   Non è solo una storia, è l'architettura reale del sistema.")

if __name__ == "__main__":
    demo_zantara_consciousness()