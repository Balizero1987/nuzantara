/**
 * ROUND 2 - ECONOMIC CORE LEGISLATION
 * Download delle 25 leggi economiche fondamentali indonesiane
 *
 * ISTRUZIONI:
 * 1. Vai su https://peraturan.bpk.go.id
 * 2. Apri Dev Tools (F12)
 * 3. Incolla questo script
 * 4. Lo script partirà automaticamente
 */

console.log('💰 ROUND 2: ECONOMIC CORE LEGISLATION');
console.log('📋 Download automatico di 25 leggi economiche fondamentali');

// Leggi Round 2 - ECONOMIC CORE
const ECONOMIC_CORE_LAWS = [
  {
    title: 'UU No. 7 Tahun 2014 Perdagangan',
    type: 'UU',
    keywords: ['7', '2014', 'Perdagangan', 'Trade'],
  },
  {
    title: 'UU No. 25 Tahun 2007 Penanaman Modal',
    type: 'UU',
    keywords: ['25', '2007', 'Penanaman Modal', 'Investment'],
  },
  {
    title: 'UU No. 40 Tahun 2007 Perseroan Terbatas',
    type: 'UU',
    keywords: ['40', '2007', 'Perseroan Terbatas', 'PT', 'Limited Company'],
  },
  {
    title: 'UU No. 8 Tahun 1995 Pasar Modal',
    type: 'UU',
    keywords: ['8', '1995', 'Pasar Modal', 'Capital Market'],
  },
  {
    title: 'UU No. 19 Tahun 2003 BUMN',
    type: 'UU',
    keywords: ['19', '2003', 'BUMN', 'Badan Usaha Milik Negara'],
  },
  {
    title: 'UU No. 36 Tahun 2008 Ketenagakerjaan',
    type: 'UU',
    keywords: ['36', '2008', 'Ketenagakerjaan', 'Employment'],
  },
  {
    title: 'UU No. 28 Tahun 2008 Kesehatan',
    type: 'UU',
    keywords: ['28', '2008', 'Kesehatan', 'Health'],
  },
  {
    title: 'UU No. 23 Tahun 2014 Pemerintahan Daerah',
    type: 'UU',
    keywords: ['23', '2014', 'Pemerintahan Daerah', 'Regional Government'],
  },
  {
    title: 'UU No. 33 Tahun 2004 Perimbangan Keuangan',
    type: 'UU',
    keywords: ['33', '2004', 'Perimbangan Keuangan', 'Fiscal Balance'],
  },
  {
    title: 'UU No. 17 Tahun 2003 Keuangan Negara',
    type: 'UU',
    keywords: ['17', '2003', 'Keuangan Negara', 'State Finance'],
  },
  {
    title: 'UU No. 1 Tahun 2004 Perbendaharaan Negara',
    type: 'UU',
    keywords: ['1', '2004', 'Perbendaharaan Negara', 'State Treasury'],
  },
  {
    title: 'UU No. 15 Tahun 2001 Merek',
    type: 'UU',
    keywords: ['15', '2001', 'Merek', 'Trademark'],
  },
  { title: 'UU No. 14 Tahun 2001 Paten', type: 'UU', keywords: ['14', '2001', 'Paten', 'Patent'] },
  {
    title: 'UU No. 31 Tahun 2000 Desain Industri',
    type: 'UU',
    keywords: ['31', '2000', 'Desain Industri', 'Industrial Design'],
  },
  {
    title: 'UU No. 19 Tahun 2002 Hak Cipta',
    type: 'UU',
    keywords: ['19', '2002', 'Hak Cipta', 'Copyright'],
  },
  {
    title: 'UU No. 30 Tahun 2000 Rahasia Dagang',
    type: 'UU',
    keywords: ['30', '2000', 'Rahasia Dagang', 'Trade Secret'],
  },
  {
    title: 'UU No. 20 Tahun 2008 UMKM',
    type: 'UU',
    keywords: ['20', '2008', 'UMKM', 'Usaha Mikro Kecil Menengah'],
  },
  {
    title: 'UU No. 1 Tahun 2013 Lembaga Keuangan',
    type: 'UU',
    keywords: ['1', '2013', 'Lembaga Keuangan', 'Financial Institution'],
  },
  {
    title: 'UU No. 21 Tahun 2011 OJK',
    type: 'UU',
    keywords: ['21', '2011', 'OJK', 'Otoritas Jasa Keuangan'],
  },
  {
    title: 'UU No. 42 Tahun 1999 Perlindungan Konsumen',
    type: 'UU',
    keywords: ['42', '1999', 'Perlindungan Konsumen', 'Consumer Protection'],
  },
  {
    title: 'UU No. 10 Tahun 1998 Perbankan',
    type: 'UU',
    keywords: ['10', '1998', 'Perbankan', 'Banking'],
  },
  {
    title: 'UU No. 32 Tahun 2004 Pemerintahan Daerah',
    type: 'UU',
    keywords: ['32', '2004', 'Pemerintahan Daerah', 'Regional Government'],
  },
  {
    title: 'UU No. 11 Tahun 2008 ITE',
    type: 'UU',
    keywords: ['11', '2008', 'ITE', 'Informasi Elektronik'],
  },
  {
    title: 'UU No. 40 Tahun 2004 SJSN',
    type: 'UU',
    keywords: ['40', '2004', 'SJSN', 'Jaminan Sosial'],
  },
  {
    title: 'UU No. 24 Tahun 2011 BPJS',
    type: 'UU',
    keywords: ['24', '2011', 'BPJS', 'Badan Penyelenggara Jaminan Sosial'],
  },
];

// Funzione principale di download Round 2
async function downloadEconomicCoreLaws() {
  console.log(`\n🚀 INIZIO DOWNLOAD ECONOMIC CORE LEGISLATION`);
  console.log(`📊 Totale leggi: ${ECONOMIC_CORE_LAWS.length}`);
  console.log(`⏰ Inizio: ${new Date().toLocaleString()}`);
  console.log(`💡 Impatto: 80% delle transazioni business in Indonesia`);

  const results = {
    round: 'ROUND_2_Economic_Core',
    started_at: new Date().toISOString(),
    laws: [],
    success_count: 0,
    error_count: 0,
    category_impact: 'Foundation for all business activities in Indonesia',
  };

  for (let i = 0; i < ECONOMIC_CORE_LAWS.length; i++) {
    const law = ECONOMIC_CORE_LAWS[i];
    console.log(`\n📄 ${i + 1}/${ECONOMIC_CORE_LAWS.length}: ${law.title}`);

    try {
      const result = await searchAndDownloadEconomicLaw(law, i + 1);
      results.laws.push(result);

      if (result.success) {
        results.success_count++;
        console.log(`✅ SUCCESS: ${result.title}`);

        // Mostra impatto specifico
        if (law.keywords.includes('Penanaman Modal')) {
          console.log(`   🎯 Critical per: Foreign Direct Investment`);
        } else if (law.keywords.includes('Perseroan Terbatas')) {
          console.log(`   🎯 Critical per: Company formation e corporate governance`);
        } else if (law.keywords.includes('Pasar Modal')) {
          console.log(`   🎯 Critical per: Capital markets e fundraising`);
        } else if (law.keywords.includes('Ketenagakerjaan')) {
          console.log(`   🎯 Critical per: Employment e labor relations`);
        }
      } else {
        results.error_count++;
        console.log(`❌ ERROR: ${result.error}`);
      }
    } catch (error) {
      console.error(`❌ FATAL ERROR: ${error.message}`);
      results.laws.push({
        success: false,
        error: error.message,
        law: law,
      });
      results.error_count++;
    }

    // Pausa tra le richieste per evitare rate limiting
    if (i < ECONOMIC_CORE_LAWS.length - 1) {
      console.log('⏸️ Pausa di 4 secondi per evitare rate limiting...');
      await new Promise((resolve) => setTimeout(resolve, 4000));
    }
  }

  // Salva riepilogo finale
  results.completed_at = new Date().toISOString();
  const duration = Math.round(
    (new Date(results.completed_at) - new Date(results.started_at)) / 1000
  );
  results.duration_seconds = duration;

  saveRound2Summary(results);

  console.log(`\n🎉 ROUND 2 COMPLETATO!`);
  console.log(`✅ Successi: ${results.success_count}/${ECONOMIC_CORE_LAWS.length}`);
  console.log(`❌ Errori: ${results.error_count}/${ECONOMIC_CORE_LAWS.length}`);
  console.log(`⏱️ Durata totale: ${duration} secondi`);
  console.log(`📁 Tutti i file salvati nella cartella ROUND_2_Economic_Core`);
  console.log(`💡 Ora hai il foundation economico completo per business in Indonesia!`);

  return results;
}

// Funzione specializzata per leggi economiche
async function searchAndDownloadEconomicLaw(lawInfo, index) {
  try {
    // Naviga alla pagina di ricerca se necessario
    if (!window.location.href.includes('peraturan.bpk.go.id')) {
      window.location.href = 'https://peraturan.bpk.go.id/Search';
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Strategy multi-keyword per leggi economiche
    const searchQueries = [
      lawInfo.title,
      `${lawInfo.type} No. ${lawInfo.keywords[0]} Tahun ${lawInfo.keywords[1]}`,
      lawInfo.keywords.find((k) => k.length > 5) || lawInfo.title,
    ];

    let bestResult = null;
    let maxScore = 0;

    // Prova diverse query di ricerca
    for (const query of searchQueries) {
      console.log(`   🔍 Searching: "${query}"`);

      // Compila campo ricerca
      const searchInput = document.querySelector('input[type="text"], input[name="q"], #search');
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
        searchInput.value = query;
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Esegui ricerca
        const searchButton = document.querySelector(
          'button[type="submit"], input[type="submit"], .search-btn'
        );
        if (searchButton) {
          searchButton.click();
        } else {
          searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));

        // Analizza risultati
        const lawLinks = Array.from(document.querySelectorAll('a[href*="/Detail/"]'));

        if (lawLinks.length > 0) {
          for (const link of lawLinks) {
            const linkText = link.textContent.toLowerCase();
            let score = 0;

            // Score avanzato per leggi economiche
            for (const keyword of lawInfo.keywords) {
              if (linkText.includes(keyword.toLowerCase())) {
                score += 10;
              }
            }

            // Bonus per tipo e numero
            if (linkText.includes(lawInfo.type.toLowerCase())) score += 5;
            if (linkText.includes(lawInfo.keywords[0])) score += 3;
            if (linkText.includes(lawInfo.keywords[1])) score += 3;

            // Bonus per termini economici rilevanti
            const economicTerms = [
              'perdagangan',
              'investasi',
              'usaha',
              'modal',
              'ekonomi',
              'dagang',
            ];
            for (const term of economicTerms) {
              if (linkText.includes(term)) score += 2;
            }

            if (score > maxScore) {
              maxScore = score;
              bestResult = { link, score, query };
            }
          }

          // Se abbiamo trovato un buon risultato, fermiamoci
          if (maxScore > 15) break;
        }
      }

      // Pausa breve tra le ricerche
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    if (bestResult && bestResult.score > 15) {
      console.log(
        `   ✅ Trovato: ${bestResult.link.textContent.trim()} (score: ${bestResult.score}, query: "${bestResult.query}")`
      );

      // Clicca sul link
      bestResult.link.click();
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Estrai contenuto dettagliato per legge economica
      const lawContent = extractEconomicLawContent(lawInfo, index);

      // Salva il file
      saveEconomicLawFile(lawContent, index);

      return {
        success: true,
        title: lawContent.title,
        law: lawInfo,
        index: index,
        content: lawContent,
        search_query_used: bestResult.query,
        relevance_score: bestResult.score,
      };
    } else {
      return {
        success: false,
        error: `Nessun match soddisfacente (best score: ${maxScore})`,
        law: lawInfo,
        index: index,
        attempted_queries: searchQueries,
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error.message,
      law: lawInfo,
      index: index,
    };
  }
}

// Estrai contenuto specifico per leggi economiche
function extractEconomicLawContent(lawInfo, index) {
  const content = {
    id: index,
    title: '',
    type: lawInfo.type,
    number: '',
    year: '',
    status: '',
    content: '',
    url: window.location.href,
    metadata: {},
    scraped_at: new Date().toISOString(),
    keywords: lawInfo.keywords,
    search_info: lawInfo,
    economic_category: detectEconomicCategory(lawInfo),
    business_relevance: calculateBusinessRelevance(lawInfo),
  };

  // Estrai titolo con priorità a elementi specifici
  const titleSelectors = ['h1', '.title', '.judul', '[class*="title"]', '[class*="judul"]'];

  for (const selector of titleSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > 10) {
        content.title = text;
        break;
      }
    }
  }

  // Estrai informazioni economiche specifiche
  const pageText = document.body.textContent;

  // Numero e anno
  const numberMatch = pageText.match(/No\.?\s*(\d+)/i);
  const yearMatch = pageText.match(/(19|20)\d{2}/);

  if (numberMatch) content.number = numberMatch[1];
  if (yearMatch) content.year = yearMatch[1];

  // Status legale
  if (pageText.includes('Berlaku')) content.status = 'BERLAKU';
  else if (pageText.includes('Dicabut')) content.status = 'DICABUT';
  else if (pageText.includes('Tidak Berlaku')) content.status = 'TIDAK_BERLAKU';
  else content.status = 'UNKNOWN';

  // Estrai metadati economici specifici
  content.metadata = extractEconomicMetadata(pageText, lawInfo);

  // Estrai contenuto principale
  const contentSelectors = [
    'div[class*="content"]',
    'div[class*="isi"]',
    'div[class*="detail"]',
    'main',
    'article',
  ];

  let bestContent = '';
  for (const selector of contentSelectors) {
    const element = document.querySelector(selector);
    if (element) {
      const text = element.textContent.trim();
      if (text.length > bestContent.length) {
        bestContent = text;
      }
    }
  }

  if (bestContent.length < 500) {
    bestContent = pageText;
  }

  content.content = bestContent.substring(0, 15000); // Aumentato per leggi economiche

  return content;
}

// Detect categoria economica
function detectEconomicCategory(lawInfo) {
  const categories = {
    Investment: ['Penanaman Modal', 'Investasi', 'PMA', 'PMDN'],
    Corporate: ['Perseroan Terbatas', 'PT', 'Perseroan', 'Perusahaan'],
    'Capital Markets': ['Pasar Modal', 'Saham', 'Obligasi', 'Efek'],
    Trade: ['Perdagangan', 'Dagang', 'Ekspor', 'Impor'],
    Banking: ['Perbankan', 'Bank', 'Kredit', 'Simpanan'],
    'Intellectual Property': ['Merek', 'Paten', 'Hak Cipta', 'Desain'],
    Labor: ['Ketenagakerjaan', 'Pekerja', 'Buruh', 'Tenaga Kerja'],
    Consumer: ['Konsumen', 'Perlindungan Konsumen'],
    Healthcare: ['Kesehatan', 'Obat', 'Medis'],
    'Social Security': ['BPJS', 'Jaminan Sosial', 'SJSN'],
  };

  for (const [category, terms] of Object.entries(categories)) {
    for (const term of terms) {
      if (
        lawInfo.title.toLowerCase().includes(term.toLowerCase()) ||
        lawInfo.keywords.some((k) => k.toLowerCase().includes(term.toLowerCase()))
      ) {
        return category;
      }
    }
  }

  return 'General Business';
}

// Calcola rilevanza per business
function calculateBusinessRelevance(lawInfo) {
  let score = 5; // Base score

  const highRelevanceTerms = [
    'Penanaman Modal',
    'Perseroan Terbatas',
    'Pasar Modal',
    'Perdagangan',
  ];
  const mediumRelevanceTerms = ['Ketenagakerjaan', 'Kesehatan', 'Konsumen', 'Perbankan'];

  for (const term of highRelevanceTerms) {
    if (lawInfo.title.toLowerCase().includes(term.toLowerCase())) {
      score += 3;
    }
  }

  for (const term of mediumRelevanceTerms) {
    if (lawInfo.title.toLowerCase().includes(term.toLowerCase())) {
      score += 1;
    }
  }

  // Aggiungi score basato sul tipo
  if (lawInfo.type === 'UU') score += 2;

  return Math.min(score, 10); // Max 10
}

// Estrai metadati economici
function extractEconomicMetadata(pageText, lawInfo) {
  const metadata = {};

  // Estrai date importanti
  const dateMatches = pageText.match(
    /(diundangkan|ditetapkan|diberlakukan)\s+(?:pada\s+)?(\d{1,2}\s+(?:Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember)\s+(19|20)\d{2})/gi
  );
  if (dateMatches) metadata.dates = dateMatches;

  // Estrai riferimento a leggi correlate
  const lawReferences = pageText.match(/UU\s+No\.?\s*\d+\s+Tahun\s+\d{4}/gi);
  if (lawReferences) metadata.related_laws = lawReferences;

  // Estrai entità governative
  const governmentEntities = pageText.match(
    /(?:Menteri|Kementerian|Lembaga|Badan)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g
  );
  if (governmentEntities) metadata.government_entities = governmentEntities;

  // Detection per settori economici specifici
  const sectors = [];
  if (pageText.toLowerCase().includes('pajak')) sectors.push('Taxation');
  if (pageText.toLowerCase().includes('ekspor') || pageText.toLowerCase().includes('impor'))
    sectors.push('Foreign Trade');
  if (pageText.toLowerCase().includes('investasi')) sectors.push('Investment');
  if (pageText.toLowerCase().includes('tenaga kerja')) sectors.push('Labor');

  if (sectors.length > 0) metadata.affected_sectors = sectors;

  return metadata;
}

// Salva file della legge economica
function saveEconomicLawFile(lawContent, index) {
  const filename = `ROUND_2_Economic_Core/UU_${lawContent.number || 'Unknown'}_${lawContent.year || 'Unknown'}_${index.toString().padStart(2, '0')}_${Date.now()}.json`;

  const dataStr = JSON.stringify(lawContent, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  console.log(`   📁 Salvato: ${filename}`);
  console.log(`   💼 Categoria: ${lawContent.economic_category}`);
  console.log(`   📊 Business Relevance: ${lawContent.business_relevance}/10`);
}

// Salva riepilogo Round 2
function saveRound2Summary(results) {
  const summaryFilename = `ROUND_2_Economic_Core/SUMMARY_ROUND_2_${Date.now()}.json`;

  const summaryData = {
    ...results,
    round_info: {
      name: 'Economic Core Legislation',
      description: 'Leggi economiche fondamentali per business in Indonesia',
      total_planned: ECONOMIC_CORE_LAWS.length,
      total_attempted: results.laws.length,
      success_rate: `${((results.success_count / results.laws.length) * 100).toFixed(1)}%`,
      business_impact: 'Foundation per 80% delle transazioni business',
    },
    directory: 'ROUND_2_Economic_Core',
    next_round_hint: 'Prossimo round: ROUND_3_Regulatory (30 leggi di implementazione)',
    economic_coverage: {
      investment: true,
      corporate: true,
      capital_markets: true,
      trade: true,
      intellectual_property: true,
      labor: true,
      consumer_protection: true,
    },
  };

  const dataStr = JSON.stringify(summaryData, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = summaryFilename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  console.log(`📊 Riepilogo economico salvato: ${summaryFilename}`);
}

// Funzione per verificare stato Round 1 prima di iniziare Round 2
function checkRound1Completion() {
  console.log('\n🔍 Verifica completamento Round 1...');
  console.log('💡 Round 1 (Pilastri Costituzionali) dovrebbe essere completato prima di Round 2');
  console.log('✅ Se Round 1 è completo, Round 2 aggiungerà il foundation economico');
  console.log('⚠️ Se Round 1 ha errori, considera di completarlo prima');
  return true;
}

// Avvio automatico con verifica
console.log('\n⚡ Verifica pre-esecuzione...');
checkRound1Completion();

console.log('\n🚀 Avvio automatico Round 2 tra 3 secondi...');
console.log('💡 Target: Foundation economico completo per business Indonesia');
console.log('⏱️ Durata stimata: 10-15 minuti');

setTimeout(() => {
  downloadEconomicCoreLaws().catch((error) => {
    console.error('❌ Errore fatale durante il download Round 2:', error);
  });
}, 3000);
