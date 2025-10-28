import { test, expect } from '@playwright/test';

/**
 * ZANTARA 100 Questions Test - FINAL VERSION
 * - Login automatico Krisna
 * - 102 domande in Bahasa Indonesia
 * - Flusso continuo senza interruzioni
 * - NO timeout
 */

test('ZANTARA 100 Questions - Continuous Flow', async ({ page }) => {
  console.log('🚀 Starting ZANTARA 100 Questions Test\n');

  // ===== LOGIN =====
  console.log('🔐 LOGIN PHASE');
  await page.goto('https://zantara.balizero.com/login.html');
  await page.waitForSelector('#name');
  
  await page.fill('#name', 'Krisna');
  await page.fill('#email', 'krisna@balizero.com');
  await page.fill('#pin', '705802');
  await page.click('#loginBtn');
  
  await page.waitForURL('**/chat.html');
  await page.waitForSelector('#chatInput');
  console.log('✅ Login successful\n');

  // Wait for page to be ready
  await page.waitForTimeout(2000);

  // ===== HELPER FUNCTION =====
  async function ask(question: string, num: number) {
    console.log(`[${num}/102] 📤 ${question.substring(0, 60)}${question.length > 60 ? '...' : ''}`);
    
    // Count messages before
    const messagesBefore = await page.locator('.message').count();
    
    // Type and send
    await page.fill('#chatInput', question);
    await page.press('#chatInput', 'Enter');
    
    // Wait for input to clear (webapp cleared it after send)
    await page.waitForFunction(() => {
      const input = document.querySelector('#chatInput') as HTMLTextAreaElement;
      return input && input.value === '';
    });
    
    // Wait for AI response message to appear
    await page.waitForFunction(
      (beforeCount) => {
        const messages = document.querySelectorAll('.message');
        return messages.length >= beforeCount + 2; // user + AI
      },
      messagesBefore
    );
    
    // Brief pause to see the response
    await page.waitForTimeout(1000);
    
    console.log(`✅`);
  }

  // ===== 102 QUESTIONS =====
  
  console.log('🤖 CATEGORY 1: AI & CHAT');
  await ask('Halo! Apa kabar?', 1);
  await ask('Ceritakan saya tentang budaya Bali yang unik', 2);
  await ask('Analisis sentiment teks ini: Saya sangat puas dengan layanan Bali Zero!', 3);
  await ask('Jelaskan filosofi Tri Hita Karana secara singkat', 4);
  await ask('Bagaimana sistem RAG ZANTARA bekerja?', 5);

  console.log('\n🔮 CATEGORY 2: ORACLE SYSTEM');
  await ask('Berapa tarif pajak untuk PT PMA di sektor ekspor?', 6);
  await ask('Apa kata hukum Indonesia tentang kepemilikan properti oleh warga asing?', 7);
  await ask('Apa saja persyaratan untuk membuka restoran di Bali?', 8);
  await ask('Bandingkan visa B211A dan B211B untuk bisnis', 9);
  await ask('Cari kode KBLI untuk konsultan IT', 10);
  await ask('Simulasikan skenario: buka PT PMA di sektor F&B dengan 2 karyawan asing', 11);
  await ask('Analisis risiko pajak untuk perusahaan import-export', 12);
  await ask('Prediksi total biaya setup PT PMA + KITAS untuk 3 orang', 13);
  await ask('Apa perbedaan antara PT PMA dan PT Lokal dalam hal pajak?', 14);
  await ask('Bagaimana cara mengurus izin usaha pariwisata di Bali?', 15);
  await ask('Apa saja dokumen yang diperlukan untuk membeli tanah leasehold?', 16);
  await ask('Berapa lama proses perpanjangan KITAS?', 17);
  await ask('Kode KBLI apa yang cocok untuk coffee shop dengan live music?', 18);
  await ask('Bagaimana cara menghitung PPh 21 untuk karyawan asing?', 19);
  await ask('Apa saja kewajiban pelaporan pajak tahunan PT PMA?', 20);

  console.log('\n💰 CATEGORY 3: PRICING & KBLI');
  await ask('Berapa harga KITAS untuk pekerja?', 21);
  await ask('Berikan saya penawaran lengkap untuk setup PT PMA', 22);
  await ask('Bandingkan harga semua layanan visa', 23);
  await ask('Berapa biaya konsultasi pajak tahunan?', 24);
  await ask('Harga pembuatan PT Lokal berapa?', 25);
  await ask('Bandingkan biaya KITAS vs KITAP', 26);
  await ask('Berapa biaya pengurusan IMB untuk bangunan komersial?', 27);
  await ask('Apa saja paket layanan real estate yang tersedia?', 28);
  await ask('Kode KBLI untuk hotel bintang 3 apa?', 29);
  await ask('Apa persyaratan untuk kode KBLI 56101?', 30);
  await ask('Berapa total biaya untuk visa keluarga (spouse + 2 anak)?', 31);
  await ask('Bandingkan harga layanan accounting bulanan', 32);
  await ask('Kode KBLI untuk spa dan wellness center?', 33);
  await ask('Berapa biaya perpanjangan izin usaha tahunan?', 34);
  await ask('Apa saja biaya tersembunyi saat setup PT PMA?', 35);

  console.log('\n🧠 CATEGORY 4: MEMORY & CONTEXT');
  await ask('Ingat bahwa saya berencana membuka coffee shop di Ubud tahun depan', 36);
  await ask('Simpan informasi: budget saya maksimal 500 juta rupiah', 37);
  await ask('Apa yang sudah saya bicarakan dengan kamu hari ini?', 38);
  await ask('Cari di memori: kapan terakhir saya tanya tentang KITAS?', 39);
  await ask('Berdasarkan rencana coffee shop saya, apa saran terbaik?', 40);
  await ask('Ingat: saya lebih suka komunikasi dalam Bahasa Indonesia', 41);
  await ask('Ambil semua fakta tentang rencana bisnis saya', 42);
  await ask('Apa yang kamu tahu tentang preferensi saya?', 43);
  await ask('Simpan: deadline setup perusahaan saya Maret 2026', 44);
  await ask('Rangkum semua percakapan kita minggu ini', 45);

  console.log('\n📊 CATEGORY 5: ANALYTICS & REPORTS');
  await ask('Tampilkan dashboard utama', 46);
  await ask('Berikan laporan percakapan minggu ini', 47);
  await ask('Statistik penggunaan layanan apa yang populer?', 48);
  await ask('Generate laporan mingguan', 49);
  await ask('Buat laporan bulanan untuk Oktober 2025', 50);
  await ask('Rekap harian saya hari ini', 51);
  await ask('Track event: saya tertarik dengan layanan real estate', 52);
  await ask('Berapa banyak pertanyaan yang sudah saya tanyakan?', 53);
  await ask('Dashboard analytics untuk tim Bali Zero', 54);
  await ask('Apa topik yang paling sering saya tanyakan?', 55);

  console.log('\n🌐 CATEGORY 6: TRANSLATION & COMMUNICATION');
  await ask('Terjemahkan ke Inggris: Saya ingin membuka perusahaan di Bali', 56);
  await ask('Translate to Indonesian: What are the requirements for a work permit?', 57);
  await ask('Terjemahkan dokumen ini ke Bahasa Indonesia: PT PMA registration form', 58);
  await ask('Kirim notifikasi ke Slack: Krisna bertanya tentang setup PT PMA', 59);
  await ask('Notify Discord: New inquiry from Krisna about coffee shop', 60);
  await ask('Terjemahkan batch: Hello, Thank you, See you soon', 61);
  await ask('Translate legal terms: Force Majeure, Governing Law, Arbitration', 62);
  await ask('Bagaimana cara mengirim pesan WhatsApp otomatis?', 63);
  await ask('Terjemahkan kontrak sewa properti ke Indonesia', 64);
  await ask('Send me a summary in English of our conversation', 65);

  console.log('\n🗺️ CATEGORY 7: MAPS & LOCATION');
  await ask('Cari kantor Bali Zero di Canggu', 66);
  await ask('Rute dari Ubud ke Sanur', 67);
  await ask('Cari coffee shop terdekat di Seminyak', 68);
  await ask('Detail lokasi: Pura Tanah Lot', 69);
  await ask('Jarak dari Denpasar ke Nusa Dua berapa km?', 70);
  await ask('Cari tempat meeting yang bagus di Canggu', 71);
  await ask('Arah berkendara dari Kuta ke Uluwatu', 72);
  await ask('Restoran Indonesia terbaik di Ubud', 73);
  await ask('Lokasi kantor imigrasi terdekat', 74);
  await ask('Bandingkan rute jalan kaki vs motor dari hotel ke pantai', 75);

  console.log('\n🎨 CATEGORY 8: IMAGE GENERATION');
  await ask('Generate gambar: modern coffee shop di Bali dengan view sawah', 76);
  await ask('Buat image: logo untuk perusahaan consulting bernama BaliPro', 77);
  await ask('Generate photo: coworking space dengan desain tropical', 78);
  await ask('Upscale gambar saya menjadi HD', 79);
  await ask('Test image generation: sunset di pantai Canggu', 80);

  console.log('\n👥 CATEGORY 9: IDENTITY & TEAM');
  await ask('Siapa saya di sistem AMBARADAM?', 81);
  await ask('Tampilkan profil tim Bali Zero', 82);
  await ask('Siapa saja anggota tim yang tersedia?', 83);
  await ask('Departemen apa saja yang ada di Bali Zero?', 84);
  await ask('Aktivitas terbaru tim minggu ini', 85);

  console.log('\n🚀 CATEGORY 10: COMPLEX QUERIES');
  await ask('Buatkan saya timeline lengkap dari awal hingga selesai untuk setup PT PMA', 86);
  await ask('Bandingkan semua aspek: PT PMA vs PT Lokal (pajak, modal, kepemilikan, fleksibilitas)', 87);
  await ask('Analisis kelayakan bisnis coffee shop di Ubud dengan budget 500 juta', 88);
  await ask('Buatkan roadmap 6 bulan untuk buka restoran dari nol', 89);
  await ask('Apa saja dokumen lengkap yang perlu disiapkan untuk investor asing?', 90);
  await ask('Hitung ROI untuk investasi villa sewa jangka panjang vs pendek di Bali', 91);
  await ask('Strategi terbaik untuk minimize pajak secara legal untuk PT PMA', 92);
  await ask('Perbandingan komprehensif: Bali vs Lombok untuk investasi properti', 93);
  await ask('Buat business plan outline untuk startup tech di Indonesia', 94);
  await ask('Apa saja risiko legal dan cara mitigasinya untuk bisnis F&B?', 95);
  await ask('Timeline dan biaya lengkap untuk naturalisasi kewarganegaraan Indonesia', 96);
  await ask('Analisis pasar coworking space di Bali: demand, kompetisi, proyeksi', 97);
  await ask('Bagaimana cara strukturisasi holding company untuk multiple bisnis?', 98);
  await ask('Perbandingan visa investor vs entrepreneur vs retirement untuk expat', 99);
  await ask('Buatkan comprehensive checklist untuk pindah dan kerja di Bali permanen', 100);

  console.log('\n🎁 BONUS: MULTI-TURN CONTEXT');
  await ask('Saya mau buka resort kecil di Ubud, berapa modal minimal yang dibutuhkan?', 101);
  await ask('Berdasarkan rencana resort tadi, buatkan timeline operasional 12 bulan', 102);

  console.log('\n\n🎉 ===== TEST COMPLETED! 102 QUESTIONS DONE =====\n');
  
  // Final wait to review
  await page.waitForTimeout(5000);
});
