/**
 * EXECUTE ROUNDS 1 & 2 - FOUNDATION COMPLETE
 * Esegue Round 1 (Costituzionale) e Round 2 (Economic Core) in sequenza
 *
 * ISTRUZIONI:
 * 1. Vai su https://peraturan.bpk.go.id
 * 2. Apri Dev Tools (F12)
 * 3. Incolla questo script
 * 4. Lo script partirà automaticamente
 */

console.log("🏛️💰 EXECUTE ROUNDS 1 & 2 - FOUNDATION COMPLETE");
console.log("📋 Round 1: 15 leggi costituzionali + Round 2: 25 leggi economiche");
console.log("🎯 Target: Foundation legale ed economica completa (40 leggi)");

// Funzione per attendere
function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Funzione per caricare script esterno
function loadScript(scriptContent) {
    return new Promise((resolve, reject) => {
        try {
            eval(scriptContent);
            resolve();
        } catch (error) {
            reject(error);
        }
    });
}

// Funzione per leggere contenuto file (simulato)
async function getScriptContent(filename) {
    console.log(`📖 Loading ${filename}...`);

    // Round 1 Script Content
    if (filename === 'ROUND_1') {
        return `
const CONSTITUTIONAL_LAWS = [
    { title: "UUD 1945", type: "UUD", keywords: ["UUD", "1945", "Undang-Undang Dasar"] },
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
    { title: "UU No. 21 Tahun 2011 Otoritas Jasa Keuangan", type: "UU", keywords: ["21", "2011", "OJK"] },
    { title: "UU No. 20 Tahun 2008 UMKM", type: "UU", keywords: ["20", "2008", "UMKM"] },
    { title: "UU No. 3 Tahun 2014 Perindustrian", type: "UU", keywords: ["3", "2014", "Perindustrian"] }
];

async function downloadConstitutionalLaws() {
    console.log("🏛️ ROUND 1: Download pilastri costituzionali");
    const results = { success_count: 0, error_count: 0, laws: [] };

    for (let i = 0; i < CONSTITUTIONAL_LAWS.length; i++) {
        const law = CONSTITUTIONAL_LAWS[i];
        console.log(\`📄 \${i + 1}/\${CONSTITUTIONAL_LAWS.length}: \${law.title}\`);

        try {
            const result = await searchAndDownloadLaw(law, i + 1, "ROUND_1_Constitutional");
            results.laws.push(result);
            if (result.success) {
                results.success_count++;
                console.log("✅ SUCCESS");
            } else {
                results.error_count++;
                console.log("❌ ERROR");
            }
        } catch (error) {
            results.error_count++;
            console.log("❌ FATAL ERROR");
        }

        if (i < CONSTITUTIONAL_LAWS.length - 1) {
            await wait(4000);
        }
    }

    saveRoundSummary(results, "ROUND_1_Constitutional", "Pilastri Costituzionali");
    return results;
}
        `;
    }

    // Round 2 Script Content
    else if (filename === 'ROUND_2') {
        return `
const ECONOMIC_CORE_LAWS = [
    { title: "UU No. 7 Tahun 2014 Perdagangan", type: "UU", keywords: ["7", "2014", "Perdagangan"] },
    { title: "UU No. 25 Tahun 2007 Penanaman Modal", type: "UU", keywords: ["25", "2007", "Penanaman Modal"] },
    { title: "UU No. 40 Tahun 2007 Perseroan Terbatas", type: "UU", keywords: ["40", "2007", "Perseroan Terbatas"] },
    { title: "UU No. 8 Tahun 1995 Pasar Modal", type: "UU", keywords: ["8", "1995", "Pasar Modal"] },
    { title: "UU No. 19 Tahun 2003 BUMN", type: "UU", keywords: ["19", "2003", "BUMN"] },
    { title: "UU No. 36 Tahun 2008 Ketenagakerjaan", type: "UU", keywords: ["36", "2008", "Ketenagakerjaan"] },
    { title: "UU No. 28 Tahun 2008 Kesehatan", type: "UU", keywords: ["28", "2008", "Kesehatan"] },
    { title: "UU No. 23 Tahun 2014 Pemerintahan Daerah", type: "UU", keywords: ["23", "2014", "Pemerintahan Daerah"] },
    { title: "UU No. 33 Tahun 2004 Perimbangan Keuangan", type: "UU", keywords: ["33", "2004", "Perimbangan Keuangan"] },
    { title: "UU No. 17 Tahun 2003 Keuangan Negara", type: "UU", keywords: ["17", "2003", "Keuangan Negara"] },
    { title: "UU No. 1 Tahun 2004 Perbendaharaan Negara", type: "UU", keywords: ["1", "2004", "Perbendaharaan Negara"] },
    { title: "UU No. 15 Tahun 2001 Merek", type: "UU", keywords: ["15", "2001", "Merek"] },
    { title: "UU No. 14 Tahun 2001 Paten", type: "UU", keywords: ["14", "2001", "Paten"] },
    { title: "UU No. 31 Tahun 2000 Desain Industri", type: "UU", keywords: ["31", "2000", "Desain Industri"] },
    { title: "UU No. 19 Tahun 2002 Hak Cipta", type: "UU", keywords: ["19", "2002", "Hak Cipta"] },
    { title: "UU No. 30 Tahun 2000 Rahasia Dagang", type: "UU", keywords: ["30", "2000", "Rahasia Dagang"] },
    { title: "UU No. 20 Tahun 2008 UMKM", type: "UU", keywords: ["20", "2008", "UMKM"] },
    { title: "UU No. 1 Tahun 2013 Lembaga Keuangan", type: "UU", keywords: ["1", "2013", "Lembaga Keuangan"] },
    { title: "UU No. 21 Tahun 2011 OJK", type: "UU", keywords: ["21", "2011", "OJK"] },
    { title: "UU No. 42 Tahun 1999 Perlindungan Konsumen", type: "UU", keywords: ["42", "1999", "Perlindungan Konsumen"] },
    { title: "UU No. 10 Tahun 1998 Perbankan", type: "UU", keywords: ["10", "1998", "Perbankan"] },
    { title: "UU No. 32 Tahun 2004 Pemerintahan Daerah", type: "UU", keywords: ["32", "2004", "Pemerintahan Daerah"] },
    { title: "UU No. 11 Tahun 2008 ITE", type: "UU", keywords: ["11", "2008", "ITE"] },
    { title: "UU No. 40 Tahun 2004 SJSN", type: "UU", keywords: ["40", "2004", "SJSN"] },
    { title: "UU No. 24 Tahun 2011 BPJS", type: "UU", keywords: ["24", "2011", "BPJS"] }
];

async function downloadEconomicCoreLaws() {
    console.log("💰 ROUND 2: Download leggi economiche fondamentali");
    const results = { success_count: 0, error_count: 0, laws: [] };

    for (let i = 0; i < ECONOMIC_CORE_LAWS.length; i++) {
        const law = ECONOMIC_CORE_LAWS[i];
        console.log(\`📄 \${i + 1}/\${ECONOMIC_CORE_LAWS.length}: \${law.title}\`);

        try {
            const result = await searchAndDownloadLaw(law, i + 1, "ROUND_2_Economic_Core");
            results.laws.push(result);
            if (result.success) {
                results.success_count++;
                console.log("✅ SUCCESS");
            } else {
                results.error_count++;
                console.log("❌ ERROR");
            }
        } catch (error) {
            results.error_count++;
            console.log("❌ FATAL ERROR");
        }

        if (i < ECONOMIC_CORE_LAWS.length - 1) {
            await wait(4000);
        }
    }

    saveRoundSummary(results, "ROUND_2_Economic_Core", "Economic Core Legislation");
    return results;
}
        `;
    }

    return '';
}

// Funzione generica per cercare e scaricare
async function searchAndDownloadLaw(lawInfo, index, directory) {
    try {
        // Naviga alla pagina di ricerca
        if (!window.location.href.includes('peraturan.bpk.go.id')) {
            window.location.href = 'https://peraturan.bpk.go.id/Search';
            await wait(3000);
        }

        // Cerca il campo di ricerca
        const searchInput = document.querySelector('input[type="text"], input[name="q"], #search');
        if (searchInput) {
            searchInput.value = '';
            searchInput.focus();
            searchInput.value = lawInfo.title;
            searchInput.dispatchEvent(new Event('input', { bubbles: true }));
            await wait(500);

            // Esegui ricerca
            const searchButton = document.querySelector('button[type="submit"], input[type="submit"]');
            if (searchButton) {
                searchButton.click();
            } else {
                searchInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
            }
            await wait(3000);
        }

        // Analizza risultati
        const lawLinks = Array.from(document.querySelectorAll('a[href*="/Detail/"]'));

        if (lawLinks.length === 0) {
            return {
                success: false,
                error: 'Nessun risultato trovato',
                law: lawInfo,
                index: index
            };
        }

        // Trova il link migliore
        let bestMatch = null;
        let bestScore = 0;

        for (const link of lawLinks) {
            const linkText = link.textContent.toLowerCase();
            let score = 0;

            for (const keyword of lawInfo.keywords) {
                if (linkText.includes(keyword.toLowerCase())) {
                    score += 10;
                }
            }

            if (linkText.includes(lawInfo.type.toLowerCase())) {
                score += 5;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMatch = link;
            }
        }

        if (bestMatch && bestScore > 10) {
            console.log(`   🔗 Trovato: ${bestMatch.textContent.trim()} (score: ${bestScore})`);

            bestMatch.click();
            await wait(3000);

            const lawContent = extractLawContent(lawInfo, index, directory);
            saveLawFile(lawContent, index, directory);

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

// Estrai contenuto
function extractLawContent(lawInfo, index, directory) {
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
        directory: directory
    };

    // Estrai titolo
    const titleElements = document.querySelectorAll('h1, .title, .judul');
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

    // Estrai contenuto
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

    if (bestContent.length < 500) {
        bestContent = document.body.textContent;
    }

    content.content = bestContent.substring(0, 10000);

    return content;
}

// Salva file
function saveLawFile(lawContent, index, directory) {
    const filename = `${directory}/UU_${lawContent.number || 'Unknown'}_${lawContent.year || 'Unknown'}_${index.toString().padStart(2, '0')}_${Date.now()}.json`;

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

// Salva riepilogo
function saveRoundSummary(results, directory, description) {
    const summaryFilename = `${directory}/SUMMARY_${Date.now()}.json`;

    const summaryData = {
        ...results,
        round_info: {
            name: description,
            directory: directory,
            total_planned: results.laws.length,
            success_rate: `${((results.success_count / results.laws.length) * 100).toFixed(1)}%`
        }
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
}

// Esecuzione principale
async function executeRounds1and2() {
    console.log("🚀 INIZIO EXECUTION ROUNDS 1 & 2");
    console.log("📊 Target: 40 leggi fondamentali (15 costituzionali + 25 economiche)");
    console.log("⏰ Orario inizio: " + new Date().toLocaleString());

    const overallResults = {
        started_at: new Date().toISOString(),
        rounds: {},
        total_success: 0,
        total_error: 0
    };

    // ESEGUI ROUND 1
    console.log("\n" + "=".repeat(60));
    console.log("🏛️ ROUND 1: PILASTRI COSTITUZIONALI");
    console.log("=".repeat(60));

    const round1Script = await getScriptContent('ROUND_1');
    eval(round1Script);

    const round1Results = await downloadConstitutionalLaws();
    overallResults.rounds.ROUND_1 = round1Results;
    overallResults.total_success += round1Results.success_count;
    overallResults.total_error += round1Results.error_count;

    console.log(`\n🎉 ROUND 1 COMPLETATO!`);
    console.log(`✅ Successi: ${round1Results.success_count}/15`);
    console.log(`❌ Errori: ${round1Results.error_count}/15`);

    // Pausa tra i round
    console.log("\n⏸️ Pausa di 10 secondi prima di Round 2...");
    await wait(10000);

    // ESEGUI ROUND 2
    console.log("\n" + "=".repeat(60));
    console.log("💰 ROUND 2: ECONOMIC CORE LEGISLATION");
    console.log("=".repeat(60));

    const round2Script = await getScriptContent('ROUND_2');
    eval(round2Script);

    const round2Results = await downloadEconomicCoreLaws();
    overallResults.rounds.ROUND_2 = round2Results;
    overallResults.total_success += round2Results.success_count;
    overallResults.total_error += round2Results.error_count;

    console.log(`\n🎉 ROUND 2 COMPLETATO!`);
    console.log(`✅ Successi: ${round2Results.success_count}/25`);
    console.log(`❌ Errori: ${round2Results.error_count}/25`);

    // RIEPILOGO FINALE
    overallResults.completed_at = new Date().toISOString();
    overallResults.total_duration = Math.round((new Date(overallResults.completed_at) - new Date(overallResults.started_at)) / 1000);
    overallResults.total_laws = 40;
    overallResults.overall_success_rate = `${((overallResults.total_success / overallResults.total_laws) * 100).toFixed(1)}%`;

    // Salva riepilogo combinato
    saveCombinedSummary(overallResults);

    console.log("\n" + "🎉".repeat(30));
    console.log("🏆 ROUNDS 1 & 2 COMPLETATI!");
    console.log("🎉".repeat(30));
    console.log(`📊 Statistiche Finali:`);
    console.log(`   ✅ Successi totali: ${overallResults.total_success}/40`);
    console.log(`   ❌ Errori totali: ${overallResults.total_error}/40`);
    console.log(`   📈 Success rate: ${overallResults.overall_success_rate}`);
    console.log(`   ⏱️ Durata totale: ${overallResults.total_duration} secondi`);
    console.log(`   📁 Directory: ROUND_1_Constitutional + ROUND_2_Economic_Core`);
    console.log(`\n💡 Risultato:`);
    console.log(`   🏛️ Foundation legale completa (costituzionale)`);
    console.log(`   💰 Foundation economica completa (business)`);
    console.log(`   🎯 Base solida per business in Indonesia!`);
    console.log(`\n🚀 Prossimo passi consigliati:`);
    console.log(`   1. Verifica i file scaricati`);
    console.log(`   2. Procedi con Round 3 (Regulatory Framework)`);
    console.log(`   3. Integra con sistema di ricerca`);

    return overallResults;
}

// Salva riepilogo combinato
function saveCombinedSummary(results) {
    const filename = `FOUNDATION_COMPLETE_SUMMARY_${Date.now()}.json`;

    const summaryData = {
        ...results,
        foundation_summary: {
            constitutional_laws: results.rounds.ROUND_1?.success_count || 0,
            economic_laws: results.rounds.ROUND_2?.success_count || 0,
            total_foundation: results.total_success,
            foundation_type: "Complete Legal & Economic Foundation",
            business_ready: results.total_success >= 30,
            coverage_percentage: overallResults.overall_success_rate
        },
        next_steps: [
            "Verifica tutti i file nella cartella Downloads",
            "Procedi con Round 3: Regulatory Framework (30 leggi)",
            "Integra sistema di ricerca avanzato",
            "Considera aggiunta giurisprudenza"
        ]
    };

    const dataStr = JSON.stringify(summaryData, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    URL.revokeObjectURL(url);
    console.log(`📊 Riepilogo completo salvato: ${filename}`);
}

// Avvio automatico
console.log("\n⚡ Avvio automatico Rounds 1 & 2 tra 3 secondi...");
console.log("📋 Saranno scaricate 40 leggi fondamentali");
console.log("⏱️ Durata stimata: 15-25 minuti");

setTimeout(() => {
    executeRounds1and2().catch(error => {
        console.error("❌ Errore fatale durante l'esecuzione:", error);
    });
}, 3000);