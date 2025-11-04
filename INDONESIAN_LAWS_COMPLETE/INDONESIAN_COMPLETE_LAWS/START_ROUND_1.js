/**
 * ROUND 1 - PILASTRI COSTITUZIONALI
 * Avvio immediato download delle 15 leggi fondamentali indonesiane
 *
 * ISTRUZIONI:
 * 1. Vai su https://peraturan.bpk.go.id
 * 2. Apri Dev Tools (F12)
 * 3. Incolla questo script
 * 4. Lo script partirà automaticamente
 */

console.log("🏛️ ROUND 1: PILASTRI COSTITUZIONALI INDONESIANI");
console.log("📋 Download automatico di 15 leggi fondamentali");

// Leggi Round 1 - PILASTRI COSTITUZIONALI
const CONSTITUTIONAL_LAWS = [
    { title: "UUD 1945", type: "UUD", keywords: ["UUD", "1945", "Undang-Undang Dasar", "Konstitusi"] },
    { title: "UU No. 39 Tahun 1999 Hak Asasi Manusia", type: "UU", keywords: ["39", "1999", "Hak Asasi Manusia", "HAM"] },
    { title: "UU No. 12 Tahun 2011 Pembentukan Peraturan", type: "UU", keywords: ["12", "2011", "Pembentukan Peraturan"] },
    { title: "UU No. 48 Tahun 2009 Kekuasaan Kehakiman", type: "UU", keywords: ["48", "2009", "Kekuasaan Kehakiman"] },
    { title: "UU No. 24 Tahun 2003 Mahkamah Konstitusi", type: "UU", keywords: ["24", "2003", "Mahkamah Konstitusi"] },
    { title: "UU No. 8 Tahun 1981 Hukum Acara Pidana", type: "UU", keywords: ["8", "1981", "Hukum Acara Pidana", "KUHAP"] },
    { title: "UU No. 4 Tahun 2004 Kekuasaan Kehakiman", type: "UU", keywords: ["4", "2004", "Kekuasaan Kehakiman"] },
    { title: "UU No. 39 Tahun 2008 Kementerian Negara", type: "UU", keywords: ["39", "2008", "Kementerian Negara"] },
    { title: "UU No. 37 Tahun 2008 Ombudsman", type: "UU", keywords: ["37", "2008", "Ombudsman"] },
    { title: "UU No. 7 Tahun 2011 Mata Uang", type: "UU", keywords: ["7", "2011", "Mata Uang"] },
    { title: "UU No. 9 Tahun 2011 Lembaga Penyiaran Publik", type: "UU", keywords: ["9", "2011", "Lembaga Penyiaran"] },
    { title: "UU No. 1 Tahun 2013 Lembaga Keuangan", type: "UU", keywords: ["1", "2013", "Lembaga Keuangan"] },
    { title: "UU No. 21 Tahun 2011 Otoritas Jasa Keuangan", type: "UU", keywords: ["21", "2011", "Otoritas Jasa Keuangan", "OJK"] },
    { title: "UU No. 20 Tahun 2008 UMKM", type: "UU", keywords: ["20", "2008", "UMKM", "Usaha Mikro"] },
    { title: "UU No. 3 Tahun 2014 Perindustrian", type: "UU", keywords: ["3", "2014", "Perindustrian"] }
];

// Funzione principale di download
async function downloadConstitutionalLaws() {
    console.log(`\n🚀 INIZIO DOWNLOAD PILASTRI COSTITUZIONALI`);
    console.log(`📊 Totale leggi: ${CONSTITUTIONAL_LAWS.length}`);
    console.log(`⏰ Inizio: ${new Date().toLocaleString()}`);

    const results = {
        round: "ROUND_1_Constitutional",
        started_at: new Date().toISOString(),
        laws: [],
        success_count: 0,
        error_count: 0
    };

    for (let i = 0; i < CONSTITUTIONAL_LAWS.length; i++) {
        const law = CONSTITUTIONAL_LAWS[i];
        console.log(`\n📄 ${i + 1}/${CONSTITUTIONAL_LAWS.length}: ${law.title}`);

        try {
            const result = await searchAndDownloadLaw(law, i + 1);
            results.laws.push(result);

            if (result.success) {
                results.success_count++;
                console.log(`✅ SUCCESS: ${result.title}`);
            } else {
                results.error_count++;
                console.log(`❌ ERROR: ${result.error}`);
            }

        } catch (error) {
            console.error(`❌ FATAL ERROR: ${error.message}`);
            results.laws.push({
                success: false,
                error: error.message,
                law: law
            });
            results.error_count++;
        }

        // Pausa tra le richieste
        if (i < CONSTITUTIONAL_LAWS.length - 1) {
            console.log("⏸️ Pausa di 4 secondi...");
            await new Promise(resolve => setTimeout(resolve, 4000));
        }
    }

    // Salva riepilogo finale
    results.completed_at = new Date().toISOString();
    const duration = Math.round((new Date(results.completed_at) - new Date(results.started_at)) / 1000);
    results.duration_seconds = duration;

    saveRoundSummary(results);

    console.log(`\n🎉 ROUND 1 COMPLETATO!`);
    console.log(`✅ Successi: ${results.success_count}/${CONSTITUTIONAL_LAWS.length}`);
    console.log(`❌ Errori: ${results.error_count}/${CONSTITUTIONAL_LAWS.length}`);
    console.log(`⏱️ Durata totale: ${duration} secondi`);
    console.log(`📁 Tutti i file salvati nella cartella ROUND_1_Constitutional`);

    return results;
}

// Funzione per cercare e scaricare una legge specifica
async function searchAndDownloadLaw(lawInfo, index) {
    try {
        // Naviga alla pagina di ricerca
        if (!window.location.href.includes('peraturan.bpk.go.id')) {
            window.location.href = 'https://peraturan.bpk.go.id/Search';
            await new Promise(resolve => setTimeout(resolve, 3000));
        }

        // Cerca il campo di ricerca
        const searchInput = document.querySelector('input[type="text"], input[name="q"], #search');
        if (searchInput) {
            // Pulisci e compila il campo
            searchInput.value = '';
            searchInput.focus();

            // Inserisci il titolo della legge
            searchInput.value = lawInfo.title;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 500));

            // Cerca il pulsante di ricerca
            const searchButton = document.querySelector('button[type="submit"], input[type="submit"], .search-btn');
            if (searchButton) {
                searchButton.click();
                await new Promise(resolve => setTimeout(resolve, 3000));
            } else {
                // Prova con Enter
                searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        // Analizza i risultati
        await new Promise(resolve => setTimeout(resolve, 2000));
        const lawLinks = Array.from(document.querySelectorAll('a[href*="/Detail/"]'));

        if (lawLinks.length === 0) {
            return {
                success: false,
                error: 'Nessun risultato trovato',
                law: lawInfo,
                index: index
            };
        }

        // Trova il link più rilevante
        let bestMatch = null;
        let bestScore = 0;

        for (const link of lawLinks) {
            const linkText = link.textContent.toLowerCase();
            let score = 0;

            // Calcola score basato sulle keyword
            for (const keyword of lawInfo.keywords) {
                if (linkText.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            }

            // Bonus per tipo esatto
            if (linkText.includes(lawInfo.type.toLowerCase())) {
                score += 5;
            }

            // Bonus per anno
            const yearMatch = linkText.match(/(19|20)\d{2}/);
            if (yearMatch && lawInfo.title.includes(yearMatch[1])) {
                score += 3;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = link;
            }
        }

        if (bestMatch && bestScore > 10) {
            console.log(`   🔗 Trovato: ${bestMatch.textContent.trim()} (score: ${bestScore})`);

            // Clicca sul link
            bestMatch.click();
            await new Promise(resolve => setTimeout(resolve, 3000));

            // Estrai contenuto
            const lawContent = extractLawContent(lawInfo, index);

            // Salva il file
            saveLawFile(lawContent, index);

            return {
                success: true,
                title: lawContent.title,
                law: lawInfo,
                index: index,
                content: lawContent
            };

        } else {
            return {
                success: false,
                error: `Nessun match trovato (best score: ${bestScore})`,
                law: lawInfo,
                index: index,
                found_results: lawLinks.length
            };
        }

    } catch (error) {
        return {
            success: false,
            error: error.message,
            law: lawInfo,
            index: index
        };
    }
}

// Estrai contenuto dalla pagina dettaglio
function extractLawContent(lawInfo, index) {
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
        search_info: lawInfo
    };

    // Estrai titolo
    const titleElements = document.querySelectorAll('h1, .title, .judul, [class*="title"]');
    for (const element of titleElements) {
        const text = element.textContent.trim();
        if (text.length > 10) {
            content.title = text;
            break;
        }
    }

    // Estrai numero e anno
    const pageText = document.body.textContent;
    const numberMatch = pageText.match(/No\.?\s*(\d+)/i);
    const yearMatch = pageText.match(/(19|20)\d{2}/);

    if (numberMatch) content.number = numberMatch[1];
    if (yearMatch) content.year = yearMatch[1];

    // Estrai status
    if (pageText.includes('Berlaku')) content.status = 'BERLAKU';
    else if (pageText.includes('Dicabut')) content.status = 'DICABUT';
    else if (pageText.includes('Tidak Berlaku')) content.status = 'TIDAK_BERLAKU';
    else content.status = 'UNKNOWN';

    // Estrai contenuto principale
    const contentSelectors = [
        'div[class*="content"]',
        'div[class*="isi"]',
        'div[class*="detail"]',
        'main',
        'article'
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

    // Se non trovato contenuto specifico, prendi tutto il testo body
    if (bestContent.length < 500) {
        bestContent = document.body.textContent;
    }

    content.content = bestContent.substring(0, 10000); // Limita a 10k caratteri

    // Estrai metadati aggiuntivi
    const infoRows = document.querySelectorAll('tr, .row, [class*="info"]');
    for (const row of infoRows) {
        const text = row.textContent.trim();
        if (text.includes('Diundangkan') || text.includes('Ditetapkan')) {
            content.metadata.promulgation = text;
        }
        if (text.includes('Berlaku') || text.includes('Mulai')) {
            content.metadata.effective_date = text;
        }
    }

    return content;
}

// Salva file della legge
function saveLawFile(lawContent, index) {
    const filename = `ROUND_1_Constitutional/UU_${lawContent.number || 'Unknown'}_${lawContent.year || 'Unknown'}_${index.toString().padStart(2, '0')}_${Date.now()}.json`;

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
}

// Salva riepilogo del round
function saveRoundSummary(results) {
    const summaryFilename = `ROUND_1_Constitutional/SUMMARY_ROUND_1_${Date.now()}.json`;

    const summaryData = {
        ...results,
        round_info: {
            name: "Pilastri Costituzionali",
            description: "Leggi fondamentali della Repubblica Indonesia",
            total_planned: CONSTITUTIONAL_LAWS.length,
            total_attempted: results.laws.length,
            success_rate: `${((results.success_count / results.laws.length) * 100).toFixed(1)}%`
        },
        directory: "ROUND_1_Constitutional",
        next_round_hint: "Prossimo round: ROUND_2_Economic_Core (Leggi Economiche Fondamentali)"
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
    console.log(`📊 Riepilogo salvato: ${summaryFilename}`);
}

// Avvio automatico
console.log("\n⚡ Avvio automatico del Round 1 tra 3 secondi...");
console.log("Per interrompere: Ctrl+C o chiudi la console");

setTimeout(() => {
    downloadConstitutionalLaws().catch(error => {
        console.error("❌ Errore fatale durante il download:", error);
    });
}, 3000);