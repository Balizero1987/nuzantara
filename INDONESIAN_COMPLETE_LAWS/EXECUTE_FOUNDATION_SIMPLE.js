/**
 * SIMPLE FOUNDATION EXECUTOR - Round 1 + Round 2
 * Versione semplificata per evitare errori di sintassi
 *
 * ISTRUZIONI:
 * 1. Vai su https://peraturan.bpk.go.id
 * 2. Apri Dev Tools (F12)
 * 3. Incolla questo script
 * 4. Lo script partirà automaticamente
 */

console.log('🏛️💰 FOUNDATION EXECUTOR - ROUND 1 + 2');
console.log('📋 Target: 40 leggi fondamentali (15 costituzionali + 25 economiche)');

// Funzione di attesa
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Funzione di ricerca base
function searchLaw(lawInfo) {
  return new Promise((resolve) => {
    console.log(`🔍 Searching: ${lawInfo.title}`);

    try {
      // Compila campo ricerca
      const searchInput = document.querySelector('input[type="text"], input[name="q"], #search');
      if (searchInput) {
        searchInput.value = lawInfo.title;
        searchInput.focus();

        // Simula input
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));

        // Cerca pulsante search
        setTimeout(() => {
          const searchButton = document.querySelector(
            'button[type="submit"], input[type="submit"]'
          );
          if (searchButton) {
            searchButton.click();
          } else {
            searchInput.dispatchEvent(
              new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
            );
          }
        }, 500);
      }

      // Aspetta risultati
      setTimeout(() => {
        const lawLinks = Array.from(document.querySelectorAll('a[href*="/Detail/"]'));

        if (lawLinks.length > 0) {
          // Trova miglior match
          let bestMatch = null;
          let bestScore = 0;

          for (const link of lawLinks) {
            const linkText = link.textContent.toLowerCase();
            let score = 0;

            // Score basato su keywords
            for (const keyword of lawInfo.keywords) {
              if (linkText.includes(keyword.toLowerCase())) {
                score += 10;
              }
            }

            // Bonus per tipo
            if (linkText.includes(lawInfo.type.toLowerCase())) {
              score += 5;
            }

            if (score > bestScore) {
              bestScore = score;
              bestMatch = link;
            }
          }

          if (bestMatch && bestScore > 10) {
            console.log(`   ✅ Found: ${bestMatch.textContent.trim()}`);
            resolve({ success: true, link: bestMatch, score: bestScore });
          } else {
            console.log(`   ❌ No good match found (best score: ${bestScore})`);
            resolve({ success: false, error: 'No match found' });
          }
        } else {
          console.log(`   ❌ No results found`);
          resolve({ success: false, error: 'No results found' });
        }
      }, 3000);
    } catch (error) {
      console.error(`   ❌ Search error: ${error.message}`);
      resolve({ success: false, error: error.message });
    }
  });
}

// Funzione per scaricare una legge
function downloadLaw(lawInfo, index, directory) {
  return new Promise((resolve) => {
    searchLaw(lawInfo).then((result) => {
      if (result.success) {
        // Clicca sul link
        result.link.click();

        setTimeout(() => {
          // Estrai contenuto
          const content = extractContent(lawInfo, index, directory);

          // Salva file
          saveFile(content, directory);

          resolve({ ...result, content: content });
        }, 3000);
      } else {
        resolve(result);
      }
    });
  });
}

// Estrai contenuto
function extractContent(lawInfo, index, directory) {
  const content = {
    id: index,
    title: '',
    type: lawInfo.type,
    number: '',
    year: '',
    status: '',
    content: '',
    url: window.location.href,
    scraped_at: new Date().toISOString(),
    keywords: lawInfo.keywords,
    directory: directory,
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

  // Status
  if (pageText.includes('Berlaku')) content.status = 'BERLAKU';
  else if (pageText.includes('Dicabut')) content.status = 'DICABUT';
  else if (pageText.includes('Tidak Berlaku')) content.status = 'TIDAK_BERLAKU';
  else content.status = 'UNKNOWN';

  // Contenuto principale
  const contentElements = document.querySelectorAll(
    'div[class*="content"], div[class*="isi"], main, article'
  );
  let bestContent = '';

  for (const element of contentElements) {
    const text = element.textContent.trim();
    if (text.length > bestContent.length) {
      bestContent = text;
    }
  }

  if (bestContent.length < 500) {
    bestContent = document.body.textContent;
  }

  content.content = bestContent.substring(0, 10000);

  return content;
}

// Salva file
function saveFile(content, directory) {
  const filename = `${directory}/UU_${content.number || 'Unknown'}_${content.year || 'Unknown'}_${content.id.toString().padStart(2, '0')}_${Date.now()}.json`;

  const dataStr = JSON.stringify(content, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  URL.revokeObjectURL(url);
  console.log(`   📁 Saved: ${filename}`);
}

// Leggi Round 1
const ROUND_1_LAWS = [
  { title: 'UUD 1945', type: 'UUD', keywords: ['UUD', '1945'] },
  { title: 'UU No. 39 Tahun 1999 Hak Asasi Manusia', type: 'UU', keywords: ['39', '1999', 'HAM'] },
  { title: 'UU No. 12 Tahun 2011 Pembentukan Peraturan', type: 'UU', keywords: ['12', '2011'] },
  { title: 'UU No. 48 Tahun 2009 Kekuasaan Kehakiman', type: 'UU', keywords: ['48', '2009'] },
  { title: 'UU No. 24 Tahun 2003 Mahkamah Konstitusi', type: 'UU', keywords: ['24', '2003'] },
  { title: 'UU No. 8 Tahun 1981 Hukum Acara Pidana', type: 'UU', keywords: ['8', '1981', 'KUHAP'] },
  { title: 'UU No. 4 Tahun 2004 Kekuasaan Kehakiman', type: 'UU', keywords: ['4', '2004'] },
  { title: 'UU No. 39 Tahun 2008 Kementerian Negara', type: 'UU', keywords: ['39', '2008'] },
  { title: 'UU No. 37 Tahun 2008 Ombudsman', type: 'UU', keywords: ['37', '2008'] },
  { title: 'UU No. 7 Tahun 2011 Mata Uang', type: 'UU', keywords: ['7', '2011'] },
  { title: 'UU No. 9 Tahun 2011 Lembaga Penyiaran Publik', type: 'UU', keywords: ['9', '2011'] },
  { title: 'UU No. 1 Tahun 2013 Lembaga Keuangan', type: 'UU', keywords: ['1', '2013'] },
  { title: 'UU No. 21 Tahun 2011 OJK', type: 'UU', keywords: ['21', '2011', 'OJK'] },
  { title: 'UU No. 20 Tahun 2008 UMKM', type: 'UU', keywords: ['20', '2008'] },
  { title: 'UU No. 3 Tahun 2014 Perindustrian', type: 'UU', keywords: ['3', '2014'] },
];

// Leggi Round 2
const ROUND_2_LAWS = [
  { title: 'UU No. 7 Tahun 2014 Perdagangan', type: 'UU', keywords: ['7', '2014'] },
  { title: 'UU No. 25 Tahun 2007 Penanaman Modal', type: 'UU', keywords: ['25', '2007'] },
  { title: 'UU No. 40 Tahun 2007 Perseroan Terbatas', type: 'UU', keywords: ['40', '2007', 'PT'] },
  { title: 'UU No. 8 Tahun 1995 Pasar Modal', type: 'UU', keywords: ['8', '1995'] },
  { title: 'UU No. 19 Tahun 2003 BUMN', type: 'UU', keywords: ['19', '2003'] },
  { title: 'UU No. 36 Tahun 2008 Ketenagakerjaan', type: 'UU', keywords: ['36', '2008'] },
  { title: 'UU No. 28 Tahun 2008 Kesehatan', type: 'UU', keywords: ['28', '2008'] },
  { title: 'UU No. 23 Tahun 2014 Pemerintahan Daerah', type: 'UU', keywords: ['23', '2014'] },
  { title: 'UU No. 33 Tahun 2004 Perimbangan Keuangan', type: 'UU', keywords: ['33', '2004'] },
  { title: 'UU No. 17 Tahun 2003 Keuangan Negara', type: 'UU', keywords: ['17', '2003'] },
  { title: 'UU No. 1 Tahun 2004 Perbendaharaan Negara', type: 'UU', keywords: ['1', '2004'] },
  { title: 'UU No. 15 Tahun 2001 Merek', type: 'UU', keywords: ['15', '2001'] },
  { title: 'UU No. 14 Tahun 2001 Paten', type: 'UU', keywords: ['14', '2001'] },
  { title: 'UU No. 31 Tahun 2000 Desain Industri', type: 'UU', keywords: ['31', '2000'] },
  { title: 'UU No. 19 Tahun 2002 Hak Cipta', type: 'UU', keywords: ['19', '2002'] },
  { title: 'UU No. 30 Tahun 2000 Rahasia Dagang', type: 'UU', keywords: ['30', '2000'] },
  { title: 'UU No. 20 Tahun 2008 UMKM', type: 'UU', keywords: ['20', '2008'] },
  { title: 'UU No. 1 Tahun 2013 Lembaga Keuangan', type: 'UU', keywords: ['1', '2013'] },
  { title: 'UU No. 21 Tahun 2011 OJK', type: 'UU', keywords: ['21', '2011'] },
  { title: 'UU No. 42 Tahun 1999 Perlindungan Konsumen', type: 'UU', keywords: ['42', '1999'] },
  { title: 'UU No. 10 Tahun 1998 Perbankan', type: 'UU', keywords: ['10', '1998'] },
  { title: 'UU No. 32 Tahun 2004 Pemerintahan Daerah', type: 'UU', keywords: ['32', '2004'] },
  { title: 'UU No. 11 Tahun 2008 ITE', type: 'UU', keywords: ['11', '2008'] },
  { title: 'UU No. 40 Tahun 2004 SJSN', type: 'UU', keywords: ['40', '2004'] },
  { title: 'UU No. 24 Tahun 2011 BPJS', type: 'UU', keywords: ['24', '2011'] },
];

// Funzione principale
async function executeFoundationDownload() {
  console.log('🚀 STARTING FOUNDATION DOWNLOAD');
  console.log('📊 Target: 40 leggi totali');
  console.log('⏰ Started: ' + new Date().toLocaleString());

  const results = {
    started: new Date().toISOString(),
    round1: { success: 0, errors: 0 },
    round2: { success: 0, errors: 0 },
  };

  // ROUND 1
  console.log('\n' + '='.repeat(50));
  console.log('🏛️ ROUND 1: CONSTITUTIONAL LAWS');
  console.log('='.repeat(50));

  for (let i = 0; i < ROUND_1_LAWS.length; i++) {
    const law = ROUND_1_LAWS[i];
    console.log(`📄 ${i + 1}/15: ${law.title}`);

    const result = await downloadLaw(law, i + 1, 'ROUND_1_Constitutional');
    if (result.success) {
      results.round1.success++;
      console.log('   ✅ SUCCESS');
    } else {
      results.round1.errors++;
      console.log(`   ❌ ERROR: ${result.error}`);
    }

    if (i < ROUND_1_LAWS.length - 1) {
      console.log('   ⏸️ Waiting 4 seconds...');
      await wait(4000);
    }
  }

  console.log(`\n🎉 ROUND 1 COMPLETE!`);
  console.log(`✅ Success: ${results.round1.success}/15`);
  console.log(`❌ Errors: ${results.round1.errors}/15`);

  // Pausa tra i round
  console.log('\n⏸️ 10 second pause before Round 2...');
  await wait(10000);

  // ROUND 2
  console.log('\n' + '='.repeat(50));
  console.log('💰 ROUND 2: ECONOMIC CORE LAWS');
  console.log('='.repeat(50));

  for (let i = 0; i < ROUND_2_LAWS.length; i++) {
    const law = ROUND_2_LAWS[i];
    console.log(`📄 ${i + 1}/25: ${law.title}`);

    const result = await downloadLaw(law, i + 16, 'ROUND_2_Economic_Core');
    if (result.success) {
      results.round2.success++;
      console.log('   ✅ SUCCESS');
    } else {
      results.round2.errors++;
      console.log(`   ❌ ERROR: ${result.error}`);
    }

    if (i < ROUND_2_LAWS.length - 1) {
      console.log('   ⏸️ Waiting 4 seconds...');
      await wait(4000);
    }
  }

  // Final summary
  const totalSuccess = results.round1.success + results.round2.success;
  const totalErrors = results.round1.errors + results.round2.errors;
  const duration = Math.round((new Date() - new Date(results.started)) / 1000);

  console.log('\n' + '🎉'.repeat(40));
  console.log('🏆 FOUNDATION COMPLETE!');
  console.log('🎉'.repeat(40));
  console.log(`📊 FINAL RESULTS:`);
  console.log(`   ✅ Total Success: ${totalSuccess}/40`);
  console.log(`   ❌ Total Errors: ${totalErrors}/40`);
  console.log(`   📈 Success Rate: ${((totalSuccess / 40) * 100).toFixed(1)}%`);
  console.log(`   ⏱️ Duration: ${duration} seconds`);
  console.log(`   📁 Files saved in Downloads folder`);
  console.log(`\n💡 You now have:`);
  console.log(`   🏛️ Complete legal foundation`);
  console.log(`   💰 Complete economic foundation`);
  console.log(`   🎯 Solid base for Indonesia business!`);

  return results;
}

// Avvio automatico
console.log('\n⚡ Starting in 3 seconds...');
console.log('🎯 This will download 40 fundamental Indonesian laws');
console.log('⚠️ Keep this tab open until completion!');

setTimeout(() => {
  executeFoundationDownload();
}, 3000);
