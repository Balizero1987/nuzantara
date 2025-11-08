#!/usr/bin/env node
/**
 * ZANTARA Business Test - 30 Domande Complesse
 *
 * Test di stress per Zantara con domande business ad alta difficoltà
 */

import axios from 'axios';
import fs from 'fs';

// Configurazione
const ZANTARA_API = process.env.ZANTARA_API_URL || 'https://nuzantara-production.up.railway.app';
const TEST_USER_ID = 'test-business-user-' + Date.now();
const OUTPUT_FILE = `zantara-business-test-${Date.now()}.json`;

// 30 Domande Business Alta Difficoltà
const DOMANDE_BUSINESS = [
  // IMMIGRATION & VISA (10 domande complesse)
  {
    id: 1,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Sono un imprenditore italiano con PT PMA attiva (80% foreign ownership, KBLI 62010) e 3 dipendenti indonesiani. Voglio portare mia moglie e mio figlio di 15 anni. Qual è il percorso KITAS più veloce per loro? Devo fare E31 o posso fare E23? Quali documenti servono per il figlio minorenne e quanto tempo ci vuole?"
  },
  {
    id: 2,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Ho KITAS E33G (Remote Worker) valida per 2 anni. Voglio aprire PT PMA per fare consulting. Devo cancellare E33G e rifare tutto da zero con E28A, oppure posso convertire? Se cancello E33G, perdo il visto e devo uscire dall'Indonesia? Quali sono i rischi e i tempi?"
  },
  {
    id: 3,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Mia PT PMA è stata approvata da BKPM con capitale 10 miliardi IDR. Ho 4 azionisti stranieri (USA, Italia, Singapore, Australia) tutti al 20%. Chi di loro può ottenere KITAS E28A Investor? Serve davvero 10 miliardi per 4 persone o bastano 2.5 miliardi? E se uno degli azionisti è solo passive investor?"
  },
  {
    id: 4,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Ho appena fatto IMTA approval per 2 expat (Director e CTO). KITAS E23 Working sono in processing. Il mio lawyer dice che ci vogliono 45 giorni, ma ho letto che con fast track si fa in 14 giorni. Quanto costa il fast track? È legale? Chi lo gestisce? E se qualcosa va storto con IMTA, cosa succede al KITAS?"
  },
  {
    id: 5,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Sto per sposare una ragazza indonesiana. Ho B211A visa (visit). Dopo matrimonio posso fare subito E31 Limited Stay KITAS sposato con indonesiana? Oppure devo uscire e rientrare? Quanti documenti servono? L'apostille del certificato di celibato italiano è riconosciuto? Posso lavorare con E31 o serve aggiungere IMTA?"
  },
  {
    id: 6,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "La mia PT PMA ha cambiato sede legale da Jakarta a Bali, e abbiamo fatto domicile letter update. I miei 2 expat con KITAS E23 Working devono rifare il KITAS per Bali o basta notificare immigration? C'è un costo? E se uno di loro lavora da remoto da Bali ma il contratto dice Jakarta, è legale?"
  },
  {
    id: 7,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Ho Golden Visa / Second Home Visa valida 10 anni (deposit 2 billion IDR). Posso aprire PT PMA e lavorare nella mia azienda? Oppure Golden Visa è solo per investment e non posso essere Director? Se non posso lavorare, posso almeno fare shareholder meeting e firmare documenti aziendali?"
  },
  {
    id: 8,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Mio KITAS E28A Investor sta per scadere tra 30 giorni. La mia PT PMA ha avuto perdite per 2 anni consecutivi e il revenue è sotto 500 milioni IDR. Immigration rinnoverà il KITAS oppure mi chiedono proof of investment activity? Cosa succede se rigettano il renewal? Ho diritto a exit permit?"
  },
  {
    id: 9,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Ho fatto D12 business explorer visa multiple entry per 1 anno. Ogni ingresso posso stare 60 giorni. Dopo 4 viaggi consecutivi (4x60 giorni), immigration Bali mi ha detto che devo stare fuori almeno 30 giorni. È vero? Qual è la legge precisa? Quante volte posso entrare in 1 anno con D12?"
  },
  {
    id: 10,
    categoria: "immigration",
    difficolta: "alta",
    domanda: "Sono cittadino USA con KITAS E33G Remote Worker. Lavoro per azienda americana (W2 employee), ma faccio anche freelance consulting per clienti indonesiani (fatturati tramite azienda USA). Immigration ha fatto controllo random e mi ha chiesto spiegazioni. Rischio cancellazione KITAS? Devo fare E23 Working invece? Quali sono le conseguenze?"
  },

  // BUSINESS & PT PMA (10 domande complesse)
  {
    id: 11,
    categoria: "business",
    difficolta: "alta",
    domanda: "Voglio aprire PT PMA per software development (KBLI 62010) con 2 soci: io italiano 70%, partner indonesiano 30%. Capitale 10 miliardi IDR. Il partner indonesiano vuole mettere asset (tanah certificato SHM Bali del valore di 8 miliardi) invece di cash. BKPM accetta asset contribution? Serve perizia indipendente? Quali tasse sulla valutazione dell'asset?"
  },
  {
    id: 12,
    categoria: "business",
    difficolta: "alta",
    domanda: "La mia PT PMA (100% foreign owned) ha fatto revenue 5 miliardi IDR nel 2024, ma net profit negativo (loss 500 milioni) a causa di marketing spend alto. Per il 2025, BKPM ha mandato warning letter dicendo che devo raggiungere minimum investment realization. Cosa significa? Rischio chiusura forzata? Come si calcola minimum investment realization?"
  },
  {
    id: 13,
    categoria: "business",
    difficolta: "alta",
    domanda: "Ho PT PMA (NIB OSS, KBLI 47911 e-commerce). Voglio aggiungere KBLI 56101 (restaurant) per aprire un ristorante fisico a Canggu. Devo fare company revision (anggaran dasar amendment) oppure posso solo aggiungere KBLI sul OSS? Il restaurant è DNI (forbidden for foreign investment), come faccio? Serve nominee indonesiano?"
  },
  {
    id: 14,
    categoria: "business",
    difficolta: "alta",
    domanda: "Mia PT PMA ha 3 shareholders esteri (40%, 35%, 25%). Uno shareholder al 25% vuole uscire e vendere le sue shares a me. Serve notarial deed per share transfer? Qual è la tassa? Devo fare BKPM notification? E se invece voglio diluire uno shareholder da 25% a 10% facendo capital increase, come funziona?"
  },
  {
    id: 15,
    categoria: "business",
    difficolta: "alta",
    domanda: "Ho PT PMA con sede legale a Jakarta (domicile letter di proprietà). Voglio spostare sede operativa a Bali, ma mantenere sede legale a Jakarta. Serve fare domicile letter update a Bali? Posso avere 2 domicile letters (Jakarta legal, Bali operational)? Quali implicazioni fiscali (PPN, tax office registration)?"
  },
  {
    id: 16,
    categoria: "business",
    difficolta: "alta",
    domanda: "La mia PT PMA (62010 software) ha contratto con cliente in Singapura (payment in USD). Cliente paga su bank account Singapore mio personale perché la PT non ha ancora swift code. Posso fare invoice dalla PT per questo payment? Quali rischi fiscali? Devo dichiarare questo income come foreign exchange in annual tax report?"
  },
  {
    id: 17,
    categoria: "business",
    difficolta: "alta",
    domanda: "Voglio aprire PT PMA 100% foreign owned per alcohol import & distribution a Bali (KBLI 46342). Serve license SKPL (Surat Keterangan Pendaftaran Legalitas) + alcohol import permit dal Ministry of Trade. Quali sono i requisiti minimi? Quanto costa? Serve warehouse dedicato? Tempo di approval?"
  },
  {
    id: 18,
    categoria: "business",
    difficolta: "alta",
    domanda: "Mia PT PMA (consulting) ha 1 director straniero (me). Voglio aggiungere un secondo director indonesiano (local partner) per facilitare banking e government interaction. Devo fare deed of amendment? Board resolution è sufficiente? Questo director indonesiano deve essere shareholder o può essere solo employee con director title?"
  },
  {
    id: 19,
    categoria: "business",
    difficolta: "alta",
    domanda: "Ho PT PMA (KBLI 58130 newspaper publishing). Google Adsense ha bloccato il mio account perché dice che Indonesia richiede local media license. Serve surat izin usaha penerbitan pers dal Ministry of Communication? Questo è included nel NIB OSS oppure è separate license? Quanto tempo ci vuole?"
  },
  {
    id: 20,
    categoria: "business",
    difficolta: "alta",
    domanda: "La mia PT PMA ha chiuso operazioni e voglio fare voluntary liquidation. Ho ancora 1 expat con KITAS E23 Working legato alla PT. Devo cancellare il KITAS prima di liquidare la PT? Qual è il processo corretto? Quanto tempo ci vuole? Posso fare liquidation mentre ho ancora employees e tax obligations pending?"
  },

  // TAX & COMPLIANCE (10 domande complesse)
  {
    id: 21,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Sono tax resident in Italia, ma passo 6 mesi/anno a Bali con KITAS E28A Investor. Indonesia dice che dopo 183 giorni divento tax resident indonesiano. Italia dice che resto tax resident italiano finché mantengo casa e famiglia in Italia. C'è tax treaty Italia-Indonesia? Rischio double taxation? Come dichiaro worldwide income?"
  },
  {
    id: 22,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Mia PT PMA fattura 10 miliardi IDR/anno. Ho 3 expat con KITAS che guadagnano 15,000 USD/mese ciascuno (paid by PT PMA). Devo fare PPh 21 (income tax withholding) su stipendio expat? Qual è la progressive tax rate per income sopra 500 milioni IDR/anno? Posso dedurre housing allowance e flight tickets?"
  },
  {
    id: 23,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Ho PT PMA (e-commerce) che vende prodotti digitali (corsi online) a clienti indonesiani. Devo pagare PPN (VAT) 11%? Oppure prodotti digitali sono esenti? Se devo pagare PPN, serve PKP (taxable enterprise) registration dal tax office? Quali sono penalties se non sono PKP e ho venduto senza PPN per 2 anni?"
  },
  {
    id: 24,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Mia PT PMA paga dividendi ai 2 shareholders stranieri (totale 500 milioni IDR). Devo fare PPh 26 (withholding tax on dividends) del 20%? Oppure con tax treaty si riduce? Se shareholders sono in Singapore (tax treaty), qual è la rate? Devo fare tax reporting entro quando?"
  },
  {
    id: 25,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Ho PT PMA che compra software licenses dalla azienda madre in USA (total 200 milioni IDR/anno). Questo è considerato royalty payment? Devo fare PPh 26 (withholding tax) 20% su royalty? Serve tax clearance dal tax office prima del wire transfer? Come si calcola taxable base per software licensing?"
  },
  {
    id: 26,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Mia PT PMA ha perso 1 miliardo IDR nel 2023 e 500 milioni nel 2024. Nel 2025 prevedo profit 2 miliardi. Posso fare loss carry-forward per offset taxes 2025? Per quanti anni si può portare avanti le losses? Serve documentazione speciale per tax office? Quali rischi se tax office rigetta il carry-forward?"
  },
  {
    id: 27,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Ho KITAS E33G Remote Worker. Lavoro per azienda USA che mi paga su bank account italiano. Non ho income indonesiano. Devo fare tax filing in Indonesia? Devo prendere NPWP? Se tax office scopre che non ho mai fatto filing, quali penalties? Posso richiedere tax residency certificate dall'Italia per evitare Indonesia tax?"
  },
  {
    id: 28,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Mia PT PMA ha fatto import di equipment dal China (valore CIF 500 milioni IDR). Customs ha applicato import duty 10% + PPN 11% + PPh 22 (prepaid income tax) 2.5%. Posso deduct PPh 22 dal corporate income tax annuale? Come si fa il claim? Serve documentazione speciale? Tempo limite per claim?"
  },
  {
    id: 29,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Ho PT PMA con revenue 15 miliardi IDR/anno. Tax office ha fatto audit e trovato discrepancies per 200 milioni (invoice senza PPN). Mi hanno dato assessment letter con penalty 50% + interest. Posso fare objection (keberatan)? Qual è il processo? Devo pagare prima l'assessment e poi fare objection, oppure posso bloccare il payment durante objection?"
  },
  {
    id: 30,
    categoria: "tax",
    difficolta: "alta",
    domanda: "Sono freelance con NPWP. Lavoro da remoto per clienti internazionali (revenue 500 milioni IDR/anno). Non ho PT, lavoro come orang pribadi (individual). Devo fare PPh 25 (monthly installment) o solo annual tax filing PPh 29? Posso deduct business expenses (laptop, coworking) senza PT? Quali rischi se non ho made monthly payments?"
  }
];

// Funzione per testare una singola domanda
async function testaZantara(domanda, index, total) {
  const startTime = Date.now();

  console.log(`\n[${ index + 1}/${total}] 🧪 Testando: ${domanda.categoria} (difficoltà: ${domanda.difficolta})`);
  console.log(`📝 Domanda: ${domanda.domanda.substring(0, 100)}...`);

  try {
    // Chiama API di chat Zantara
    const response = await axios.post(
      `${ZANTARA_API}/api/chat`,
      {
        messages: [
          {
            role: 'user',
            content: domanda.domanda
          }
        ],
        userId: TEST_USER_ID,
        sessionId: `test-session-${domanda.id}`,
        model: 'sonnet-3.5'  // Usa il modello migliore
      },
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 60000 // 60 secondi timeout
      }
    );

    const endTime = Date.now();
    const duration = endTime - startTime;

    const result = {
      id: domanda.id,
      categoria: domanda.categoria,
      difficolta: domanda.difficolta,
      domanda: domanda.domanda,
      risposta: response.data.response || response.data.content,
      success: true,
      duration_ms: duration,
      timestamp: new Date().toISOString(),
      tools_used: response.data.tool_uses || [],
      model: response.data.model || 'sonnet-3.5'
    };

    console.log(`✅ Risposta ricevuta in ${duration}ms`);
    console.log(`🔧 Tools usati: ${result.tools_used.length || 0}`);
    console.log(`📊 Risposta: ${result.risposta.substring(0, 200)}...`);

    return result;

  } catch (error) {
    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log(`❌ ERRORE: ${error.message}`);

    return {
      id: domanda.id,
      categoria: domanda.categoria,
      difficolta: domanda.difficolta,
      domanda: domanda.domanda,
      risposta: null,
      success: false,
      error: error.message,
      duration_ms: duration,
      timestamp: new Date().toISOString()
    };
  }
}

// Funzione principale
async function runTest() {
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║   🧪 ZANTARA BUSINESS TEST - 30 Domande Alta Difficoltà    ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`🎯 Target API: ${ZANTARA_API}`);
  console.log(`👤 Test User ID: ${TEST_USER_ID}`);
  console.log(`📝 Numero domande: ${DOMANDE_BUSINESS.length}`);
  console.log(`💾 Output file: ${OUTPUT_FILE}\n`);

  const results = [];
  const total = DOMANDE_BUSINESS.length;

  // Esegui test sequenzialmente per non sovraccaricare il server
  for (let i = 0; i < total; i++) {
    const result = await testaZantara(DOMANDE_BUSINESS[i], i, total);
    results.push(result);

    // Pausa di 2 secondi tra domande
    if (i < total - 1) {
      console.log('\n⏳ Pausa 2 secondi...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  // Statistiche finali
  const successi = results.filter(r => r.success).length;
  const errori = results.filter(r => !r.success).length;
  const tempoTotale = results.reduce((sum, r) => sum + r.duration_ms, 0);
  const tempoMedio = tempoTotale / results.length;

  const stats = {
    totale_domande: total,
    successi: successi,
    errori: errori,
    success_rate: ((successi / total) * 100).toFixed(2) + '%',
    tempo_totale_ms: tempoTotale,
    tempo_medio_ms: Math.round(tempoMedio),
    tempo_totale_minuti: (tempoTotale / 60000).toFixed(2),
    categorie: {
      immigration: results.filter(r => r.categoria === 'immigration').length,
      business: results.filter(r => r.categoria === 'business').length,
      tax: results.filter(r => r.categoria === 'tax').length
    },
    timestamp: new Date().toISOString()
  };

  // Salva risultati
  const output = {
    metadata: {
      test_name: 'ZANTARA Business Test - Alta Difficoltà',
      api_url: ZANTARA_API,
      user_id: TEST_USER_ID,
      total_questions: total,
      timestamp: new Date().toISOString()
    },
    statistics: stats,
    results: results
  };

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

  // Report finale
  console.log('\n\n╔══════════════════════════════════════════════════════════════╗');
  console.log('║                    📊 REPORT FINALE                          ║');
  console.log('╚══════════════════════════════════════════════════════════════╝\n');

  console.log(`✅ Successi: ${successi}/${total} (${stats.success_rate})`);
  console.log(`❌ Errori: ${errori}/${total}`);
  console.log(`⏱️  Tempo totale: ${stats.tempo_totale_minuti} minuti`);
  console.log(`⚡ Tempo medio: ${stats.tempo_medio_ms}ms per domanda\n`);

  console.log('📂 Per categoria:');
  console.log(`   - Immigration: ${stats.categorie.immigration} domande`);
  console.log(`   - Business: ${stats.categorie.business} domande`);
  console.log(`   - Tax: ${stats.categorie.tax} domande\n`);

  console.log(`💾 Risultati salvati in: ${OUTPUT_FILE}\n`);

  if (errori > 0) {
    console.log('⚠️  DOMANDE FALLITE:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   [${r.id}] ${r.categoria}: ${r.error}`);
    });
  }

  console.log('\n🎉 Test completato!\n');
}

// Esegui test
runTest().catch(error => {
  console.error('❌ Errore fatale:', error);
  process.exit(1);
});
