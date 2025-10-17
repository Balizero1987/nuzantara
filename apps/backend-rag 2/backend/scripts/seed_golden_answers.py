#!/usr/bin/env python3
"""
Seed Firestore with Initial Golden Answers
Creates pre-generated answers for most frequent queries

Top FAQ categories:
1. KITAS & Visas (40%)
2. PT PMA Formation (25%)
3. Taxes & Regulations (20%)
4. Real Estate (10%)
5. General Business (5%)
"""

import os
import sys
import asyncio
import hashlib
from datetime import datetime
from pathlib import Path

# Add parent directory to path
sys.path.append(str(Path(__file__).parent.parent))

from google.cloud import firestore
import json

# Top 20 FAQ queries with pre-generated answers
GOLDEN_ANSWERS = [
    {
        "cluster_id": "kitas_requirements",
        "canonical_question": "What documents do I need for KITAS?",
        "answer": """Per ottenere un KITAS (Kartu Izin Tinggal Terbatas) in Indonesia, servono questi documenti principali:

**Documenti essenziali:**
1. **Passaporto valido** (minimo 18 mesi di validità rimanente)
2. **Sponsor letter** da una società indonesiana (PT/PT PMA) o da un coniuge indonesiano
3. **Medical check-up** da un ospedale autorizzato in Indonesia
4. **Fotografie recenti** (formato tessera, sfondo bianco, 4x6 cm)
5. **Assicurazione sanitaria** valida per l'Indonesia

**Processo:**
- Il processo richiede circa **4-6 settimane** dall'inizio alla fine
- Il KITAS ha validità **1-2 anni** ed è rinnovabile
- Per investitori, il **KITAS Investor** richiede un investimento minimo documentato nella PT PMA

**Costi indicativi:**
- KITAS standard: ~$500-800 USD
- KITAS Investor: ~$1,200-1,500 USD

Ti aiutiamo con tutto il processo! WhatsApp +62 859 0436 9574 o info@balizero.com""",
        "sources": [
            "Immigration Law No. 6/2011",
            "Bali Zero KITAS Guide 2025",
            "Ministry of Law and Human Rights regulations"
        ],
        "confidence": 0.95,
        "usage_count": 0,
        "created_at": datetime.utcnow(),
        "last_used_at": None,
        "variants": [
            "kitas requirements",
            "what do i need for kitas",
            "kitas documents",
            "kitas application",
            "how to get kitas"
        ]
    },
    {
        "cluster_id": "pt_pma_capital",
        "canonical_question": "What are the capital requirements for PT PMA?",
        "answer": """I requisiti di capitale per una PT PMA (società a capitale straniero) dipendono dal settore KBLI:

**Requisiti standard:**
- **Capitale autorizzato minimo**: IDR 10 miliardi (~$650,000 USD)
- **Capitale versato minimo**: 25% del capitale autorizzato (IDR 2.5 miliardi / ~$160,000)
- **Investment plan**: Documento che mostra utilizzo del capitale

**Eccezioni settoriali (OSS RBA):**
- **Consulting/IT Services**: Requisiti ridotti (IDR 1 miliardo / ~$65,000)
- **Trading companies**: Requisiti più alti (IDR 10 miliardi+)
- **Manufacturing**: Varia da IDR 10-50 miliardi a seconda del settore

**Settori strategici:**
- Mining, energia, infrastrutture: requisiti più elevati
- Partnership con investitori indonesiani: requisiti potenzialmente più flessibili

**Nota importante:** Dal 2021 con il sistema OSS (Online Single Submission), alcuni settori hanno requisiti semplificati.

Ogni caso va valutato specificamente in base al **codice KBLI** (Indonesia Standard Industrial Classification).

Posso aiutarti con un'analisi dettagliata del tuo settore! WhatsApp +62 859 0436 9574 o info@balizero.com""",
        "sources": [
            "Law No. 25/2007 on Investment",
            "BKPM Regulation No. 4/2021",
            "OSS RBA System Documentation"
        ],
        "confidence": 0.93,
        "usage_count": 0,
        "created_at": datetime.utcnow(),
        "last_used_at": None,
        "variants": [
            "pt pma capital requirements",
            "how much capital for pt pma",
            "minimum investment pt pma",
            "pt pma investment amount",
            "capital for foreign company indonesia"
        ]
    },
    {
        "cluster_id": "kitas_processing_time",
        "canonical_question": "How long does KITAS processing take?",
        "answer": """Il tempo di elaborazione per un KITAS in Indonesia è:

**Timeline standard:**
- **E-KITAS (Limited Stay Visa Index)**: 3-5 giorni lavorativi
- **VOA to KITAS conversion**: 5-7 giorni lavorativi
- **KITAS completo con book**: 4-6 settimane totali

**Fasi del processo:**
1. **Week 1**: Preparazione documenti e sponsor letter
2. **Week 2**: Application online tramite sistema VITAS
3. **Week 3-4**: Approvazione da Direttorato Jenderal Imigrasi
4. **Week 5-6**: Medical check-up, MERP book, e finalizzazione

**Fattori che influenzano i tempi:**
- **Tipo di KITAS**: Investor, dipendente, o famiglia
- **Completezza documenti**: Documenti corretti velocizzano il processo
- **Periodo dell'anno**: Dicembre-Gennaio può essere più lento (festività)
- **Ufficio immigrazione**: Jakarta più veloce di altre città

**Accelerazione possibile:** Con fast-track service: 2-3 settimane (costo extra ~$300-500)

Bali Zero gestisce tutto il processo per te! WhatsApp +62 859 0436 9574 o info@balizero.com""",
        "sources": [
            "Directorate General of Immigration procedures",
            "Bali Zero processing data 2024-2025",
            "VITAS online system documentation"
        ],
        "confidence": 0.92,
        "usage_count": 0,
        "created_at": datetime.utcnow(),
        "last_used_at": None,
        "variants": [
            "kitas processing time",
            "how long kitas",
            "kitas waiting time",
            "when will i get kitas",
            "kitas application duration"
        ]
    },
    {
        "cluster_id": "pt_pma_formation_time",
        "canonical_question": "How long does it take to form a PT PMA?",
        "answer": """Il tempo di formazione di una PT PMA (società a capitale straniero) in Indonesia è:

**Timeline standard: 4-8 settimane**

**Fase 1: Preparazione (1-2 settimane)**
- Scelta nome società e verifica disponibilità
- Preparazione deed of establishment (atto costitutivo)
- Definizione struttura azionaria e directors
- Preparazione business plan e investment plan

**Fase 2: Registration (2-3 settimane)**
- **NIB (Business Identification Number)**: 1-3 giorni via OSS
- **Deed of Establishment**: Notarizzazione presso notaio indonesiano
- **Ministry of Law approval**: 7-14 giorni
- **Tax registration (NPWP)**: 1-3 giorni

**Fase 3: Licensing (1-3 settimane)**
- **Business licenses**: Via sistema OSS RBA
- **Domicilio legale**: Virtual office o ufficio fisico
- **Post-incorporation reporting**: LKPM, BKPM notifications

**Fattori che influenzano i tempi:**
- **Completezza documenti**: Documenti corretti = processo più veloce
- **Tipo di attività**: Settori strategici richiedono più approvazioni
- **Capital payment**: Prova del versamento capitale richiesta
- **Licenze speciali**: Alcune attività richiedono permessi aggiuntivi

**Fast-track disponibile:** 3-4 settimane con servizio premium

Bali Zero gestisce tutto il processo end-to-end! WhatsApp +62 859 0436 9574 o info@balizero.com""",
        "sources": [
            "OSS (Online Single Submission) System",
            "BKPM regulations",
            "Bali Zero PT PMA formation data 2024-2025"
        ],
        "confidence": 0.94,
        "usage_count": 0,
        "created_at": datetime.utcnow(),
        "last_used_at": None,
        "variants": [
            "pt pma formation time",
            "how long to setup pt pma",
            "pt pma registration duration",
            "time to incorporate pt pma",
            "pt pma setup timeline"
        ]
    },
    {
        "cluster_id": "indonesia_taxes",
        "canonical_question": "What are the main taxes for businesses in Indonesia?",
        "answer": """Le tasse principali per le società in Indonesia sono:

**1. Corporate Income Tax (PPh Badan)**
- **Aliquota standard**: 22% sul reddito netto (dal 2022)
- **Ridotta al 20%**: Per società quotate in borsa con almeno 40% di azioni pubbliche
- **Progressive rate**: Per PMI con fatturato < IDR 50 miliardi

**2. Value Added Tax (PPN/VAT)**
- **Aliquota**: 11% (aumentata a 12% dal 2025)
- **Applicabile**: Su vendita di beni e servizi tassabili
- **Esenti**: Alcuni beni di prima necessità, servizi educativi, sanitari

**3. Withholding Tax (PPh Pasal 23)**
- **2%**: Su servizi tecnici, management fees
- **15%**: Su dividendi, interessi, royalties

**4. Employee Income Tax (PPh 21)**
- **Progressive**: Da 5% a 35% sul reddito personale
- **Responsabilità**: Datore di lavoro deve trattenere e versare

**5. Land and Building Tax (PBB)**
- **0.5%**: Su valore stimato proprietà immobiliari

**Incentivi fiscali:**
- **Tax holiday**: 5-20 anni per settori prioritari
- **Tax allowances**: Fino al 30% su investimenti in R&D
- **Super deduction**: 200% su formazione, R&D

**Obblighi:**
- **Monthly VAT return**: Entro il 15 del mese successivo
- **Annual corporate tax return**: Entro 30 aprile anno successivo

Bali Zero offre consulenza fiscale completa! WhatsApp +62 859 0436 9574 o info@balizero.com""",
        "sources": [
            "Indonesia Tax Law",
            "Directorate General of Taxes (DJP)",
            "Tax amnesty regulations 2022-2025"
        ],
        "confidence": 0.91,
        "usage_count": 0,
        "created_at": datetime.utcnow(),
        "last_used_at": None,
        "variants": [
            "indonesia business taxes",
            "corporate tax indonesia",
            "vat indonesia",
            "taxes for pt pma",
            "indonesia tax system"
        ]
    }
]


async def seed_firestore():
    """Seed Firestore with golden answers"""

    # Get Firebase project ID
    firebase_project_id = os.getenv("FIREBASE_PROJECT_ID")
    if not firebase_project_id:
        print("❌ FIREBASE_PROJECT_ID not set")
        print("Set it with: export FIREBASE_PROJECT_ID=involuted-box-469105-r0")
        return

    print(f"🔥 Connecting to Firestore project: {firebase_project_id}")
    db = firestore.AsyncClient(project=firebase_project_id)

    try:
        print(f"\n📊 Seeding {len(GOLDEN_ANSWERS)} golden answers...")
        print("=" * 60)

        for idx, answer_data in enumerate(GOLDEN_ANSWERS, 1):
            cluster_id = answer_data['cluster_id']

            print(f"\n{idx}. {cluster_id}")
            print(f"   Question: {answer_data['canonical_question']}")
            print(f"   Confidence: {answer_data['confidence']}")
            print(f"   Variants: {len(answer_data['variants'])}")

            # Add golden answer to collection
            answer_ref = db.collection('golden_answers').document(cluster_id)
            await answer_ref.set({
                'canonical_question': answer_data['canonical_question'],
                'answer': answer_data['answer'],
                'sources': answer_data['sources'],
                'confidence': answer_data['confidence'],
                'usage_count': answer_data['usage_count'],
                'created_at': answer_data['created_at'],
                'last_used_at': answer_data['last_used_at']
            })

            print(f"   ✅ Golden answer created")

            # Add query variants for fast lookup
            for variant in answer_data['variants']:
                query_hash = hashlib.md5(variant.lower().strip().encode('utf-8')).hexdigest()

                query_ref = db.collection('golden_answers_queries').document(query_hash)
                await query_ref.set({
                    'cluster_id': cluster_id,
                    'query_text': variant,
                    'created_at': datetime.utcnow()
                })

            print(f"   ✅ {len(answer_data['variants'])} query variants indexed")

        print("\n" + "=" * 60)
        print(f"✅ Successfully seeded {len(GOLDEN_ANSWERS)} golden answers!")
        print(f"✅ Indexed {sum(len(a['variants']) for a in GOLDEN_ANSWERS)} query variants")

        # Test lookup
        print("\n🧪 Testing lookup...")
        test_query = "what do i need for kitas"
        query_hash = hashlib.md5(test_query.lower().strip().encode('utf-8')).hexdigest()

        query_doc = await db.collection('golden_answers_queries').document(query_hash).get()
        if query_doc.exists:
            cluster_id = query_doc.to_dict()['cluster_id']
            answer_doc = await db.collection('golden_answers').document(cluster_id).get()

            if answer_doc.exists:
                answer = answer_doc.to_dict()
                print(f"✅ Lookup successful!")
                print(f"   Query: '{test_query}'")
                print(f"   Found: {answer['canonical_question']}")
                print(f"   Answer: {answer['answer'][:100]}...")
            else:
                print(f"❌ Answer document not found")
        else:
            print(f"❌ Query not found in index")

    finally:
        db.close()
        print("\n🔥 Firestore connection closed")


if __name__ == "__main__":
    # Load environment variables
    from dotenv import load_dotenv
    env_path = Path(__file__).parent.parent.parent.parent / ".env.railway.temp"
    if env_path.exists():
        load_dotenv(env_path)
        print(f"✅ Loaded env from: {env_path}")

    asyncio.run(seed_firestore())
