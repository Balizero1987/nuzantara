import { promises as fs } from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

export type IntelClassification = 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL';
export type IntelPriority = 'low' | 'medium' | 'high' | 'critical';

export interface RawIntelRecord {
  id?: string;
  source: string;
  title: string;
  summary?: string;
  content: string;
  url?: string;
  publishedAt?: string;
  collectedAt: string;
  tags?: string[];
  priority?: IntelPriority;
}

export interface NormalizedIntelRecord extends RawIntelRecord {
  id: string;
  classification: IntelClassification;
  relevanceScore: number;
  hash: string;
}

export interface ClassificationRules {
  confidentialKeywords?: string[];
  internalKeywords?: string[];
  publicKeywords?: string[];
  forcePublicTags?: string[];
}

export interface RelevanceRules {
  baseScore?: number;
  highImpactKeywords?: string[];
  mediumImpactKeywords?: string[];
  decayDays?: number;
}

export interface NormalizationOptions {
  agentSlug: string;
  classificationRules?: ClassificationRules;
  relevanceRules?: RelevanceRules;
  storage?: {
    rawDir?: string;
    normalizedDir?: string;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_RAW_ROOT = path.resolve(__dirname, '../../data/raw');
const DEFAULT_NORMALIZED_ROOT = path.resolve(__dirname, '../../data/normalized');

export function todayStamp(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

function hashRecord(record: RawIntelRecord): string {
  const payload = `${record.source}|${record.title}|${record.summary || ''}|${record.content}`;
  return createHash('sha256').update(payload).digest('hex');
}

function classifyRecord(
  record: RawIntelRecord,
  rules: ClassificationRules | undefined
): IntelClassification {
  const haystack = `${record.title} ${record.summary || ''} ${record.content}`.toLowerCase();
  if (rules?.confidentialKeywords?.some(keyword => haystack.includes(keyword.toLowerCase()))) {
    return 'CONFIDENTIAL';
  }

  if (rules?.internalKeywords?.some(keyword => haystack.includes(keyword.toLowerCase()))) {
    return 'INTERNAL';
  }

  if (rules?.publicKeywords && rules.publicKeywords.some(keyword => haystack.includes(keyword.toLowerCase()))) {
    return 'PUBLIC';
  }

  return record.priority === 'critical' ? 'INTERNAL' : 'PUBLIC';
}

function computeRelevanceScore(
  record: RawIntelRecord,
  rules: RelevanceRules | undefined
): number {
  const baseScore = rules?.baseScore ?? 25;
  let score = baseScore;
  const haystack = `${record.title} ${record.summary || ''} ${record.content}`.toLowerCase();

  if (rules?.highImpactKeywords) {
    rules.highImpactKeywords.forEach(keyword => {
      if (haystack.includes(keyword.toLowerCase())) {
        score += 35;
      }
    });
  }

  if (rules?.mediumImpactKeywords) {
    rules.mediumImpactKeywords.forEach(keyword => {
      if (haystack.includes(keyword.toLowerCase())) {
        score += 15;
      }
    });
  }

  switch (record.priority) {
    case 'critical':
      score += 40;
      break;
    case 'high':
      score += 20;
      break;
    case 'medium':
      score += 10;
      break;
    default:
      break;
  }

  if (record.publishedAt) {
    const publishedDate = new Date(record.publishedAt);
    if (!Number.isNaN(publishedDate.getTime())) {
      const ageInDays = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
      const decayDays = rules?.decayDays ?? 14;
      const decay = Math.max(0, decayDays - ageInDays);
      score += Math.round(decay);
    }
  }

  return Math.min(100, score);
}

export function normalizeIntelRecords(
  records: RawIntelRecord[],
  options: NormalizationOptions
): NormalizedIntelRecord[] {
  const { classificationRules, relevanceRules, agentSlug } = options;

  return records.map(record => {
    const hash = hashRecord(record);
    const id = record.id ?? `${agentSlug}_${hash.slice(0, 12)}`;
    const classification = classifyRecord(record, classificationRules);
    const relevanceScore = computeRelevanceScore(record, relevanceRules);

    return {
      ...record,
      id,
      classification,
      relevanceScore,
      hash
    };
  });
}

async function loadExistingHashes(filePath: string): Promise<Set<string>> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(raw) as NormalizedIntelRecord[];
    return new Set(data.map(item => item.hash));
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return new Set();
    }
    throw error;
  }
}

async function persistRecords(
  records: NormalizedIntelRecord[],
  agentSlug: string,
  type: 'raw' | 'normalized',
  dateStamp = todayStamp()
): Promise<string | null> {
  if (records.length === 0) {
    return null;
  }

  const root = type === 'raw' ? DEFAULT_RAW_ROOT : DEFAULT_NORMALIZED_ROOT;
  const dir = path.join(root, agentSlug);
  await ensureDir(dir);

  const filePath = path.join(dir, `${dateStamp}.json`);
  const existingHashes = await loadExistingHashes(filePath);

  const deduped = records.filter(record => {
    if (existingHashes.has(record.hash)) {
      return false;
    }
    existingHashes.add(record.hash);
    return true;
  });

  // Reload existing file to keep previous entries
  let existingRecords: NormalizedIntelRecord[] = [];
  if (await fs.stat(filePath).catch(() => false)) {
    const raw = await fs.readFile(filePath, 'utf-8');
    existingRecords = JSON.parse(raw) as NormalizedIntelRecord[];
  }

  const nextPayload = [...existingRecords, ...deduped];
  await fs.writeFile(filePath, JSON.stringify(nextPayload, null, 2), 'utf-8');

  return filePath;
}

export async function persistRawIntel(
  agentSlug: string,
  records: NormalizedIntelRecord[],
  dateStamp = todayStamp()
): Promise<string | null> {
  return persistRecords(records, agentSlug, 'raw', dateStamp);
}

export async function persistNormalizedIntel(
  agentSlug: string,
  records: NormalizedIntelRecord[],
  dateStamp = todayStamp()
): Promise<string | null> {
  return persistRecords(records, agentSlug, 'normalized', dateStamp);
}

export async function writeDigest(
  agentSlug: string,
  dateStamp: string,
  markdown: string
): Promise<string> {
  const reportsRoot = path.resolve(__dirname, '../../reports');
  const dir = path.join(reportsRoot, agentSlug);
  await ensureDir(dir);
  const filePath = path.join(dir, `daily-${dateStamp}.md`);
  await fs.writeFile(filePath, markdown.trim() + '\n', 'utf-8');
  return filePath;
}

export function buildDigestMarkdown(
  agentName: string,
  records: NormalizedIntelRecord[],
  dateStamp = todayStamp()
): string {
  const headline = `# ${agentName.toUpperCase()} Daily Intelligence (${dateStamp})`;

  if (records.length === 0) {
    return `${headline}\n\n_No new intelligence captured today._`;
  }

  const sorted = [...records].sort((a, b) => b.relevanceScore - a.relevanceScore);
  const highlights = sorted.slice(0, 3);
  const rest = sorted.slice(3);

  const highlightSection = highlights
    .map(record => `- **${record.title.trim()}** — ${record.summary || record.content.slice(0, 160)}... (score: ${record.relevanceScore})`)
    .join('\n');

  const detailsSection = rest
    .map(record => `- ${record.title.trim()} (${record.classification})\n  - Source: ${record.source}${record.url ? ` — ${record.url}` : ''}\n  - Score: ${record.relevanceScore}`)
    .join('\n');

  return [
    headline,
    '',
    '## Highlights',
    highlightSection || '_No high priority highlights._',
    '',
    '## Additional Intelligence',
    detailsSection || '_No additional items._'
  ].join('\n');
}
