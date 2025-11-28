#!/usr/bin/env python3
"""
50 Domande Reali a Zantara AI - Test Conversazione Intelligente
"""

import requests
import json
import time
import random
from datetime import datetime

def ask_zantara_question(question, context=""):
    """Invia una domanda a Zantara e restituisce la risposta"""

    base_url = "https://nuzantara-rag.fly.dev"
    api_key = "zantara-secret-2024"

    headers = {
        "Content-Type": "application/json",
        "X-API-Key": api_key
    }

    try:
        # Invia la richiesta di streaming
        response = requests.get(
            f"{base_url}/bali-zero/chat-stream",
            headers=headers,
            params={
                "query": question,
                "user_email": "test-user@nuzantara.ai",
                "user_role": "tester"
            },
            timeout=30
        )

        if response.status_code != 200:
            return f"❌ Errore {response.status_code}: {response.text}"

        # Processa il streaming response
        full_response = ""
        metadata = {}

        for line in response.iter_lines():
            if line:
                line = line.decode('utf-8').strip()
                if line.startswith('data: '):
                    try:
                        data = json.loads(line[6:])  # Rimuovi 'data: '

                        if data.get("type") == "metadata":
                            metadata = data.get("data", {})
                        elif data.get("type") == "token":
                            token = data.get("data", "")
                            # Rimuove i metadata dai token
                            if token.startswith("[METADATA]"):
                                continue
                            elif token == "[METADATA]":
                                continue
                            else:
                                full_response += token
                        elif data.get("type") == "done":
                            break

                    except json.JSONDecodeError:
                        continue

        return full_response.strip() or "Nessuna risposta ricevuta"

    except Exception as e:
        return f"❌ Errore di connessione: {str(e)}"

def test_50_domande_zantara():
    """Testa 50 domande reali a Zantara AI"""

    print("🎯 ZANTARA AI - 50 DOMANDE INTELLIGENTI")
    print("=" * 80)
    print(f"📅 Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"🤖 Target: Zantara AI Assistant")
    print("=" * 80)

    # 50 Domande diverse per Zantara
    domande = [
        # Categoria: Domande Generali e Presentazione
        ("Ciao chi sei e cosa sai fare?", "Saluto e presentazione"),
        ("Qual è la tua missione principale?", "Scopo e obiettivi"),
        ("Puoi spiegarmi cosa significa Zantara?", "Significato nome"),
        ("Quanti anni ha Zantara e quando è nata?", "Storia e evoluzione"),
        ("Quali sono i tuoi valori fondamentali?", "Valori e principi"),

        # Categoria: Tecnologia e Architettura
        ("Come funziona la tua architettura tecnologica?", "Sistema tecnico"),
        ("Che cos'è l'RAG e perché è importante per te?", "Tecnologia RAG"),
        ("Come usi il database vettoriale Qdrant?", "Database vettoriale"),
        ("Quali modelli AI supporti attualmente?", "Modelli AI"),
        ("Come funziona il sistema di embeddings?", "Embeddings"),

        # Categoria: Capacità e Funzionalità
        ("Puoi fare analisi testuale complessa?", "Analisi testuale"),
        ("Che tipo di previsioni puoi fare?", "Previsioni"),
        ("Come gestisci la sintesi di documenti lunghi?", "Sintesi documenti"),
        ("Puoi tradurre tra diverse lingue?", "Traduzione"),
        ("Come riconosci le entità nei testi?", "Riconoscimento entità"),

        # Categoria: Business e Applicazioni
        ("Come puoi aiutare un'azienda moderna?", "Business value"),
        ("Quali sono i casi d'uso principali per te?", "Casi d'uso"),
        ("Come migliorerebbe la produttività aziendale?", "Produttività"),
        ("Puoi aiutare nell'analisi di mercato?", "Analisi mercato"),
        ("Come supporti la customer experience?", "Customer experience"),

        # Categoria: Dati e Conoscenza
        ("Da dove impari e come aggiorni le tue conoscenze?", "Apprendimento"),
        ("Come gestisci l'integrazione con Google Drive?", "Integrazione Drive"),
        ("Che tipo di dati processi?", "Tipi di dati"),
        ("Come assicuri la qualità delle informazioni?", "Qualità dati"),
        ("Puoi lavorare con documenti PDF complessi?", "PDF processing"),

        # Categoria: Sicurezza e Privato
        ("Come proteggi la privacy degli utenti?", "Privacy"),
        ("Che misure di sicurezza hai implementate?", "Sicurezza"),
        ("Come gestisci i dati sensibili?", "Dati sensibili"),
        ("Chi può accedere alle informazioni elaborate?", "Accesso dati"),
        ("Hai certificazioni di sicurezza?", "Certificazioni"),

        # Categoria: Futuro e Sviluppo
        ("Quali sono i tuoi prossimi sviluppi?", "Sviluppi futuri"),
        ("Come evolverai nei prossimi 5 anni?", "Evoluzione"),
        ("Integrai nuove fonti di dati?", "Nuove fonti"),
        ("Potrai supportare più lingue?", "Lingue"),
        ("Come migliorerai le tue capacità predittive?", "Miglioramenti"),

        # Categoria: Problemi e Soluzioni
        ("Quali problemi risolvi per gli utenti?", "Problemi risolti"),
        ("Come gestisci le richieste complesse?", "Richieste complesse"),
        ("Cosa succede se non conosci una risposta?", "Ignoranza"),
        ("Come gestisci le contraddizioni?", "Contraddizioni"),
        ("Puoi imparare dai tuoi errori?", "Apprendimento da errori"),

        # Categoria: Interazione e Personalità
        ("Hai una personalità definita?", "Personalità"),
        ("Come ti adatti a diversi tipi di utenti?", "Adattamento"),
        ("Che tono di comunicazione usi?", "Tono di comunicazione"),
        ("Puoi essere formale o informale a scelta?", "Formalità"),
        ("Come gestisci le emozioni degli utenti?", "Gestione emozioni"),

        # Categoria: Performance e Scalabilità
        ("Quanto veloce è la tua elaborazione?", "Velocità elaborazione"),
        ("Quante richieste gestisci contemporaneamente?", "Concorrenza"),
        ("Come gestisci i picchi di traffico?", "Picchi di traffico"),
        ("Qual è il tuo tempo di risposta medio?", "Tempo risposta"),
        ("Come gestisci l'affidabilità del sistema?", "Affidabilità"),

        # Categoria: Integrazione e API
        ("Come si integra Zantara nei sistemi esistenti?", "Integrazione sistemi"),
        ("Quali API metti a disposizione?", "API disponibili"),
        ("Puoi lavorare con i sistemi CRM?", "CRM integration"),
        ("Come si configurano le connessioni?", "Configurazione"),
        ("Supporti webhooks e notifiche?", "Webhook"),

        # Categoria: Economico e Valore
        ("Qual è il tuo modello di business?", "Modello business"),
        ("Come dimostri il ROI per i clienti?", "ROI"),
        ("Quali sono i costi di implementazione?", "Costi implementazione"),
        ("Puoi ridurre i costi operativi?", "Riduzione costi"),
        ("Come misuri il tuo successo?", "Metriche successo"),

        # Categoria: Competizione e Mercato
        ("Chi sono i tuoi concorrenti principali?", "Concorrenza"),
        ("Qual è il tuo vantaggio competitivo?", "Vantaggio competitivo"),
        ("Come ti differenzi dalle altre AI?", "Differenziazione"),
        ("Qual è il tuo posizionamento di mercato?", "Posizionamento"),
        ("Come evolverai il mercato dell'AI?", "Impatto mercato"),

        # Categoria: Innovazione e Ricerca
        ("Stai usando le ultime tecnologie AI?", "Tecnologie all'avanguardia"),
        ("Quali sono le innovazioni più interessanti?", "Innovazioni"),
        ("Collabori con centri di ricerca?", "Ricerca"),
        ("Come rimani aggiornato sulle novità?", "Aggiornamento"),
        ("Qual è il futuro dell'AI secondo te?", "Visione futuro AI"),

        # Categoria: Utenti Esperienza
        ("Qual è l'esperienza tipica dell'utente?", "User experience"),
        ("Come rendi l'interazione intuitiva?", "Intuitività"),
        ("Hai un'interfaccia grafica?", "Interfaccia"),
        ("Come gestisci gli utenti non tecnici?", "Utenti non tecnici"),
        ("Quali feedback ricevi dagli utenti?", "Feedback utenti"),

        # Categoria: Impatto Sociale
        ("Qual è il tuo impatto sociale positivo?", "Impatto sociale"),
        ("Come promuovi l'etica nell'AI?", "Etica AI"),
        ("Puoi aiutare nella formazione?", "Formazione"),
        ("Come riduci il bias nell'AI?", "Bias reduction"),
        ("Quali valori etici segui?", "Valori etici"),

        # Categoria: Operazioni e Supporto
        ("Come si fornisce supporto tecnico?", "Supporto tecnico"),
        ("Quali sono i tempi di uptime?", "Uptime"),
        ("Come gestisci i problemi tecnici?", "Gestione problemi"),
        ("Hai un sistema di monitoraggio?", "Monitoraggio"),
        ("Quali metriche monitori?", "Metriche operative"),

        # Categoria: Legale e Compliance
        ("Quali normative segui?", "Compliance"),
        ("Hai certificazioni GDPR?", "GDPR"),
        ("Come gestisci i dati degli utenti?", "Gestione dati utenti"),
        ("Quali sono i termini di servizio?", "Termini servizio"),
        ("Come gestisci le richieste di cancellazione?", "Cancellazione dati"),

        # Categoria: Scalabilità e Future Espansioni
        ("Come scalerai a livello globale?", "Scalabilità globale"),
        ("Potrai supportare nuovi settori?", "Nuovi settori"),
        ("Come gestirai l'internazionalizzazione?", "Internazionalizzazione"),
        ("Quali sono i tuoi piani di espansione?", "Espansione"),
        ("Come gestirai la crescita degli utenti?", "Gestione crescita"),

        # Categoria: Partnership e Collaborazione
        ("Cerchi partnership strategiche?", "Partnership"),
        ("Come collabori con altre aziende?", "Collaborazione"),
        ("Puoi integrarti con piattaforme esistenti?", "Integrazione piattaforme"),
        ("Hai programmi per sviluppatori?", "Programma sviluppatori"),
        ("Come costruisci l'ecosistema?", "Ecosistema"),

        # Categoria: Misurazione Successo
        ("Come misuri il successo degli utenti?", "Successo utenti"),
        ("Quali KPI monitori?", "KPI"),
        ("Come valuti l'impatto business?", "Impatto business"),
        ("Quali sono i casi di successo?", "Casi successo"),
        ("Come ottimizzi le performance?", "Ottimizzazione"),

        # Categoria: Sostenibilità
        ("Qual è il tuo impatto ambientale?", "Impatto ambientale"),
        ("Usi tecnologie green?", "Tecnologie green"),
        ("Come riduci il consumo energetico?", "Consumo energetico"),
        ("Hai obiettivi di sostenibilità?", "Sostenibilità"),
        ("Come contribuirai a un futuro migliore?", "Futuro sostenibile"),

        # Categoria: Conclusione e Visione
        ("Qual è la tua visione finale per l'umanità?", "Visione umanità"),
        ("Come cambi il mondo dell'AI?", "Cambio AI"),
        ("Qual è il tuo scopo supremo?", "Scopo supremo"),
        ("Come immaginiamo il futuro insieme?", "Futuro insieme"),
        ("Qual è il tuo messaggio finale per noi?", "Messaggio finale")
    ]

    print(f"\n🧪 Inizio test di {len(domande)} domande a Zantara...")
    print("=" * 80)

    results = []
    success_count = 0
    error_count = 0

    for i, (question, category) in enumerate(domande, 1):
        print(f"\n📋 {i:2d}/{len(domande)} [{category}]")
        print(f"❓ Q: {question}")

        # Timer per la risposta
        start_time = time.time()

        # Richiedi a Zantara
        response = ask_zantara_question(question)
        elapsed_time = time.time() - start_time

        print(f"⏱️  Tempo: {elapsed_time:.2f}s")

        # Valuta la risposta
        if response and not response.startswith("❌"):
            if len(response) > 10:  # Risposta significativa
                status = "✅ SUCCESS"
                success_count += 1
                print(f"✅ R: {response[:200]}{'...' if len(response) > 200 else ''}")
            else:
                status = "⚠️  SHORT"
                error_count += 1
                print(f"⚠️  R: {response}")
        else:
            status = "❌ ERROR"
            error_count += 1
            print(f"❌ R: {response}")

        results.append({
            "question": question,
            "category": category,
            "response": response,
            "time": elapsed_time,
            "success": not response.startswith("❌")
        })

        # Breve pausa per non sovraccaricare
        time.sleep(1)

    # Analisi dei risultati
    print("\n" + "=" * 80)
    print("🎉 ZANTARA 50 DOMANDE - ANALISI FINALE")
    print("=" * 80)

    print(f"\n📊 Statistiche Generali:")
    print(f"   • Domande totali: {len(domande)}")
    print(f"   • Risposte ricevute: {success_count} ({(success_count/len(domande)*100):.1f}%)")
    print(f"   • Errori: {error_count} ({(error_count/len(domande)*100):.1f}%)")

    # Per categoria
    categories = {}
    for result in results:
        category = result["category"]
        if category not in categories:
            categories[category] = {"success": 0, "total": 0}
        categories[category]["total"] += 1
        if result["success"]:
            categories[category]["success"] += 1

    print(f"\n📁 Performance per Categoria:")
    for category, stats in categories.items():
        rate = (stats["success"]/stats["total"])*100
        print(f"   • {category}: {stats['success']}/{stats['total']} ({rate:.1f}%)")

    # Tempi medi
    response_times = [r["time"] for r in results if r["success"]]
    if response_times:
        avg_time = sum(response_times) / len(response_times)
        print(f"\n⏰ Performance Tempo:")
        print(f"   • Tempo medio risposta: {avg_time:.2f}s")
        print(f"   • Tempo più veloce: {min(response_times):.2f}s")
        print(f"   • Tempo più lento: {max(response_times):.2f}s")

    # Risposte migliori
    good_responses = [r for r in results if r["success"] and len(r["response"]) > 50]
    if good_responses:
        print(f"\n🏆 Migliori Risposte Ricevute:")
        for i, result in enumerate(good_responses[:5], 1):
            print(f"   {i}. [{result['category']}] {result['response'][:150]}...")

    # Valutazione finale
    success_rate = (success_count / len(domande)) * 100
    print(f"\n🎯 VALUTAZIONE FINALE ZANTARA AI:")

    if success_rate >= 80:
        grade = "A+"
        status = "🏆 ECCELLENZA - Zantara è molto reattiva e intelligente"
    elif success_rate >= 60:
        grade = "B"
        status = "✅ BUONA - Zantara risponde correttamente ma migliorabile"
    elif success_rate >= 40:
        grade = "C"
        status = "⚠️  SUFFICIENTE - Zantara ha difficoltà di connessione"
    else:
        grade = "D"
        status = "❌ INSUFFICIENTE - Problemi significativi"

    print(f"   • Voto: {grade}")
    print(f"   • Tasso di successo: {success_rate:.1f}%")
    print(f"   • Stato: {status}")

    # Salva risultati
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    with open(f"/Users/antonellosiano/Desktop/nuzantara/ZANTARA_50_DOMANDE_RESULTS_{timestamp}.json", "w") as f:
        json.dump({
            "timestamp": timestamp,
            "total_questions": len(domande),
            "success_count": success_count,
            "error_count": error_count,
            "success_rate": success_rate,
            "categories": categories,
            "average_time": avg_time if response_times else 0,
            "results": results
        }, f, indent=2)

    print(f"\n💾 Risultati salvati in: ZANTARA_50_DOMANDE_RESULTS_{timestamp}.json")

    return success_rate, results

if __name__ == "__main__":
    test_50_domande_zantara()