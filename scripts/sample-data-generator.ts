/**
 * Sample Data Generator for ZANTARA ChromaDB Migration Tests
 *
 * This utility generates various types of test data including:
 * - Legal documents (KBLI categories)
 * - Financial documents
 * - Technical documentation
 * - Multilingual content
 * - Large files for performance testing
 */

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

// Indonesian KBLI Categories for realistic test data
const KBLI_CATEGORIES = {
  LEGAL: [
    {
      code: '69101',
      name: 'Pertambangan batu bara',
      description:
        'Kegiatan penambangan dan penggalian batu bara termasuk persiapan, pemurnian dan pengangkutan',
      keywords: ['batubara', 'pertambangan', 'energi', 'mineral', 'eksplorasi'],
    },
    {
      code: '64111',
      name: 'Perbankan',
      description: 'Kegiatan perbankan yang menerima simpanan dan memberikan kredit',
      keywords: ['banking', 'kredit', 'simpanan', 'pinjaman', 'finansial'],
    },
    {
      code: '85599',
      name: 'Pendidikan lainnya',
      description: 'Kegiatan pendidikan yang belum diklasifikasikan di tempat lain',
      keywords: ['pendidikan', 'training', 'kursus', 'pelatihan', 'edukasi'],
    },
  ],
  FINANCIAL: [
    {
      code: '64191',
      name: 'Perusahaan pembiayaan',
      description: 'Kegiatan pembiayaan konsumen, modal usaha, dan pembiayaan syariah',
      keywords: ['leasing', 'pembiayaan', 'kredit', 'konsumen', 'syariah'],
    },
    {
      code: '66192',
      name: 'Perusahaan asuransi jiwa',
      description: 'Kegiatan asuransi jiwa, asuransi kesehatan, dan asuransi dana pensiun',
      keywords: ['asuransi', 'jiwa', 'kesehatan', 'pensiun', 'proteksi'],
    },
  ],
  TECHNICAL: [
    {
      code: '62020',
      name: 'Kegiatan teknologi informasi dan komputer',
      description: 'Pengembangan perangkat lunak, konsultasi IT, dan pengolahan data',
      keywords: ['software', 'IT', 'programming', 'database', 'development'],
    },
  ],
};

// Document templates for realistic content
const DOCUMENT_TEMPLATES = {
  LEGAL: `
PT {COMPANY_NAME} - {CATEGORY_CODE} {CATEGORY_NAME}

NOMOR: {DOCUMENT_NUMBER}
TANGGAL: {CURRENT_DATE}
PERIHAL: {SUBJECT}

Kepada Yth,
{RECIPIENT}

Di tempat

Dengan hormat,

Berdasarkan {LEGAL_BASIS}, kami informasikan bahwa perusahaan kami
{COMPANY_DESCRIPTION} telah melakukan {ACTIVITY} sesuai dengan {REGULATION}.

{MAIN_CONTENT}

Demikian pemberitahuan ini kami sampaikan. Atas perhatian dan kerjasamanya
kami ucapkan terima kasih.

Hormat kami,

{SIGNATURE}
{COMPANY_NAME}
{CONTACT_INFO}

{KEYWORDS}
`,

  FINANCIAL: `
LAPORAN KEUANGAN
{COMPANY_NAME}
Periode: {REPORT_PERIOD}

RINGKASAN EKSEKUTIF
{EXECUTIVE_SUMMARY}

ANALISIS FINANSIAL
{FINANCIAL_ANALYSIS}

PROYEKSI DAN REKOMENDASI
{PROJECTIONS}

{KEYWORDS}

Dibuat oleh: {AUTHOR}
Tanggal: {CURRENT_DATE}
`,

  TECHNICAL: `
TECHNICAL SPECIFICATION
Project: {PROJECT_NAME}
Version: {VERSION}
Date: {CURRENT_DATE}

OVERVIEW
{OVERVIEW}

TECHNICAL REQUIREMENTS
{TECHNICAL_REQUIREMENTS}

IMPLEMENTATION GUIDE
{IMPLEMENTATION_GUIDE}

{KEYWORDS}

Author: {AUTHOR}
Team: {TEAM}
`,
};

// Company names for realistic data
const COMPANY_NAMES = [
  'PT Maju Bersama Indonesia',
  'CV Teknologi Nusantara',
  'PT Finansial Digital Indonesia',
  'PT Sumber Daya Alam',
  'PT Edukasi Global',
  'CV Konsultasi Bisnis',
  'PT Energi Terbarukan',
  'PT Asuransi Proteksi',
  'PT Software Development',
  'PT Mining Resources',
];

interface GeneratedDocument {
  id: string;
  content: string;
  metadata: {
    category: string;
    subcategory: string;
    kbli_code: string;
    company: string;
    language: string;
    created_at: string;
    file_size: number;
    keywords: string[];
    type: 'legal' | 'financial' | 'technical';
    version: string;
  };
}

class SampleDataGenerator {
  private static generateRandomId(prefix: string = 'doc'): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `${prefix}_${timestamp}_${random}`;
  }

  private static generateRandomCompany(): string {
    return COMPANY_NAMES[Math.floor(Math.random() * COMPANY_NAMES.length)];
  }

  private static generateCurrentDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  private static generateRandomNumber(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private static generateKeywords(baseKeywords: string[]): string[] {
    const additionalKeywords = ['dokumen', 'indonesia', '2024', 'peraturan', 'standar'];
    return [...baseKeywords, ...additionalKeywords.slice(0, this.generateRandomNumber(1, 3))];
  }

  private static fillTemplate(template: string, variables: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  }

  private static generateLegalDocument(): GeneratedDocument {
    const category =
      KBLI_CATEGORIES.LEGAL[Math.floor(Math.random() * KBLI_CATEGORIES.LEGAL.length)];
    const company = this.generateRandomCompany();
    const documentNumber = `${category.code}/${this.generateRandomNumber(1, 999)}/2024`;

    const variables = {
      COMPANY_NAME: company,
      CATEGORY_CODE: category.code,
      CATEGORY_NAME: category.name,
      DOCUMENT_NUMBER: documentNumber,
      CURRENT_DATE: this.generateCurrentDate(),
      SUBJECT: 'Pemberitahuan Kegiatan Usaha',
      RECIPIENT: 'Kepala Dinas Penanaman Modal',
      LEGAL_BASIS: 'Undang-Undang No. 25 Tahun 2007',
      COMPANY_DESCRIPTION: `perusahaan yang bergerak di bidang ${category.name.toLowerCase()}`,
      ACTIVITY: 'kegiatan operasional',
      REGULATION: 'peraturan yang berlaku',
      MAIN_CONTENT: `Perusahaan kami telah melakukan kegiatan ${category.name.toLowerCase()} sesuai dengan izin yang diberikan. Kami memastikan semua kegiatan mematuhi standar keselamatan dan lingkungan yang berlaku.`,
      SIGNATURE: 'Direktur Utama',
      CONTACT_INFO: `Jl. Jakarta No. 123, Jakarta\nTelp: (021) 1234-5678\nEmail: info@company.com`,
      KEYWORDS: category.keywords.join(', '),
    };

    const content = this.fillTemplate(DOCUMENT_TEMPLATES.LEGAL, variables);

    return {
      id: this.generateRandomId('legal'),
      content,
      metadata: {
        category: 'legal',
        subcategory: category.name,
        kbli_code: category.code,
        company,
        language: 'id',
        created_at: new Date().toISOString(),
        file_size: content.length,
        keywords: this.generateKeywords(category.keywords),
        type: 'legal',
        version: '1.0',
      },
    };
  }

  private static generateFinancialDocument(): GeneratedDocument {
    const category =
      KBLI_CATEGORIES.FINANCIAL[Math.floor(Math.random() * KBLI_CATEGORIES.FINANCIAL.length)];
    const company = this.generateRandomCompany();

    const variables = {
      COMPANY_NAME: company,
      REPORT_PERIOD: 'Januari - Desember 2024',
      EXECUTIVE_SUMMARY: `Laporan keuangan ${company} menunjukkan pertumbuhan yang positif dengan peningkatan pendapatan sebesar 15% dibandingkan tahun sebelumnya.`,
      FINANCIAL_ANALYSIS: `Rasio profitabilitas menunjukkan tren positif dengan ROE mencapai 18.5%. Likuiditas perusahaan tetap terjaga dengan current ratio sebesar 2.3.`,
      PROJECTIONS: `Proyeksi untuk tahun depan memperkirakan pertumbuhan pendapatan sebesar 12-15% dengan margin yang stabil.`,
      KEYWORDS: category.keywords.join(', '),
      AUTHOR: 'Divisi Keuangan',
      CURRENT_DATE: this.generateCurrentDate(),
    };

    const content = this.fillTemplate(DOCUMENT_TEMPLATES.FINANCIAL, variables);

    return {
      id: this.generateRandomId('financial'),
      content,
      metadata: {
        category: 'financial',
        subcategory: category.name,
        kbli_code: category.code,
        company,
        language: 'id',
        created_at: new Date().toISOString(),
        file_size: content.length,
        keywords: this.generateKeywords(category.keywords),
        type: 'financial',
        version: '1.0',
      },
    };
  }

  private static generateTechnicalDocument(): GeneratedDocument {
    const category = KBLI_CATEGORIES.TECHNICAL[0]; // Only one technical category
    const company = this.generateRandomCompany();
    const projectNames = [
      'E-Commerce Platform',
      'Banking System',
      'Data Analytics Dashboard',
      'Mobile Application',
    ];

    const variables = {
      PROJECT_NAME: projectNames[Math.floor(Math.random() * projectNames.length)],
      VERSION: '2.1.0',
      CURRENT_DATE: this.generateCurrentDate(),
      OVERVIEW:
        'Proyek pengembangan sistem aplikasi berbasis web dengan arsitektur microservices untuk mendukung operasional bisnis.',
      TECHNICAL_REQUIREMENTS: `- Backend: Node.js dengan framework Express.js\n- Database: PostgreSQL untuk data transaksional\n- Cache: Redis untuk performa\n- Frontend: React.js dengan TypeScript\n- Deployment: Docker di Google Cloud Platform`,
      IMPLEMENTATION_GUIDE:
        '1. Setup development environment\n2. Install dependencies\n3. Configure database\n4. Run development server\n5. Run test suite',
      KEYWORDS: category.keywords.join(', '),
      AUTHOR: 'Tim Pengembangan',
      TEAM: 'Software Development Team',
    };

    const content = this.fillTemplate(DOCUMENT_TEMPLATES.TECHNICAL, variables);

    return {
      id: this.generateRandomId('technical'),
      content,
      metadata: {
        category: 'technical',
        subcategory: category.name,
        kbli_code: category.code,
        company,
        language: 'id',
        created_at: new Date().toISOString(),
        file_size: content.length,
        keywords: this.generateKeywords(category.keywords),
        type: 'technical',
        version: variables.VERSION,
      },
    };
  }

  static generateDocuments(count: number, types?: string[]): GeneratedDocument[] {
    const documents: GeneratedDocument[] = [];
    const availableTypes = types || ['legal', 'financial', 'technical'];

    for (let i = 0; i < count; i++) {
      const type = availableTypes[i % availableTypes.length];

      switch (type) {
        case 'legal':
          documents.push(this.generateLegalDocument());
          break;
        case 'financial':
          documents.push(this.generateFinancialDocument());
          break;
        case 'technical':
          documents.push(this.generateTechnicalDocument());
          break;
        default:
          documents.push(this.generateLegalDocument());
      }
    }

    return documents;
  }

  static generateLargeDocuments(count: number, sizeMultiplier: number = 10): GeneratedDocument[] {
    const documents = this.generateDocuments(count);

    return documents.map((doc) => {
      const contentMultiplier = sizeMultiplier;
      const originalContent = doc.content;
      const largeContent =
        originalContent +
        '\n\n' +
        'ADDITIONAL CONTENT FOR SIZE TESTING. '.repeat(contentMultiplier * 20) +
        '\n\n' +
        'Lorem ipsum dolor sit amet, consectetur adipiscing elit. '.repeat(contentMultiplier * 30);

      return {
        ...doc,
        content: largeContent,
        metadata: {
          ...doc.metadata,
          file_size: largeContent.length,
          type: 'large_document' as any,
        },
      };
    });
  }

  static generateMultilingualDocuments(count: number): GeneratedDocument[] {
    const documents: GeneratedDocument[] = [];
    const languages = ['id', 'en', 'zh', 'ar'];
    const greetings = {
      id: 'Halo',
      en: 'Hello',
      zh: '你好',
      ar: 'مرحبا',
    };

    for (let i = 0; i < count; i++) {
      const language = languages[i % languages.length];
      const greeting = greetings[language as keyof typeof greetings];

      const content = `${greeting}, ini adalah dokumen multilingual nomor ${i + 1}.

This document contains content in multiple languages to test internationalization support.

这是测试多语言支持的内容。

هذا محتوى لاختبار دعم اللغات المتعددة.

${'Additional content for testing purposes. '.repeat(10)}`;

      documents.push({
        id: this.generateRandomId('multilingual'),
        content,
        metadata: {
          category: 'test',
          subcategory: 'multilingual',
          kbli_code: '99999',
          company: 'Multilingual Test Company',
          language,
          created_at: new Date().toISOString(),
          file_size: content.length,
          keywords: ['multilingual', 'test', 'i18n', 'international'],
          type: 'test' as any,
          version: '1.0',
        },
      });
    }

    return documents;
  }

  static async saveDocumentsToFile(
    documents: GeneratedDocument[],
    filePath: string
  ): Promise<void> {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const jsonData = JSON.stringify(documents, null, 2);
    fs.writeFileSync(filePath, jsonData, 'utf8');
  }

  static async saveDocumentsAsTextFiles(
    documents: GeneratedDocument[],
    outputDir: string
  ): Promise<string[]> {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePaths: string[] = [];

    for (const doc of documents) {
      const fileName = `${doc.id}.txt`;
      const filePath = path.join(outputDir, fileName);

      // Add metadata header to the file
      const fileContent = `ID: ${doc.id}
Company: ${doc.metadata.company}
Category: ${doc.metadata.category} (${doc.metadata.kbli_code})
Language: ${doc.metadata.language}
Created: ${doc.metadata.created_at}
Size: ${doc.metadata.file_size} bytes
Keywords: ${doc.metadata.keywords.join(', ')}

----------------------------------------

${doc.content}`;

      fs.writeFileSync(filePath, fileContent, 'utf8');
      filePaths.push(filePath);
    }

    return filePaths;
  }

  static generateDatasetSummary(documents: GeneratedDocument[]): {
    total: number;
    byCategory: Record<string, number>;
    byLanguage: Record<string, number>;
    avgSize: number;
    totalSize: number;
  } {
    const summary = {
      total: documents.length,
      byCategory: {} as Record<string, number>,
      byLanguage: {} as Record<string, number>,
      avgSize: 0,
      totalSize: 0,
    };

    documents.forEach((doc) => {
      // Count by category
      summary.byCategory[doc.metadata.category] =
        (summary.byCategory[doc.metadata.category] || 0) + 1;

      // Count by language
      summary.byLanguage[doc.metadata.language] =
        (summary.byLanguage[doc.metadata.language] || 0) + 1;

      // Calculate size
      summary.totalSize += doc.metadata.file_size;
    });

    summary.avgSize = summary.totalSize / documents.length;

    return summary;
  }
}

// CLI interface for standalone execution
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'generate':
      const count = parseInt(args[1]) || 100;
      const outputDir = args[2] || './sample-data';

      console.log(`Generating ${count} sample documents...`);

      const documents = SampleDataGenerator.generateDocuments(count);
      const summary = SampleDataGenerator.generateDatasetSummary(documents);

      // Save as JSON
      await SampleDataGenerator.saveDocumentsToFile(
        documents,
        path.join(outputDir, 'documents.json')
      );

      // Save as individual text files
      const textFiles = await SampleDataGenerator.saveDocumentsAsTextFiles(
        documents,
        path.join(outputDir, 'text-files')
      );

      console.log(`✅ Generated ${documents.length} documents`);
      console.log(`📁 JSON file: ${path.join(outputDir, 'documents.json')}`);
      console.log(
        `📄 Text files: ${textFiles.length} files in ${path.join(outputDir, 'text-files')}`
      );
      console.log('\n📊 Dataset Summary:');
      console.log(`   Total documents: ${summary.total}`);
      console.log(`   By category:`, summary.byCategory);
      console.log(`   By language:`, summary.byLanguage);
      console.log(`   Average size: ${summary.avgSize.toFixed(0)} bytes`);
      console.log(`   Total size: ${(summary.totalSize / 1024 / 1024).toFixed(2)} MB`);

      break;

    case 'large':
      const largeCount = parseInt(args[1]) || 50;
      const sizeMultiplier = parseInt(args[2]) || 10;
      const largeOutputDir = args[3] || './large-sample-data';

      console.log(`Generating ${largeCount} large documents (${sizeMultiplier}x size)...`);

      const largeDocuments = SampleDataGenerator.generateLargeDocuments(largeCount, sizeMultiplier);
      await SampleDataGenerator.saveDocumentsToFile(
        largeDocuments,
        path.join(largeOutputDir, 'large-documents.json')
      );

      console.log(`✅ Generated ${largeDocuments.length} large documents`);
      console.log(`📁 File: ${path.join(largeOutputDir, 'large-documents.json')}`);

      break;

    case 'multilingual':
      const multiCount = parseInt(args[1]) || 25;
      const multiOutputDir = args[2] || './multilingual-data';

      console.log(`Generating ${multiCount} multilingual documents...`);

      const multiDocuments = SampleDataGenerator.generateMultilingualDocuments(multiCount);
      await SampleDataGenerator.saveDocumentsToFile(
        multiDocuments,
        path.join(multiOutputDir, 'multilingual-documents.json')
      );

      console.log(`✅ Generated ${multiDocuments.length} multilingual documents`);
      console.log(`📁 File: ${path.join(multiOutputDir, 'multilingual-documents.json')}`);

      break;

    default:
      console.log('Usage:');
      console.log('  node sample-data-generator.js generate [count] [output-dir]');
      console.log('  node sample-data-generator.js large [count] [size-multiplier] [output-dir]');
      console.log('  node sample-data-generator.js multilingual [count] [output-dir]');
      console.log('');
      console.log('Examples:');
      console.log('  node sample-data-generator.js generate 100 ./sample-data');
      console.log('  node sample-data-generator.js large 20 5 ./large-data');
      console.log('  node sample-data-generator.js multilingual 40 ./multi-data');
  }
}

// Export for use in test files
export { SampleDataGenerator, GeneratedDocument };

// Run CLI if called directly
if (require.main === module) {
  main().catch(console.error);
}
