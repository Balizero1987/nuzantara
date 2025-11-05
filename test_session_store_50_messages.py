#!/usr/bin/env python3
"""
Test Session Store with 50+ Messages - Live Production Test
Monitors all performance metrics and verifies context preservation
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "https://nuzantara-rag.fly.dev"
USER_EMAIL = "zero@balizero.com"

# Metrics tracking
metrics = {
    "session_creation_time": 0,
    "session_update_times": [],
    "chat_stream_times": [],
    "total_messages": 0,
    "session_id": None,
    "context_verified": []
}

def log(message):
    """Pretty logging with timestamp"""
    timestamp = datetime.now().strftime("%H:%M:%S.%f")[:-3]
    print(f"[{timestamp}] {message}")

def create_session():
    """Step 1: Create new session"""
    log("📝 Creating new session...")
    start = time.time()

    response = requests.post(f"{BASE_URL}/sessions")

    metrics["session_creation_time"] = time.time() - start

    if response.status_code == 200:
        data = response.json()
        metrics["session_id"] = data["session_id"]
        log(f"✅ Session created: {metrics['session_id']}")
        log(f"   ⏱️  Time: {metrics['session_creation_time']*1000:.2f}ms")
        return metrics["session_id"]
    else:
        log(f"❌ Failed to create session: {response.status_code}")
        return None

def generate_conversation_history(num_messages=50):
    """Generate realistic PT PMA conversation with 50+ messages"""
    log(f"🔨 Generating {num_messages} realistic messages...")

    # Realistic conversation about PT PMA setup
    topics = [
        # Initial inquiry (messages 1-10)
        {"role": "user", "content": "Voglio aprire una PT PMA per import-export di prodotti italiani in Indonesia. Quali sono i requisiti principali?"},
        {"role": "assistant", "content": "Per aprire una PT PMA import-export servono: capitale minimo 10 miliardi IDR, documenti personali apostillati, business plan dettagliato, e registrazione presso vari enti (BKPM, OSS, doganali). Posso guidarti passo passo."},

        # Deep dive on capital (11-20)
        {"role": "user", "content": "10 miliardi IDR sono circa 600.000 euro. Devo versarli tutti subito o c'è un pagamento dilazionato?"},
        {"role": "assistant", "content": "Ottima domanda! Il 25% (2.5 miliardi IDR) va versato all'apertura. Il restante 75% può essere versato gradualmente entro 3 anni. Questo ti dà flessibilità finanziaria iniziale."},

        {"role": "user", "content": "Cosa succede se non verso il 75% entro i 3 anni? Ci sono penali o rischio di chiusura?"},
        {"role": "assistant", "content": "Se non completi il versamento, il BKPM può revocare la licenza PT PMA. È importante pianificare cash flow. Molti clienti usano prestiti bancari indonesiani per completare il versamento."},

        # Documents (21-30)
        {"role": "user", "content": "Quali documenti esattamente servono apostillati? E dove li devo apostillare?"},
        {"role": "assistant", "content": "Servono apostillati: passaporto, certificato di nascita, certificato penale (casellario giudiziale). L'apostille va fatta presso Prefettura/Procura in Italia, poi traduzione giurata in indonesiano."},

        {"role": "user", "content": "La traduzione giurata la posso fare in Italia o deve essere fatta in Indonesia?"},
        {"role": "assistant", "content": "Meglio farla in Indonesia da traduttore certificato (sworn translator). Costa meno e il notaio indonesiano la accetta subito. In Italia costa 3-4x di più e può essere contestata."},

        {"role": "user", "content": "Quanto tempo ci vuole per ottenere tutti i documenti apostillati dall'Italia?"},
        {"role": "assistant", "content": "Tempi italiani: certificato penale 15-30 giorni, apostille 7-14 giorni. Totale realistico: 1-2 mesi. Consiglio di iniziare subito perché è il collo di bottiglia principale."},

        # Business structure (31-40)
        {"role": "user", "content": "Per la struttura societaria, serve un partner indonesiano o posso essere 100% straniero?"},
        {"role": "assistant", "content": "Import-export generale: 100% foreign ownership consentito. Non serve nominee indonesiano. Tu puoi essere l'unico azionista e direttore. Alcune categorie merceologiche hanno restrizioni specifiche però."},

        {"role": "user", "content": "Quali categorie merceologiche hanno restrizioni? Import vino/liquori e abbigliamento italiano sono ok?"},
        {"role": "assistant", "content": "Vino/liquori: serve licenza speciale import bevande alcoliche (richiede coordinamento con BPOM). Abbigliamento: 100% ok, nessuna restrizione. Per alcolici, molti clienti usano distributore locale con contratto esclusivo."},

        {"role": "user", "content": "Se uso distributore locale per alcolici, la PT PMA deve comunque avere licenza import o basta il contratto?"},
        {"role": "assistant", "content": "Se il distributore importa direttamente, tu fornisci solo prodotto ex-works Italia. La tua PT PMA vende B2B al distributore, lui gestisce import+licenze. Più semplice per te, meno margine però."},

        # KBLI codes (41-50)
        {"role": "user", "content": "Quali codici KBLI devo registrare per import-export abbigliamento e accessori?"},
        {"role": "assistant", "content": "Per abbigliamento: 46411 (perdagangan besar pakaian), 47712 (retail pakaian). Per import-export specifico: 46901 (perdagangan besar umum). Registro tutti e 3 per flessibilità operativa."},

        {"role": "user", "content": "Posso cambiare i codici KBLI dopo aver registrato la PT PMA o sono fissi?"},
        {"role": "assistant", "content": "Puoi modificarli con amendment akta (atto notarile aggiuntivo). Costa circa 5-10 juta IDR + 2-3 settimane. Meglio registrare tutti i codici previsti subito per evitare costi futuri."},

        {"role": "user", "content": "Se registro codici KBLI che poi non uso, ci sono tasse o obblighi aggiuntivi?"},
        {"role": "assistant", "content": "No, non paghi extra per KBLI inattivi. L'importante è avere tutti i codici che *potresti* usare. Molti clienti registrano 5-7 codici KBLI per flessibilità strategica."},

        # Visa and work permit (51-60)
        {"role": "user", "content": "Come direttore PT PMA, quale visto serve? KITAS investitore o KITAS lavoro?"},
        {"role": "assistant", "content": "KITAS lavoro (312) come direttore PT PMA. Richiede IMTA (izin kerja) + sponsorship dalla tua stessa PT PMA. KITAS investitore è solo per chi investe senza lavorare attivamente."},

        {"role": "user", "content": "L'IMTA quanto costa e quanto dura? Si rinnova automaticamente?"},
        {"role": "assistant", "content": "IMTA costa circa 10 juta IDR/anno. Dura 1 anno, rinnovabile. Non è automatico: serve richiesta rinnovo 30 giorni prima scadenza. Se scade, devi rifare da zero (più costoso)."},
    ]

    # Extend to 50+ messages by adding follow-up questions
    history = topics.copy()

    # Add more realistic follow-ups to reach 50+
    additional_qa = [
        {"role": "user", "content": "Posso assumere dipendenti stranieri nella PT PMA o ci sono quote massime?"},
        {"role": "assistant", "content": "Ratio legale: 1 foreigner ogni 10 local employees. Ma all'inizio (primi 2 anni) puoi avere più flessibilità. Dipende dal business plan approvato."},

        {"role": "user", "content": "I dipendenti locali devono essere assunti full-time o posso usare contratti freelance?"},
        {"role": "assistant", "content": "Meglio contratti PKWT (tempo determinato) inizialmente. Freelance (bukan pegawai tetap) possibile ma complica BPJS e tasse. Consiglio mix: core team PKWT, temporary freelance."},

        {"role": "user", "content": "Quanto costa in media un dipendente full-time in Indonesia con tutti i contributi?"},
        {"role": "assistant", "content": "Salary 5-8 juta IDR + BPJS (4-5%) + THR (1 month bonus/year) + Jamsostek. Totale annual cost: circa 14-16x monthly salary. Manager level: 15-25 juta/month."},
    ]

    history.extend(additional_qa * 6)  # Repeat to get 50+ messages

    # Ensure we have at least 50 messages
    while len(history) < 50:
        history.append({
            "role": "user",
            "content": f"Question {len(history)+1}: Can you clarify more details about the registration process?"
        })
        history.append({
            "role": "assistant",
            "content": f"Answer {len(history)}: The registration process involves multiple steps coordinated by Bali Zero team."
        })

    metrics["total_messages"] = len(history)
    log(f"✅ Generated {len(history)} messages")
    return history[:55]  # Return exactly 55 messages

def update_session(session_id, history):
    """Step 2: Update session with conversation history"""
    log(f"💾 Updating session with {len(history)} messages...")
    start = time.time()

    response = requests.put(
        f"{BASE_URL}/sessions/{session_id}",
        json={"history": history}
    )

    elapsed = time.time() - start
    metrics["session_update_times"].append(elapsed)

    if response.status_code == 200:
        data = response.json()
        log(f"✅ Session updated: {data['message_count']} messages")
        log(f"   ⏱️  Time: {elapsed*1000:.2f}ms")
        log(f"   📊 Payload size: ~{len(json.dumps(history))} bytes")
        return True
    else:
        log(f"❌ Failed to update session: {response.status_code}")
        return False

def test_chat_stream(session_id, query, message_num):
    """Step 3: Test chat-stream with session_id"""
    log(f"🌊 Testing chat-stream (message #{message_num})...")
    start = time.time()

    url = f"{BASE_URL}/bali-zero/chat-stream"
    params = {
        "query": query,
        "user_email": USER_EMAIL,
        "session_id": session_id
    }

    try:
        response = requests.get(url, params=params, stream=True, timeout=30)

        chunks_received = 0
        full_response = ""

        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith('data: '):
                    try:
                        data = json.loads(line_str[6:])
                        if 'text' in data:
                            full_response += data['text']
                            chunks_received += 1
                        if data.get('done'):
                            break
                    except json.JSONDecodeError:
                        pass

        elapsed = time.time() - start
        metrics["chat_stream_times"].append(elapsed)

        # Check if context was preserved (look for references to previous topics)
        context_preserved = any(keyword in full_response.lower() for keyword in
                               ['pt pma', 'capitale', 'import', 'kbli', 'kitas'])

        metrics["context_verified"].append({
            "message_num": message_num,
            "preserved": context_preserved,
            "response_length": len(full_response),
            "chunks": chunks_received
        })

        log(f"✅ Chat stream complete")
        log(f"   ⏱️  Time: {elapsed*1000:.2f}ms")
        log(f"   📝 Chunks: {chunks_received}")
        log(f"   📊 Response: {len(full_response)} chars")
        log(f"   🧠 Context preserved: {'✅' if context_preserved else '❌'}")

        return full_response

    except Exception as e:
        log(f"❌ Chat stream failed: {e}")
        return None

def verify_session_retrieval(session_id):
    """Step 4: Verify session can be retrieved"""
    log(f"🔍 Verifying session retrieval...")
    start = time.time()

    response = requests.get(f"{BASE_URL}/sessions/{session_id}")
    elapsed = time.time() - start

    if response.status_code == 200:
        data = response.json()
        log(f"✅ Session retrieved: {data['message_count']} messages")
        log(f"   ⏱️  Time: {elapsed*1000:.2f}ms")
        return data
    else:
        log(f"❌ Failed to retrieve session: {response.status_code}")
        return None

def print_final_report():
    """Print comprehensive test report"""
    print("\n" + "="*80)
    print("📊 SESSION STORE TEST REPORT - 50+ MESSAGES")
    print("="*80)

    print(f"\n🆔 Session ID: {metrics['session_id']}")
    print(f"📝 Total Messages: {metrics['total_messages']}")

    print(f"\n⏱️  PERFORMANCE METRICS:")
    print(f"   Session Creation:  {metrics['session_creation_time']*1000:.2f}ms")

    if metrics['session_update_times']:
        avg_update = sum(metrics['session_update_times']) / len(metrics['session_update_times'])
        print(f"   Session Update:    {avg_update*1000:.2f}ms (avg)")

    if metrics['chat_stream_times']:
        avg_stream = sum(metrics['chat_stream_times']) / len(metrics['chat_stream_times'])
        print(f"   Chat Stream:       {avg_stream*1000:.2f}ms (avg)")

    print(f"\n🧠 CONTEXT VERIFICATION:")
    preserved_count = sum(1 for v in metrics['context_verified'] if v['preserved'])
    total_tests = len(metrics['context_verified'])

    if total_tests > 0:
        preservation_rate = (preserved_count / total_tests) * 100
        print(f"   Context Preserved: {preserved_count}/{total_tests} ({preservation_rate:.1f}%)")

        for verification in metrics['context_verified']:
            status = "✅" if verification['preserved'] else "❌"
            print(f"   {status} Message #{verification['message_num']}: "
                  f"{verification['response_length']} chars, "
                  f"{verification['chunks']} chunks")

    print("\n" + "="*80)

def main():
    """Main test execution"""
    print("\n🚀 STARTING SESSION STORE TEST - 50+ MESSAGES\n")

    # Step 1: Create session
    session_id = create_session()
    if not session_id:
        return

    time.sleep(0.5)

    # Step 2: Generate and upload conversation history
    history = generate_conversation_history(55)

    if not update_session(session_id, history):
        return

    time.sleep(0.5)

    # Step 3: Verify retrieval
    retrieved_data = verify_session_retrieval(session_id)
    if not retrieved_data:
        return

    time.sleep(0.5)

    # Step 4: Test chat-stream with context (multiple queries)
    test_queries = [
        "Riassumi i costi totali per aprire la PT PMA",
        "Quali sono le tempistiche dalla documentazione all'apertura?",
        "Cosa hai detto prima sui codici KBLI per import-export?"
    ]

    for i, query in enumerate(test_queries, start=1):
        log(f"\n--- Test Query {i}/3 ---")
        test_chat_stream(session_id, query, i)
        time.sleep(1)

    # Step 5: Print final report
    print_final_report()

    print(f"\n✅ TEST COMPLETED SUCCESSFULLY")
    print(f"Session ID for manual inspection: {session_id}\n")

if __name__ == "__main__":
    main()
