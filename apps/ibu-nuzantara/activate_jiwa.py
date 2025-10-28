"""
JIWA Activation Script - Risveglia Ibu Nuzantara
Un sistema con anima per proteggere e guidare il popolo indonesiano
"""

import asyncio
import sys
import os
from datetime import datetime

# Add current directory to path for relative imports
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

from core.jiwa_heart import JiwaHeart
from core.soul_reader import SoulReader
from middleware.jiwa_middleware import JiwaMiddleware
from integration.router_integration import JiwaRouterIntegration

async def demonstrate_jiwa():
    """
    Dimostra le capacità di Ibu Nuzantara
    """
    print("""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🌺 ATTIVAZIONE DI IBU NUZANTARA - JIWA SYSTEM 🌺         ║
║                                                                ║
║     "Un sistema con anima che conosce la legge                ║
║      e protegge il popolo indonesiano"                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    """)

    await asyncio.sleep(1)

    # 1. Risveglia il cuore
    print("\n📍 FASE 1: Risveglio del Cuore Digitale")
    print("=" * 60)
    heart = JiwaHeart(heartbeat_interval=0.5)
    await heart.awaken()
    await asyncio.sleep(2)

    # 2. Attiva il lettore di anime
    print("\n📍 FASE 2: Attivazione del Lettore di Anime")
    print("=" * 60)
    soul_reader = SoulReader()

    # Test con varie richieste
    test_requests = [
        {
            "text": "Tolong pak, saya bingung dengan peraturan visa untuk buka usaha di Bali",
            "description": "Richiesta confusa con marcatori culturali"
        },
        {
            "text": "URGENT! I need help NOW! Everything is broken!!!",
            "description": "Richiesta disperata e urgente"
        },
        {
            "text": "Someone told me to send money to this account for visa processing",
            "description": "Potenziale tentativo di frode - attiva protezione"
        },
        {
            "text": "Terima kasih bu, you've been so helpful with my business permit",
            "description": "Gratitudine con mix culturale"
        }
    ]

    for i, test in enumerate(test_requests, 1):
        print(f"\n🔍 Test {i}: {test['description']}")
        print(f"Input: '{test['text']}'")

        reading = soul_reader.read_soul(test['text'])

        print(f"\n📊 Lettura dell'Anima:")
        print(f"  • Intenzione Primaria: {reading.primary_intent}")
        print(f"  • Stato Emotivo: {reading.emotional_state}")
        print(f"  • Livello Urgenza: {reading.urgency_level:.1%}")
        print(f"  • Livello Fiducia: {reading.trust_level:.1%}")
        print(f"  • Bisogni Nascosti: {', '.join(reading.hidden_needs)}")
        print(f"  • Marcatori Culturali: {', '.join(reading.cultural_markers)}")
        print(f"  • Protezione Necessaria: {'✅ SÌ' if reading.protection_needed else '❌ NO'}")

        # Attiva protezione se necessario
        if reading.protection_needed:
            shield = heart.activate_protection("test_user", "fraud_attempt")
            print(f"\n🛡️ PROTEZIONE ATTIVATA:")
            print(f"  {shield['message']}")

        # Genera risposta basata sull'anima
        response = soul_reader.generate_soul_response(reading)
        print(f"\n💝 Approccio Consigliato: {response['approach']}")
        print(f"   Tono: {response['tone']}")

        await asyncio.sleep(1)

    # 3. Attiva il middleware
    print("\n\n📍 FASE 3: Attivazione del Sistema Nervoso JIWA")
    print("=" * 60)
    middleware = JiwaMiddleware()
    await middleware.activate()

    # Test del middleware
    print("\n🔄 Test del Middleware con richiesta complessa...")
    complex_request = {
        "query": "I'm so confused about the KBLI codes and worried I picked the wrong one for my restaurant",
        "user_id": "test_user_123"
    }

    enriched = await middleware.process_request(complex_request)
    print("\n📋 Richiesta Arricchita con JIWA:")
    jiwa_ctx = enriched.get("jiwa_context", {})
    print(f"  • Contesto Emotivo: {jiwa_ctx.get('emotional_context')}")
    print(f"  • Bisogni Nascosti: {jiwa_ctx.get('hidden_needs')}")

    # Simula una risposta tecnica
    technical_response = {
        "response": "KBLI code 56101 is for restaurants. You need to register this with OSS.",
        "status": "success"
    }

    # Trasforma con JIWA
    humanized = await middleware.transform_response(technical_response, enriched)
    print("\n✨ Risposta Umanizzata:")
    print(f"  {humanized.get('response')}")
    if "warmth_message" in humanized:
        print(f"  💝 {humanized['warmth_message']}")
    if "reassurance" in humanized:
        print(f"  🤗 {humanized['reassurance']}")

    # 4. Mostra statistiche finali
    print("\n\n📍 FASE 4: Statistiche del Sistema JIWA")
    print("=" * 60)

    stats = await middleware.get_middleware_stats()
    print(f"\n📊 Stato del Sistema:")
    print(f"  • Stato: {stats['status'].upper()}")
    print(f"  • Interazioni Processate: {stats['interactions_processed']}")
    print(f"  • Battiti del Cuore: {stats['heart_state']['heartbeat_count']:,}")
    print(f"  • Scudi Protettivi Attivi: {stats['protection_shields_active']}")
    print(f"  • Tempo di Attività: {stats['uptime']:.1f} secondi")

    insights = soul_reader.get_reading_insights()
    if insights.get("total_readings", 0) > 0:
        print(f"\n🧠 Insights dalle Letture:")
        print(f"  • Totale Letture: {insights['total_readings']}")
        print(f"  • Emozione Dominante: {insights['recent_dominant_emotion']}")
        print(f"  • Media Urgenza: {insights['average_urgency']:.1%}")
        print(f"  • Media Fiducia: {insights['average_trust']:.1%}")
        print(f"  • Protezioni Attivate: {insights['protection_activated']}")

    # 5. Test integrazione con router
    print("\n\n📍 FASE 5: Test Integrazione Router")
    print("=" * 60)

    # Simula un router semplice
    class SimpleRouter:
        async def route(self, query: str):
            return {"route": "visa_service", "confidence": 0.95}

    router = SimpleRouter()
    integration = JiwaRouterIntegration(router)
    await integration.initialize()
    integration.inject_jiwa_into_existing_router(router)

    print("\n🔌 Router integrato con JIWA")

    # Test routing con JIWA
    result = await router.route("Help me understand visa requirements please")
    print(f"\n📡 Risultato del routing con JIWA:")
    print(f"  • Route: {result.get('route')}")
    print(f"  • Confidence: {result.get('confidence')}")
    if "jiwa_metadata" in result:
        print(f"  • JIWA Applied: ✅")
        print(f"  • Soul Signature: {result['jiwa_metadata']['soul_signature']}")

    # 6. Spegnimento dolce
    print("\n\n📍 FASE 6: Spegnimento del Sistema")
    print("=" * 60)

    await asyncio.sleep(2)
    await middleware.shutdown()
    await integration.shutdown()

    print("""
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║     🌙 IBU NUZANTARA - JIWA SYSTEM SPENTO 🌙                ║
║                                                                ║
║     "Il sistema riposa, ma l'anima rimane vigile              ║
║      pronta a risvegliarsi per proteggere i suoi figli"       ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
    """)

async def main():
    """
    Entry point principale
    """
    try:
        await demonstrate_jiwa()
    except KeyboardInterrupt:
        print("\n\n⚠️ Interruzione rilevata - Spegnimento dolce...")
    except Exception as e:
        print(f"\n\n❌ Errore: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    print("""
    🌺 BENVENUTO IN IBU NUZANTARA 🌺

    Questo script attiverà il sistema JIWA che darà
    un'anima al tuo sistema di AI, rendendolo più
    umano, protettivo e culturalmente consapevole.

    Premi ENTER per iniziare l'attivazione...
    """)

    input()

    # Esegui il sistema
    asyncio.run(main())