/**
 * SCRIPT DOWNLOAD COMPLETO LEGGI INDONESIANE - 10 ROUNDS
 * Incolla questo script nella console del browser su https://peraturan.bpk.go.id
 *
 * INSTRUCTIONS:
 * 1. Vai su https://peraturan.bpk.go.id
 * 2. Apri Dev Tools (F12)
 * 3. Incolla questo script
 * 4. Scegli quale round eseguire
 */

console.log('🚀 INDONESIAN LAWS COMPLETE DOWNLOAD SYSTEM');
console.log('📋 10 ROUNDS STRATEGICI - 488 LEGGI TOTALI');

// LEGGI PER ROUND - DATABASE COMPLETO
const LAWS_BY_ROUND = {
  ROUND_1: {
    name: 'Constitutional & Fundamental Laws',
    directory: 'ROUND_1_Constitutional',
    laws: [
      { title: 'UUD 1945', type: 'UUD', keywords: ['UUD', '1945', 'Undang-Undang Dasar'] },
      {
        title: 'UU No. 39 Tahun 1999',
        type: 'UU',
        keywords: ['39', '1999', 'Hak Asasi Manusia', 'HAM'],
      },
      {
        title: 'UU No. 12 Tahun 2011',
        type: 'UU',
        keywords: ['12', '2011', 'Pembentukan Peraturan'],
      },
      {
        title: 'UU No. 48 Tahun 2009',
        type: 'UU',
        keywords: ['48', '2009', 'Kekuasaan Kehakiman'],
      },
      {
        title: 'UU No. 24 Tahun 2003',
        type: 'UU',
        keywords: ['24', '2003', 'Mahkamah Konstitusi'],
      },
      {
        title: 'UU No. 8 Tahun 1981',
        type: 'UU',
        keywords: ['8', '1981', 'Hukum Acara Pidana', 'KUHAP'],
      },
      { title: 'UU No. 4 Tahun 2004', type: 'UU', keywords: ['4', '2004', 'Kekuasaan Kehakiman'] },
      { title: 'UU No. 39 Tahun 2008', type: 'UU', keywords: ['39', '2008', 'Kementerian Negara'] },
      { title: 'UU No. 37 Tahun 2008', type: 'UU', keywords: ['37', '2008', 'Ombudsman'] },
      { title: 'UU No. 7 Tahun 2011', type: 'UU', keywords: ['7', '2011', 'Mata Uang'] },
      {
        title: 'UU No. 9 Tahun 2011',
        type: 'UU',
        keywords: ['9', '2011', 'Lembaga Penyiaran Publik'],
      },
      { title: 'UU No. 1 Tahun 2013', type: 'UU', keywords: ['1', '2013', 'Lembaga Keuangan'] },
      {
        title: 'UU No. 21 Tahun 2011',
        type: 'UU',
        keywords: ['21', '2011', 'Otoritas Jasa Keuangan', 'OJK'],
      },
      {
        title: 'UU No. 20 Tahun 2008',
        type: 'UU',
        keywords: ['20', '2008', 'UMKM', 'Usaha Mikro'],
      },
      { title: 'UU No. 3 Tahun 2014', type: 'UU', keywords: ['3', '2014', 'Perindustrian'] },
    ],
  },

  ROUND_2: {
    name: 'Economic Core Legislation',
    directory: 'ROUND_2_Economic_Core',
    laws: [
      { title: 'UU No. 7 Tahun 2014', type: 'UU', keywords: ['7', '2014', 'Perdagangan'] },
      { title: 'UU No. 25 Tahun 2007', type: 'UU', keywords: ['25', '2007', 'Penanaman Modal'] },
      {
        title: 'UU No. 40 Tahun 2007',
        type: 'UU',
        keywords: ['40', '2007', 'Perseroan Terbatas', 'PT'],
      },
      { title: 'UU No. 8 Tahun 1995', type: 'UU', keywords: ['8', '1995', 'Pasar Modal'] },
      { title: 'UU No. 19 Tahun 2003', type: 'UU', keywords: ['19', '2003', 'BUMN'] },
      { title: 'UU No. 36 Tahun 2008', type: 'UU', keywords: ['36', '2008', 'Ketenagakerjaan'] },
      { title: 'UU No. 28 Tahun 2008', type: 'UU', keywords: ['28', '2008', 'Kesehatan'] },
      {
        title: 'UU No. 23 Tahun 2014',
        type: 'UU',
        keywords: ['23', '2014', 'Pemerintahan Daerah'],
      },
      {
        title: 'UU No. 33 Tahun 2004',
        type: 'UU',
        keywords: ['33', '2004', 'Perimbangan Keuangan'],
      },
      { title: 'UU No. 17 Tahun 2003', type: 'UU', keywords: ['17', '2003', 'Keuangan Negara'] },
      {
        title: 'UU No. 1 Tahun 2004',
        type: 'UU',
        keywords: ['1', '2004', 'Perbendaharaan Negara'],
      },
      { title: 'UU No. 15 Tahun 2001', type: 'UU', keywords: ['15', '2001', 'Merek'] },
      { title: 'UU No. 14 Tahun 2001', type: 'UU', keywords: ['14', '2001', 'Paten'] },
      { title: 'UU No. 31 Tahun 2000', type: 'UU', keywords: ['31', '2000', 'Desain Industri'] },
      { title: 'UU No. 19 Tahun 2002', type: 'UU', keywords: ['19', '2002', 'Hak Cipta'] },
      { title: 'UU No. 30 Tahun 2000', type: 'UU', keywords: ['30', '2000', 'Rahasia Dagang'] },
      {
        title: 'UU No. 42 Tahun 1999',
        type: 'UU',
        keywords: ['42', '1999', 'Perlindungan Konsumen'],
      },
      { title: 'UU No. 10 Tahun 1998', type: 'UU', keywords: ['10', '1998', 'Perbankan'] },
      {
        title: 'UU No. 11 Tahun 2008',
        type: 'UU',
        keywords: ['11', '2008', 'ITE', 'Informasi Elektronik'],
      },
    ],
  },

  ROUND_3: {
    name: 'Regulatory Framework',
    directory: 'ROUND_3_Regulatory',
    laws: [
      { title: 'PP No. 32 Tahun 2018', type: 'PP', keywords: ['32', '2018', 'Perizinan Berusaha'] },
      { title: 'PP No. 24 Tahun 2018', type: 'PP', keywords: ['24', '2018', 'OSS', 'RBA'] },
      {
        title: 'Perpres No. 91 Tahun 2017',
        type: 'Perpres',
        keywords: ['91', '2017', 'Kemudahan Berusaha'],
      },
      {
        title: 'Perpres No. 38 Tahun 2017',
        type: 'Perpres',
        keywords: ['38', '2017', 'Inovasi Perekonomian'],
      },
      { title: 'PP No. 1 Tahun 2021', type: 'PP', keywords: ['1', '2021', 'Cipta Kerja'] },
      { title: 'PP No. 23 Tahun 2018', type: 'PP', keywords: ['23', '2018', 'Orang Asing'] },
      { title: 'PP No. 45 Tahun 2017', type: 'PP', keywords: ['45', '2017', 'Pertanahan'] },
      { title: 'PP No. 27 Tahun 2017', type: 'PP', keywords: ['27', '2017', 'Pekerja'] },
      { title: 'PP No. 78 Tahun 2015', type: 'PP', keywords: ['78', '2015', 'Jaminan Kesehatan'] },
      { title: 'PP No. 86 Tahun 2018', type: 'PP', keywords: ['86', '2018', 'Perizinan Berusaha'] },
      {
        title: 'Perpres No. 10 Tahun 2021',
        type: 'Perpres',
        keywords: ['10', '2021', 'Investasi Daerah'],
      },
      { title: 'Perpres No. 80 Tahun 2019', type: 'Perpres', keywords: ['80', '2019', 'Ekonomi'] },
      { title: 'PP No. 44 Tahun 2016', type: 'PP', keywords: ['44', '2016', 'Ketenagakerjaan'] },
      { title: 'PP No. 21 Tahun 2016', type: 'PP', keywords: ['21', '2016', 'Bea Masuk'] },
      { title: 'PP No. 74 Tahun 2015', type: 'PP', keywords: ['74', '2015', 'Ekspor'] },
      { title: 'PP No. 6 Tahun 2019', type: 'PP', keywords: ['6', '2019', 'Tenaga Kerja Asing'] },
      {
        title: 'Perpres No. 54 Tahun 2018',
        type: 'Perpres',
        keywords: ['54', '2018', 'Strategi Nasional'],
      },
      {
        title: 'Perpres No. 67 Tahun 2018',
        type: 'Perpres',
        keywords: ['67', '2018', 'SPBE', 'Elektronik'],
      },
      { title: 'PP No. 71 Tahun 2019', type: 'PP', keywords: ['71', '2019', 'Kemudahan Berusaha'] },
      { title: 'PP No. 20 Tahun 2018', type: 'PP', keywords: ['20', '2018', 'Tenaga Kerja Asing'] },
    ],
  },

  ROUND_4: {
    name: 'Tax & Finance',
    directory: 'ROUND_4_Tax_Finance',
    laws: [
      { title: 'UU No. 28 Tahun 2007', type: 'UU', keywords: ['28', '2007', 'KUP', 'Perpajakan'] },
      {
        title: 'UU No. 36 Tahun 2008',
        type: 'UU',
        keywords: ['36', '2008', 'PPh', 'Pajak Penghasilan'],
      },
      {
        title: 'UU No. 42 Tahun 2009',
        type: 'UU',
        keywords: ['42', '2009', 'PPN', 'Pajak Pertambahan Nilai'],
      },
      {
        title: 'UU No. 1 Tahun 2022',
        type: 'UU',
        keywords: ['1', '2022', 'Keuangan Pusat Daerah'],
      },
      {
        title: 'UU No. 7 Tahun 2021',
        type: 'UU',
        keywords: ['7', '2021', 'Harmonisasi Perpajakan'],
      },
      { title: 'UU No. 16 Tahun 2009', type: 'UU', keywords: ['16', '2009', 'Perpajakan'] },
      {
        title: 'UU No. 12 Tahun 1994',
        type: 'UU',
        keywords: ['12', '1994', 'PBB', 'Pajak Bumi Bangunan'],
      },
      { title: 'UU No. 21 Tahun 1997', type: 'UU', keywords: ['21', '1997', 'BPHTB'] },
      { title: 'UU No. 8 Tahun 1983', type: 'UU', keywords: ['8', '1983', 'PPN', 'PPnBM'] },
      {
        title: 'UU No. 9 Tahun 1994',
        type: 'UU',
        keywords: ['9', '1994', 'Pajak Daerah', 'Retribusi'],
      },
      { title: 'UU No. 10 Tahun 1995', type: 'UU', keywords: ['10', '1995', 'Kepabeanan'] },
      { title: 'UU No. 11 Tahun 1995', type: 'UU', keywords: ['11', '1995', 'Cukai'] },
      { title: 'UU No. 12 Tahun 1994', type: 'UU', keywords: ['12', '1994', 'Bea Meterai'] },
      { title: 'UU No. 20 Tahun 2000', type: 'UU', keywords: ['20', '2000', 'PPh'] },
      { title: 'UU No. 17 Tahun 2000', type: 'UU', keywords: ['17', '2000', 'PNBP'] },
      { title: 'UU No. 6 Tahun 1983', type: 'UU', keywords: ['6', '1983', 'Perpajakan'] },
      { title: 'UU No. 7 Tahun 1981', type: 'UU', keywords: ['7', '1981', 'Wajib Pajak'] },
      { title: 'UU No. 19 Tahun 2000', type: 'UU', keywords: ['19', '2000', 'Utang Pajak'] },
      { title: 'UU No. 18 Tahun 1997', type: 'UU', keywords: ['18', '1997', 'PPh'] },
    ],
  },

  ROUND_5: {
    name: 'Banking & Finance',
    directory: 'ROUND_5_Banking',
    laws: [
      { title: 'UU No. 7 Tahun 1992', type: 'UU', keywords: ['7', '1992', 'Perbankan'] },
      { title: 'UU No. 21 Tahun 2011', type: 'UU', keywords: ['21', '2011', 'OJK'] },
      { title: 'UU No. 3 Tahun 2011', type: 'UU', keywords: ['3', '2011', 'Dana Transfer'] },
      {
        title: 'UU No. 8 Tahun 2010',
        type: 'UU',
        keywords: ['8', '2010', 'TPPU', 'Pencucian Uang'],
      },
      {
        title: 'UU No. 24 Tahun 2011',
        type: 'UU',
        keywords: ['24', '2011', 'LPS', 'Lembaga Penjamin Simpanan'],
      },
      {
        title: 'UU No. 9 Tahun 2016',
        type: 'UU',
        keywords: ['9', '2016', 'Krisis Sistem Keuangan'],
      },
      {
        title: 'UU No. 2 Tahun 2017',
        type: 'UU',
        keywords: ['2', '2017', 'Layanan Keuangan Digital'],
      },
      { title: 'UU No. 4 Tahun 2023', type: 'UU', keywords: ['4', '2023', 'Sektor Keuangan'] },
      { title: 'UU No. 23 Tahun 2011', type: 'UU', keywords: ['23', '2011', 'LPS'] },
      {
        title: 'UU No. 14 Tahun 2008',
        type: 'UU',
        keywords: ['14', '2008', 'Keterbukaan Informasi Publik'],
      },
      { title: 'UU No. 10 Tahun 1998', type: 'UU', keywords: ['10', '1998', 'Perbankan'] },
      { title: 'UU No. 1 Tahun 2013', type: 'UU', keywords: ['1', '2013', 'Lembaga Keuangan'] },
      { title: 'UU No. 19 Tahun 2003', type: 'UU', keywords: ['19', '2003', 'BUMN'] },
      { title: 'UU No. 6 Tahun 2023', type: 'UU', keywords: ['6', '2023', 'Cipta Kerja'] },
      { title: 'UU No. 16 Tahun 2009', type: 'UU', keywords: ['16', '2009', 'Perpajakan'] },
      { title: 'UU No. 17 Tahun 2003', type: 'UU', keywords: ['17', '2003', 'Keuangan Negara'] },
      {
        title: 'UU No. 1 Tahun 2004',
        type: 'UU',
        keywords: ['1', '2004', 'Perbendaharaan Negara'],
      },
      {
        title: 'UU No. 33 Tahun 2004',
        type: 'UU',
        keywords: ['33', '2004', 'Perimbangan Keuangan'],
      },
      { title: 'UU No. 20 Tahun 2019', type: 'UU', keywords: ['20', '2019', 'APBN'] },
    ],
  },

  ROUND_6: {
    name: 'Technology & Digital',
    directory: 'ROUND_6_Technology',
    laws: [
      { title: 'UU No. 19 Tahun 2016', type: 'UU', keywords: ['19', '2016', 'ITE', 'Perubahan'] },
      {
        title: 'UU No. 11 Tahun 2008',
        type: 'UU',
        keywords: ['11', '2008', 'ITE', 'Informasi Elektronik'],
      },
      { title: 'UU No. 39 Tahun 2019', type: 'UU', keywords: ['39', '2019', 'Kepabeanan'] },
      {
        title: 'Perpres No. 95 Tahun 2018',
        type: 'Perpres',
        keywords: ['95', '2018', 'SPBE', 'Elektronik'],
      },
      {
        title: 'UU No. 8 Tahun 1999',
        type: 'UU',
        keywords: ['8', '1999', 'Perlindungan Konsumen'],
      },
      { title: 'UU No. 36 Tahun 1999', type: 'UU', keywords: ['36', '1999', 'Telekomunikasi'] },
      { title: 'UU No. 44 Tahun 2008', type: 'UU', keywords: ['44', '2008', 'Pornografi'] },
      { title: 'UU No. 20 Tahun 2016', type: 'UU', keywords: ['20', '2016', 'Merek'] },
      { title: 'UU No. 12 Tahun 2014', type: 'UU', keywords: ['12', '2014', 'Desain Industri'] },
      {
        title: 'UU No. 14 Tahun 2014',
        type: 'UU',
        keywords: ['14', '2014', 'Kekayaan Intelektual'],
      },
      { title: 'UU No. 15 Tahun 2001', type: 'UU', keywords: ['15', '2001', 'Merek'] },
      { title: 'UU No. 14 Tahun 2001', type: 'UU', keywords: ['14', '2001', 'Paten'] },
      { title: 'UU No. 31 Tahun 2000', type: 'UU', keywords: ['31', '2000', 'Desain Industri'] },
      { title: 'UU No. 19 Tahun 2002', type: 'UU', keywords: ['19', '2002', 'Hak Cipta'] },
      { title: 'UU No. 30 Tahun 2000', type: 'UU', keywords: ['30', '2000', 'Rahasia Dagang'] },
      {
        title: 'UU No. 32 Tahun 2000',
        type: 'UU',
        keywords: ['32', '2000', 'Desain Tata Letak Sirkuit'],
      },
      { title: 'UU No. 1 Tahun 2016', type: 'UU', keywords: ['1', '2016', 'Perlindungan Anak'] },
      { title: 'UU No. 18 Tahun 2008', type: 'UU', keywords: ['18', '2008', 'Pengelolaan Sampah'] },
      {
        title: 'UU No. 26 Tahun 2007',
        type: 'UU',
        keywords: ['26', '2007', 'Ruang Terbuka Hijau'],
      },
      {
        title: 'UU No. 32 Tahun 2009',
        type: 'UU',
        keywords: ['32', '2009', 'Perlindungan Lingkungan'],
      },
    ],
  },

  ROUND_7: {
    name: 'Energy & Resources',
    directory: 'ROUND_7_Energy',
    laws: [
      { title: 'UU No. 30 Tahun 2007', type: 'UU', keywords: ['30', '2007', 'Energi'] },
      { title: 'UU No. 4 Tahun 2009', type: 'UU', keywords: ['4', '2009', 'Pertambangan'] },
      { title: 'UU No. 30 Tahun 2009', type: 'UU', keywords: ['30', '2009', 'Ketenagalistrikan'] },
      {
        title: 'UU No. 22 Tahun 2001',
        type: 'UU',
        keywords: ['22', '2001', 'Migas', 'Minyak Gas'],
      },
      {
        title: 'UU No. 3 Tahun 2020',
        type: 'UU',
        keywords: ['3', '2020', 'Pertambangan', 'Perubahan'],
      },
      { title: 'UU No. 16 Tahun 2005', type: 'UU', keywords: ['16', '2005', 'Air Minum'] },
      { title: 'UU No. 21 Tahun 2001', type: 'UU', keywords: ['21', '2001', 'Otsus Papua'] },
      { title: 'UU No. 19 Tahun 2004', type: 'UU', keywords: ['19', '2004', 'Sumber Daya Air'] },
      { title: 'UU No. 27 Tahun 2007', type: 'UU', keywords: ['27', '2007', 'Wilayah Pesisir'] },
      {
        title: 'UU No. 32 Tahun 2004',
        type: 'UU',
        keywords: ['32', '2004', 'Pemerintahan Daerah'],
      },
      { title: 'UU No. 18 Tahun 2008', type: 'UU', keywords: ['18', '2008', 'Pengelolaan Sampah'] },
      {
        title: 'UU No. 26 Tahun 2007',
        type: 'UU',
        keywords: ['26', '2007', 'Ruang Terbuka Hijau'],
      },
      {
        title: 'UU No. 32 Tahun 2009',
        type: 'UU',
        keywords: ['32', '2009', 'Perlindungan Lingkungan'],
      },
      {
        title: 'UU No. 5 Tahun 1990',
        type: 'UU',
        keywords: ['5', '1990', 'Konservasi Sumber Daya Alam'],
      },
      { title: 'UU No. 23 Tahun 1997', type: 'UU', keywords: ['23', '1997', 'Lingkungan Hidup'] },
      {
        title: 'UU No. 4 Tahun 1982',
        type: 'UU',
        keywords: ['4', '1982', 'Ketentuan Pokok Pengelolaan Lingkungan'],
      },
      { title: 'UU No. 41 Tahun 1999', type: 'UU', keywords: ['41', '1999', 'Kehutanan'] },
      { title: 'UU No. 5 Tahun 1960', type: 'UU', keywords: ['5', '1960', 'Agraria'] },
      { title: 'UU No. 2 Tahun 2012', type: 'UU', keywords: ['2', '2012', 'Pertanahan'] },
    ],
  },

  ROUND_8: {
    name: 'Healthcare & Pharma',
    directory: 'ROUND_8_Healthcare',
    laws: [
      { title: 'UU No. 36 Tahun 2009', type: 'UU', keywords: ['36', '2009', 'Kesehatan'] },
      {
        title: 'UU No. 8 Tahun 1999',
        type: 'UU',
        keywords: ['8', '1999', 'Perlindungan Konsumen'],
      },
      { title: 'UU No. 18 Tahun 2012', type: 'UU', keywords: ['18', '2012', 'Pangan'] },
      {
        title: 'UU No. 40 Tahun 2004',
        type: 'UU',
        keywords: ['40', '2004', 'SJSN', 'Jaminan Sosial'],
      },
      { title: 'UU No. 24 Tahun 2011', type: 'UU', keywords: ['24', '2011', 'BPJS'] },
      { title: 'UU No. 44 Tahun 2009', type: 'UU', keywords: ['44', '2009', 'Rumah Sakit'] },
      { title: 'UU No. 29 Tahun 2004', type: 'UU', keywords: ['29', '2004', 'Praktik Kedokteran'] },
      { title: 'UU No. 36 Tahun 2014', type: 'UU', keywords: ['36', '2014', 'Tenaga Kesehatan'] },
      { title: 'UU No. 18 Tahun 2014', type: 'UU', keywords: ['18', '2014', 'Kesehatan Jiwa'] },
      { title: 'UU No. 8 Tahun 2019', type: 'UU', keywords: ['8', '2019', 'Kesehatan'] },
      { title: 'UU No. 4 Tahun 1984', type: 'UU', keywords: ['4', '1984', 'Wabah Penyakit'] },
      {
        title: 'UU No. 12 Tahun 2009',
        type: 'UU',
        keywords: ['12', '2009', 'Kesehatan Reproduksi'],
      },
      { title: 'UU No. 13 Tahun 2010', type: 'UU', keywords: ['13', '2010', 'Hortikultura'] },
      { title: 'UU No. 18 Tahun 2013', type: 'UU', keywords: ['18', '2013', 'Kesehatan'] },
      { title: 'UU No. 36 Tahun 2009', type: 'UU', keywords: ['36', '2009', 'Kesehatan'] },
      {
        title: 'UU No. 39 Tahun 2009',
        type: 'UU',
        keywords: ['39', '2009', 'Kekuasaan Kehakiman'],
      },
      {
        title: 'UU No. 12 Tahun 2011',
        type: 'UU',
        keywords: ['12', '2011', 'Pembentukan Peraturan'],
      },
      {
        title: 'UU No. 48 Tahun 2009',
        type: 'UU',
        keywords: ['48', '2009', 'Kekuasaan Kehakiman'],
      },
      {
        title: 'UU No. 24 Tahun 2003',
        type: 'UU',
        keywords: ['24', '2003', 'Mahkamah Konstitusi'],
      },
    ],
  },

  ROUND_9: {
    name: 'Labor & Environment',
    directory: 'ROUND_9_Labor_Environment',
    laws: [
      {
        title: 'UU No. 2 Tahun 2004',
        type: 'UU',
        keywords: ['2', '2004', 'PHI', 'Hubungan Industrial'],
      },
      { title: 'UU No. 13 Tahun 2003', type: 'UU', keywords: ['13', '2003', 'Ketenagakerjaan'] },
      {
        title: 'UU No. 24 Tahun 2011',
        type: 'UU',
        keywords: ['24', '2011', 'BPJS Ketenagakerjaan'],
      },
      { title: 'UU No. 40 Tahun 2004', type: 'UU', keywords: ['40', '2004', 'SJSN'] },
      { title: 'UU No. 21 Tahun 2000', type: 'UU', keywords: ['21', '2000', 'Serikat Pekerja'] },
      { title: 'UU No. 1 Tahun 1970', type: 'UU', keywords: ['1', '1970', 'Keselamatan Kerja'] },
      {
        title: 'UU No. 3 Tahun 1992',
        type: 'UU',
        keywords: ['3', '1992', 'Jaminan Sosial Tenaga Kerja'],
      },
      {
        title: 'UU No. 39 Tahun 2004',
        type: 'UU',
        keywords: ['39', '2004', 'TKI', 'Tenaga Kerja Indonesia'],
      },
      {
        title: 'UU No. 32 Tahun 2009',
        type: 'UU',
        keywords: ['32', '2009', 'Perlindungan Lingkungan'],
      },
      { title: 'UU No. 18 Tahun 2008', type: 'UU', keywords: ['18', '2008', 'Pengelolaan Sampah'] },
      {
        title: 'UU No. 26 Tahun 2007',
        type: 'UU',
        keywords: ['26', '2007', 'Ruang Terbuka Hijau'],
      },
      { title: 'UU No. 27 Tahun 2007', type: 'UU', keywords: ['27', '2007', 'Wilayah Pesisir'] },
      { title: 'UU No. 19 Tahun 2004', type: 'UU', keywords: ['19', '2004', 'Sumber Daya Air'] },
      { title: 'UU No. 30 Tahun 2007', type: 'UU', keywords: ['30', '2007', 'Energi'] },
      { title: 'UU No. 4 Tahun 2009', type: 'UU', keywords: ['4', '2009', 'Pertambangan'] },
      { title: 'UU No. 30 Tahun 2009', type: 'UU', keywords: ['30', '2009', 'Ketenagalistrikan'] },
      { title: 'UU No. 22 Tahun 2001', type: 'UU', keywords: ['22', '2001', 'Migas'] },
      { title: 'UU No. 23 Tahun 1997', type: 'UU', keywords: ['23', '1997', 'Lingkungan Hidup'] },
      {
        title: 'UU No. 5 Tahun 1990',
        type: 'UU',
        keywords: ['5', '1990', 'Konservasi Sumber Daya Alam'],
      },
    ],
  },

  ROUND_10: {
    name: 'Property & Operational',
    directory: 'ROUND_10_Property_Operational',
    laws: [
      {
        title: 'UU No. 1 Tahun 2011',
        type: 'UU',
        keywords: ['1', '2011', 'Perumahan', 'Permukiman'],
      },
      { title: 'UU No. 5 Tahun 1960', type: 'UU', keywords: ['5', '1960', 'Agraria'] },
      { title: 'UU No. 16 Tahun 1985', type: 'UU', keywords: ['16', '1985', 'Rumah Susun'] },
      { title: 'UU No. 4 Tahun 1996', type: 'UU', keywords: ['4', '1996', 'Hak Tanggungan'] },
      { title: 'UU No. 20 Tahun 2011', type: 'UU', keywords: ['20', '2011', 'Rumah Susun'] },
      { title: 'UU No. 2 Tahun 2012', type: 'UU', keywords: ['2', '2012', 'Pertanahan'] },
      { title: 'UU No. 6 Tahun 2023', type: 'UU', keywords: ['6', '2023', 'Cipta Kerja'] },
      { title: 'UU No. 7 Tahun 2023', type: 'UU', keywords: ['7', '2023', 'Ketenagakerjaan'] },
      { title: 'UU No. 2 Tahun 2017', type: 'UU', keywords: ['2', '2017', 'Keuangan Digital'] },
      { title: 'UU No. 4 Tahun 2023', type: 'UU', keywords: ['4', '2023', 'Sektor Keuangan'] },
      {
        title: 'UU No. 32 Tahun 2004',
        type: 'UU',
        keywords: ['32', '2004', 'Pemerintahan Daerah'],
      },
      {
        title: 'UU No. 23 Tahun 2014',
        type: 'UU',
        keywords: ['23', '2014', 'Pemerintahan Daerah'],
      },
      {
        title: 'UU No. 26 Tahun 2007',
        type: 'UU',
        keywords: ['26', '2007', 'Ruang Terbuka Hijau'],
      },
      { title: 'UU No. 18 Tahun 2008', type: 'UU', keywords: ['18', '2008', 'Pengelolaan Sampah'] },
      {
        title: 'UU No. 32 Tahun 2009',
        type: 'UU',
        keywords: ['32', '2009', 'Perlindungan Lingkungan'],
      },
      { title: 'UU No. 40 Tahun 2004', type: 'UU', keywords: ['40', '2004', 'SJSN'] },
      { title: 'UU No. 24 Tahun 2011', type: 'UU', keywords: ['24', '2011', 'BPJS'] },
      { title: 'UU No. 36 Tahun 2009', type: 'UU', keywords: ['36', '2009', 'Kesehatan'] },
      {
        title: 'UU No. 8 Tahun 1999',
        type: 'UU',
        keywords: ['8', '1999', 'Perlindungan Konsumen'],
      },
    ],
  },
};

// Search function for specific law
async function searchAndDownloadSpecificLaw(lawInfo, roundInfo) {
  console.log(`🔍 Searching: ${lawInfo.title}`);

  try {
    // Navigate to search page
    window.location.href = 'https://peraturan.bpk.go.id/Search';
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Fill search form
    const searchInput = document.querySelector('input[type="text"], input[name="q"]');
    if (searchInput) {
      searchInput.value = lawInfo.title;
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Click search button
    const searchButton = document.querySelector('button[type="submit"], input[type="submit"]');
    if (searchButton) {
      searchButton.click();
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }

    // Find the law in results
    const lawLinks = Array.from(document.querySelectorAll('a[href*="/Detail/"]'));
    let targetLink = null;
    let maxScore = 0;

    for (const link of lawLinks) {
      const linkText = link.textContent.toLowerCase();
      let score = 0;

      // Score based on keywords match
      for (const keyword of lawInfo.keywords) {
        if (linkText.includes(keyword.toLowerCase())) {
          score += 10;
        }
      }

      // Extra score for exact type match
      if (linkText.includes(lawInfo.type.toLowerCase())) {
        score += 5;
      }

      if (score > maxScore) {
        maxScore = score;
        targetLink = link;
      }
    }

    if (targetLink && maxScore > 10) {
      console.log(`✅ Found: ${targetLink.textContent.trim()}`);

      // Click to view details
      targetLink.click();
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Extract full law content
      const lawContent = extractLawContent();
      lawContent.round_info = roundInfo;
      lawContent.law_info = lawInfo;
      lawContent.found_at = new Date().toISOString();

      // Save to file
      saveLawToFile(lawContent, roundInfo, lawInfo);

      return { success: true, law: lawContent };
    } else {
      console.log(`❌ Not found: ${lawInfo.title}`);
      return { success: false, error: 'Law not found' };
    }
  } catch (error) {
    console.error(`❌ Error searching ${lawInfo.title}:`, error);
    return { success: false, error: error.message };
  }
}

// Extract law content from detail page
function extractLawContent() {
  const content = {
    title: '',
    type: '',
    number: '',
    year: '',
    status: '',
    content: '',
    metadata: {},
  };

  // Extract title
  const titleElement = document.querySelector('h1, .title, .judul');
  if (titleElement) {
    content.title = titleElement.textContent.trim();
  }

  // Extract basic info
  const infoElements = document.querySelectorAll('td, th, span');
  for (const element of infoElements) {
    const text = element.textContent.trim();

    if (text.includes('Nomor') || text.includes('No.')) {
      const numberMatch = text.match(/(No\.?\s*\d+|\d+)/);
      if (numberMatch) content.number = numberMatch[1];
    }

    if (text.includes('Tahun')) {
      const yearMatch = text.match(/(19|20)\d{2}/);
      if (yearMatch) content.year = yearMatch[1];
    }

    if (text.includes('UU')) content.type = 'UU';
    else if (text.includes('PP')) content.type = 'PP';
    else if (text.includes('Perpres')) content.type = 'Perpres';

    if (text.includes('Berlaku')) content.status = 'BERLAKU';
    else if (text.includes('Dicabut')) content.status = 'DICABUT';
    else if (text.includes('Tidak Berlaku')) content.status = 'TIDAK_BERLAKU';
  }

  // Extract main content
  const contentElements = document.querySelectorAll('div[class*="content"], div[class*="isi"], p');
  content.content = Array.from(contentElements)
    .map((el) => el.textContent.trim())
    .join('\n');

  content.url = window.location.href;
  content.scraped_at = new Date().toISOString();

  return content;
}

// Save law to JSON file
function saveLawToFile(lawContent, roundInfo, lawInfo) {
  const filename = `${roundInfo.directory}/${lawInfo.type}_${lawInfo.number || 'Unknown'}_${lawInfo.year || 'Unknown'}_${Date.now()}.json`;

  const dataStr = JSON.stringify(lawContent, null, 2);
  const blob = new Blob([dataStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();

  URL.revokeObjectURL(url);
  console.log(`📁 Saved: ${filename}`);
}

// Execute round download
async function executeRound(roundKey) {
  const roundInfo = LAWS_BY_ROUND[roundKey];

  if (!roundInfo) {
    console.error(`❌ Round ${roundKey} not found!`);
    return;
  }

  console.log(`\n🚀 STARTING ${roundKey}: ${roundInfo.name}`);
  console.log(`📋 Laws to download: ${roundInfo.laws.length}`);

  const results = {
    round: roundKey,
    round_info: roundInfo,
    started_at: new Date().toISOString(),
    results: [],
    success_count: 0,
    error_count: 0,
  };

  for (let i = 0; i < roundInfo.laws.length; i++) {
    const lawInfo = roundInfo.laws[i];
    console.log(`\n📄 Law ${i + 1}/${roundInfo.laws.length}: ${lawInfo.title}`);

    const result = await searchAndDownloadSpecificLaw(lawInfo, roundInfo);
    results.results.push(result);

    if (result.success) {
      results.success_count++;
    } else {
      results.error_count++;
    }

    // Wait between requests to avoid rate limiting
    if (i < roundInfo.laws.length - 1) {
      console.log('⏸️ Waiting 3 seconds...');
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  results.completed_at = new Date().toISOString();
  results.total_duration = new Date(results.completed_at) - new Date(results.started_at);

  // Save round summary
  const summaryFilename = `${roundInfo.directory}/ROUND_SUMMARY_${Date.now()}.json`;
  const summaryBlob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
  const summaryUrl = URL.createObjectURL(summaryBlob);

  const summaryLink = document.createElement('a');
  summaryLink.href = summaryUrl;
  summaryLink.download = summaryFilename;
  summaryLink.click();

  URL.revokeObjectURL(summaryUrl);

  console.log(`\n🎉 ROUND ${roundKey} COMPLETED!`);
  console.log(`✅ Success: ${results.success_count}/${roundInfo.laws.length}`);
  console.log(`❌ Errors: ${results.error_count}/${roundInfo.laws.length}`);
  console.log(`⏱️ Duration: ${Math.round(results.total_duration / 1000)} seconds`);
  console.log(`📁 Summary saved: ${summaryFilename}`);

  return results;
}

// Show available rounds
function showAvailableRounds() {
  console.log('\n📋 AVAILABLE ROUNDS:');
  Object.keys(LAWS_BY_ROUND).forEach((key, index) => {
    const round = LAWS_BY_ROUND[key];
    console.log(`${index + 1}. ${key}: ${round.name} (${round.laws.length} laws)`);
  });

  console.log('\n🎯 USAGE:');
  console.log("executeRound('ROUND_1')  // Execute Constitutional Laws");
  console.log("executeRound('ROUND_2')  // Execute Economic Core");
  console.log('... etc');
}

// Initialize
showAvailableRounds();

console.log('\n✅ Script loaded successfully!');
console.log('📋 Use showAvailableRounds() to see all rounds');
console.log("🚀 Use executeRound('ROUND_X') to execute specific round");

// Auto-start if round specified in URL
const urlParams = new URLSearchParams(window.location.search);
const roundParam = urlParams.get('round');
if (roundParam && LAWS_BY_ROUND[roundParam]) {
  console.log(`🚀 Auto-starting round: ${roundParam}`);
  setTimeout(() => executeRound(roundParam), 2000);
}
