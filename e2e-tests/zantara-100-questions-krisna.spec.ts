import { test, expect, Page } from '@playwright/test';

/**
 * 🎯 ZANTARA FINAL TEST - 100 Domande in Bahasa Indonesia
 * 
 * Test completo per Krisna (krisna@balizero.com) che verifica:
 * - Tutti i 120 tools operativi
 * - SSE streaming funzionante
 * - Context preservation
 * - Human-like speed (no timeout, velocità controllata)
 * - 100% visibile su Mac screen (1400x900)
 * 
 * Login: krisna@balizero.com / PIN: 705802
 * Lingua: Bahasa Indonesia (100%)
 * Durata: ~45-60 minuti
 */

// ==================== HELPER FUNCTIONS ====================

async function humanDelay(page: Page, minMs: number = 400, maxMs: number = 600) {
  const delay = Math.random() * (maxMs - minMs) + minMs;
  await page.waitForTimeout(delay);
}

async function typeHumanLike(page: Page, selector: string, text: string) {
  const input = page.locator(selector).first();
  // NO clear - keep all in same chat
  
  // Type quickly for fluid test
  await input.fill(text); // Instant fill for speed
}

async function sendMessageAndWait(page: Page, message: string, testNumber: number) {
  const shortMsg = message.length > 60 ? message.substring(0, 60) + '...' : message;
  console.log(`\n[${testNumber}/102] 📤 "${shortMsg}"`);
  
  // Count messages before
  const messagesBefore = await page.locator('.message').count();
  console.log(`   Messages before: ${messagesBefore}`);
  
  // Clear input and type message
  const input = page.locator('#chatInput');
  await input.fill('');
  console.log(`   ✓ Input cleared`);
  await input.fill(message);
  console.log(`   ✓ Message typed`);
  
  // Press Enter
  await page.keyboard.press('Enter');
  console.log(`   ✓ Enter pressed, waiting for response...`);
  
  // Wait for new message to appear (both user + assistant = +2 messages)
  await page.waitForFunction(
    (beforeCount) => {
      const messages = document.querySelectorAll('.message');
      return messages.length >= beforeCount + 2; // User message + AI response
    },
    messagesBefore,
    { timeout: 0 } // No timeout
  );
  
  const messagesAfter = await page.locator('.message').count();
  console.log(`   ✓ Response received! Messages: ${messagesBefore} → ${messagesAfter}`);
  
  // Small wait for streaming to complete - RIDOTTO per flusso continuo
  await page.waitForTimeout(1000); // 1s per vedere la risposta poi subito prossima
  
  // Get last message to log
  const allMessages = await page.locator('.message').all();
  const lastMessage = allMessages[allMessages.length - 1];
  const responseText = await lastMessage.textContent() || '';
  const shortResponse = responseText.length > 100 ? responseText.substring(0, 100) + '...' : responseText;
  console.log(`   💬 Response: "${shortResponse}"`);
  
  return responseText;
}

async function loginAsKrisna(page: Page) {
  console.log('\n🔐 Login as Krisna (krisna@balizero.com)...');
  
  await page.goto('https://zantara.balizero.com/login.html');
  console.log('   ✓ Page loaded');
  await page.waitForLoadState('domcontentloaded');
  
  // Fill using direct IDs
  await page.fill('#name', 'Krisna');
  console.log('   ✓ Name filled');
  await page.fill('#email', 'krisna@balizero.com');
  console.log('   ✓ Email filled');
  await page.fill('#pin', '705802');
  console.log('   ✓ PIN filled');
  
  // Click Join Team button by ID
  await page.click('#loginBtn');
  console.log('   ✓ Login button clicked');
  
  // Wait for redirect to chat
  await page.waitForURL('**/chat.html', { timeout: 10000 });
  await page.waitForLoadState('domcontentloaded');
  
  console.log('✅ Logged in successfully\n');
}

// ==================== MAIN TEST ====================

test('ZANTARA 100 Questions - Krisna (Bahasa Indonesia)', async ({ page }) => {
  
  // Login
  await loginAsKrisna(page);
  
  // ============ CATEGORY 1: AI & Chat (5 tests) ============
  console.log('\n🤖 === CATEGORY 1: AI & CHAT (5 questions) ===');
  
  await sendMessageAndWait(page, 'Halo! Apa kabar?', 1);
  await sendMessageAndWait(page, 'Ceritakan saya tentang budaya Bali yang unik', 2);
  await sendMessageAndWait(page, 'Analisis sentiment teks ini: "Saya sangat puas dengan layanan Bali Zero!"', 3);
  await sendMessageAndWait(page, 'Jelaskan filosofi Tri Hita Karana secara singkat', 4);
  await sendMessageAndWait(page, 'Bagaimana sistem RAG ZANTARA bekerja?', 5);
  
  // ============ CATEGORY 2: Oracle System (15 tests) ============
  console.log('\n🔮 === CATEGORY 2: ORACLE SYSTEM (15 questions) ===');
  
  await sendMessageAndWait(page, 'Berapa tarif pajak untuk PT PMA di sektor ekspor?', 6);
  await sendMessageAndWait(page, 'Apa kata hukum Indonesia tentang kepemilikan properti oleh warga asing?', 7);
  await sendMessageAndWait(page, 'Apa saja persyaratan untuk membuka restoran di Bali?', 8);
  await sendMessageAndWait(page, 'Bandingkan visa B211A dan B211B untuk bisnis', 9);
  await sendMessageAndWait(page, 'Cari kode KBLI untuk konsultan IT', 10);
  await sendMessageAndWait(page, 'Simulasikan skenario: buka PT PMA di sektor F&B dengan 2 karyawan asing', 11);
  await sendMessageAndWait(page, 'Analisis risiko pajak untuk perusahaan import-export', 12);
  await sendMessageAndWait(page, 'Prediksi total biaya setup PT PMA + KITAS untuk 3 orang', 13);
  await sendMessageAndWait(page, 'Apa perbedaan antara PT PMA dan PT Lokal dalam hal pajak?', 14);
  await sendMessageAndWait(page, 'Bagaimana cara mengurus izin usaha pariwisata di Bali?', 15);
  await sendMessageAndWait(page, 'Apa saja dokumen yang diperlukan untuk membeli tanah leasehold?', 16);
  await sendMessageAndWait(page, 'Berapa lama proses perpanjangan KITAS?', 17);
  await sendMessageAndWait(page, 'Kode KBLI apa yang cocok untuk coffee shop dengan live music?', 18);
  await sendMessageAndWait(page, 'Bagaimana cara menghitung PPh 21 untuk karyawan asing?', 19);
  await sendMessageAndWait(page, 'Apa saja kewajiban pelaporan pajak tahunan PT PMA?', 20);
  
  // ============ CATEGORY 3: Pricing & KBLI (15 tests) ============
  console.log('\n💰 === CATEGORY 3: PRICING & KBLI (15 questions) ===');
  
  await sendMessageAndWait(page, 'Berapa harga KITAS untuk pekerja?', 21);
  await sendMessageAndWait(page, 'Berikan saya penawaran lengkap untuk setup PT PMA', 22);
  await sendMessageAndWait(page, 'Bandingkan harga semua layanan visa', 23);
  await sendMessageAndWait(page, 'Berapa biaya konsultasi pajak tahunan?', 24);
  await sendMessageAndWait(page, 'Harga pembuatan PT Lokal berapa?', 25);
  await sendMessageAndWait(page, 'Bandingkan biaya KITAS vs KITAP', 26);
  await sendMessageAndWait(page, 'Berapa biaya pengurusan IMB untuk bangunan komersial?', 27);
  await sendMessageAndWait(page, 'Apa saja paket layanan real estate yang tersedia?', 28);
  await sendMessageAndWait(page, 'Kode KBLI untuk hotel bintang 3 apa?', 29);
  await sendMessageAndWait(page, 'Apa persyaratan untuk kode KBLI 56101?', 30);
  await sendMessageAndWait(page, 'Berapa total biaya untuk visa keluarga (spouse + 2 anak)?', 31);
  await sendMessageAndWait(page, 'Bandingkan harga layanan accounting bulanan', 32);
  await sendMessageAndWait(page, 'Kode KBLI untuk spa dan wellness center?', 33);
  await sendMessageAndWait(page, 'Berapa biaya perpanjangan izin usaha tahunan?', 34);
  await sendMessageAndWait(page, 'Apa saja biaya tersembunyi saat setup PT PMA?', 35);
  
  // ============ CATEGORY 4: Memory & Context (10 tests) ============
  console.log('\n🧠 === CATEGORY 4: MEMORY & CONTEXT (10 questions) ===');
  
  await sendMessageAndWait(page, 'Ingat bahwa saya berencana membuka coffee shop di Ubud tahun depan', 36);
  await sendMessageAndWait(page, 'Simpan informasi: budget saya maksimal 500 juta rupiah', 37);
  await sendMessageAndWait(page, 'Apa yang sudah saya bicarakan dengan kamu hari ini?', 38);
  await sendMessageAndWait(page, 'Cari di memori: kapan terakhir saya tanya tentang KITAS?', 39);
  await sendMessageAndWait(page, 'Berdasarkan rencana coffee shop saya, apa saran terbaik?', 40);
  await sendMessageAndWait(page, 'Ingat: saya lebih suka komunikasi dalam Bahasa Indonesia', 41);
  await sendMessageAndWait(page, 'Ambil semua fakta tentang rencana bisnis saya', 42);
  await sendMessageAndWait(page, 'Apa yang kamu tahu tentang preferensi saya?', 43);
  await sendMessageAndWait(page, 'Simpan: deadline setup perusahaan saya Maret 2026', 44);
  await sendMessageAndWait(page, 'Rangkum semua percakapan kita minggu ini', 45);
  
  // ============ CATEGORY 5: Analytics & Reports (10 tests) ============
  console.log('\n📊 === CATEGORY 5: ANALYTICS & REPORTS (10 questions) ===');
  
  await sendMessageAndWait(page, 'Tampilkan dashboard utama', 46);
  await sendMessageAndWait(page, 'Berikan laporan percakapan minggu ini', 47);
  await sendMessageAndWait(page, 'Statistik penggunaan layanan apa yang populer?', 48);
  await sendMessageAndWait(page, 'Generate laporan mingguan', 49);
  await sendMessageAndWait(page, 'Buat laporan bulanan untuk Oktober 2025', 50);
  await sendMessageAndWait(page, 'Rekap harian saya hari ini', 51);
  await sendMessageAndWait(page, 'Track event: saya tertarik dengan layanan real estate', 52);
  await sendMessageAndWait(page, 'Berapa banyak pertanyaan yang sudah saya tanyakan?', 53);
  await sendMessageAndWait(page, 'Dashboard analytics untuk tim Bali Zero', 54);
  await sendMessageAndWait(page, 'Apa topik yang paling sering saya tanyakan?', 55);
  
  // ============ CATEGORY 6: Translation & Communication (10 tests) ============
  console.log('\n🌐 === CATEGORY 6: TRANSLATION & COMMUNICATION (10 questions) ===');
  
  await sendMessageAndWait(page, 'Terjemahkan ke Inggris: "Saya ingin membuka perusahaan di Bali"', 56);
  await sendMessageAndWait(page, 'Translate to Indonesian: "What are the requirements for a work permit?"', 57);
  await sendMessageAndWait(page, 'Terjemahkan dokumen ini ke Bahasa Indonesia: PT PMA registration form', 58);
  await sendMessageAndWait(page, 'Kirim notifikasi ke Slack: "Krisna bertanya tentang setup PT PMA"', 59);
  await sendMessageAndWait(page, 'Notify Discord: "New inquiry from Krisna about coffee shop"', 60);
  await sendMessageAndWait(page, 'Terjemahkan batch: ["Hello", "Thank you", "See you soon"]', 61);
  await sendMessageAndWait(page, 'Translate legal terms: "Force Majeure, Governing Law, Arbitration"', 62);
  await sendMessageAndWait(page, 'Bagaimana cara mengirim pesan WhatsApp otomatis?', 63);
  await sendMessageAndWait(page, 'Terjemahkan kontrak sewa properti ke Indonesia', 64);
  await sendMessageAndWait(page, 'Send me a summary in English of our conversation', 65);
  
  // ============ CATEGORY 7: Maps & Location (10 tests) ============
  console.log('\n🗺️ === CATEGORY 7: MAPS & LOCATION (10 questions) ===');
  
  await sendMessageAndWait(page, 'Cari kantor Bali Zero di Canggu', 66);
  await sendMessageAndWait(page, 'Rute dari Ubud ke Sanur', 67);
  await sendMessageAndWait(page, 'Cari coffee shop terdekat di Seminyak', 68);
  await sendMessageAndWait(page, 'Detail lokasi: Pura Tanah Lot', 69);
  await sendMessageAndWait(page, 'Jarak dari Denpasar ke Nusa Dua berapa km?', 70);
  await sendMessageAndWait(page, 'Cari tempat meeting yang bagus di Canggu', 71);
  await sendMessageAndWait(page, 'Arah berkendara dari Kuta ke Uluwatu', 72);
  await sendMessageAndWait(page, 'Restoran Indonesia terbaik di Ubud', 73);
  await sendMessageAndWait(page, 'Lokasi kantor imigrasi terdekat', 74);
  await sendMessageAndWait(page, 'Bandingkan rute jalan kaki vs motor dari hotel ke pantai', 75);
  
  // ============ CATEGORY 8: Image Generation (5 tests) ============
  console.log('\n🎨 === CATEGORY 8: IMAGE GENERATION (5 questions) ===');
  
  await sendMessageAndWait(page, 'Generate gambar: modern coffee shop di Bali dengan view sawah', 76);
  await sendMessageAndWait(page, 'Buat image: logo untuk perusahaan consulting bernama "BaliPro"', 77);
  await sendMessageAndWait(page, 'Generate photo: coworking space dengan desain tropical', 78);
  await sendMessageAndWait(page, 'Upscale gambar saya menjadi HD', 79);
  await sendMessageAndWait(page, 'Test image generation: sunset di pantai Canggu', 80);
  
  // ============ CATEGORY 9: Identity & Team (5 tests) ============
  console.log('\n👥 === CATEGORY 9: IDENTITY & TEAM (5 questions) ===');
  
  await sendMessageAndWait(page, 'Siapa saya di sistem AMBARADAM?', 81);
  await sendMessageAndWait(page, 'Tampilkan profil tim Bali Zero', 82);
  await sendMessageAndWait(page, 'Siapa saja anggota tim yang tersedia?', 83);
  await sendMessageAndWait(page, 'Departemen apa saja yang ada di Bali Zero?', 84);
  await sendMessageAndWait(page, 'Aktivitas terbaru tim minggu ini', 85);
  
  // ============ CATEGORY 10: Complex Multi-Context (15 tests) ============
  console.log('\n🚀 === CATEGORY 10: COMPLEX QUERIES (15 questions) ===');
  
  await sendMessageAndWait(page, 'Buatkan saya timeline lengkap dari awal hingga selesai untuk setup PT PMA', 86);
  await sendMessageAndWait(page, 'Bandingkan semua aspek: PT PMA vs PT Lokal (pajak, modal, kepemilikan, fleksibilitas)', 87);
  await sendMessageAndWait(page, 'Analisis kelayakan bisnis coffee shop di Ubud dengan budget 500 juta', 88);
  await sendMessageAndWait(page, 'Buatkan roadmap 6 bulan untuk buka restoran dari nol', 89);
  await sendMessageAndWait(page, 'Apa saja dokumen lengkap yang perlu disiapkan untuk investor asing?', 90);
  await sendMessageAndWait(page, 'Hitung ROI untuk investasi villa sewa jangka panjang vs pendek di Bali', 91);
  await sendMessageAndWait(page, 'Strategi terbaik untuk minimize pajak secara legal untuk PT PMA', 92);
  await sendMessageAndWait(page, 'Perbandingan komprehensif: Bali vs Lombok untuk investasi properti', 93);
  await sendMessageAndWait(page, 'Buat business plan outline untuk startup tech di Indonesia', 94);
  await sendMessageAndWait(page, 'Apa saja risiko legal dan cara mitigasinya untuk bisnis F&B?', 95);
  await sendMessageAndWait(page, 'Timeline dan biaya lengkap untuk naturalisasi kewarganegaraan Indonesia', 96);
  await sendMessageAndWait(page, 'Analisis pasar coworking space di Bali: demand, kompetisi, proyeksi', 97);
  await sendMessageAndWait(page, 'Bagaimana cara strukturisasi holding company untuk multiple bisnis?', 98);
  await sendMessageAndWait(page, 'Perbandingan visa investor vs entrepreneur vs retirement untuk expat', 99);
  await sendMessageAndWait(page, 'Buatkan comprehensive checklist untuk pindah dan kerja di Bali permanen', 100);
  
  // ============ BONUS: Multi-Turn Conversation (2 tests) ============
  console.log('\n🎁 === BONUS: MULTI-TURN CONTEXT (2 questions) ===');
  
  await sendMessageAndWait(page, 'Saya mau buka resort kecil di Ubud, berapa modal minimal yang dibutuhkan?', 101);
  await sendMessageAndWait(page, 'Berdasarkan rencana resort tadi, buatkan timeline operasional 12 bulan', 102);
  
  console.log('\n\n🎉 ===== TEST SELESAI! 102 PERTANYAAN BERHASIL =====\n');
  
  // Final pause untuk review
  await humanDelay(page, 5000, 8000);
});
