import { promises as fs } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { todayStamp, NormalizedIntelRecord } from './intel-processor';

export interface ClassificationCounts {
  PUBLIC: number;
  INTERNAL: number;
  CONFIDENTIAL: number;
}

export interface HighlightItem {
  id: string;
  title: string;
  relevanceScore: number;
  classification: string;
  url?: string;
  source: string;
}

export interface AgentDashboardSummary {
  agentSlug: string;
  dateStamp: string;
  totalRecords: number;
  classificationCounts: ClassificationCounts;
  topHighlights: HighlightItem[];
  alerts: HighlightItem[];
  sourceBreakdown: Record<string, number>;
}

export interface DashboardReport {
  dateStamp: string;
  generatedAt: string;
  agents: AgentDashboardSummary[];
  totals: {
    records: number;
    alerts: number;
  };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NORMALIZED_ROOT = path.resolve(__dirname, '../../data/normalized');
const DASHBOARD_ROOT = path.resolve(__dirname, '../../reports/dashboard');

async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

async function loadNormalizedRecords(agentSlug: string, dateStamp: string): Promise<NormalizedIntelRecord[]> {
  const filePath = path.join(NORMALIZED_ROOT, agentSlug, `${dateStamp}.json`);

  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(raw) as NormalizedIntelRecord[];
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      return [];
    }
    throw error;
  }
}

function computeClassificationCounts(records: NormalizedIntelRecord[]): ClassificationCounts {
  const counts: ClassificationCounts = {
    PUBLIC: 0,
    INTERNAL: 0,
    CONFIDENTIAL: 0,
  };

  records.forEach(record => {
    counts[record.classification as keyof ClassificationCounts] =
      (counts[record.classification as keyof ClassificationCounts] || 0) + 1;
  });

  return counts;
}

function toHighlightItem(record: NormalizedIntelRecord): HighlightItem {
  return {
    id: record.id,
    title: record.title,
    relevanceScore: record.relevanceScore,
    classification: record.classification,
    url: record.url,
    source: record.source,
  };
}

function pickTopRecords(
  records: NormalizedIntelRecord[],
  limit: number,
  predicate: (record: NormalizedIntelRecord) => boolean
): HighlightItem[] {
  return records
    .filter(predicate)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, limit)
    .map(toHighlightItem);
}

function computeAlerts(records: NormalizedIntelRecord[], limit: number): HighlightItem[] {
  return pickTopRecords(
    records,
    limit,
    record =>
      record.classification !== 'PUBLIC' ||
      record.relevanceScore >= 70 ||
      record.priority === 'critical' ||
      record.priority === 'high'
  );
}

function computeTopHighlights(records: NormalizedIntelRecord[], limit: number): HighlightItem[] {
  return pickTopRecords(records, limit, record => record.classification === 'PUBLIC');
}

function computeSourceBreakdown(records: NormalizedIntelRecord[]): Record<string, number> {
  return records.reduce<Record<string, number>>((acc, record) => {
    acc[record.source] = (acc[record.source] || 0) + 1;
    return acc;
  }, {});
}

export async function buildAgentDashboardSummary(
  agentSlug: string,
  dateStamp: string
): Promise<AgentDashboardSummary> {
  const records = await loadNormalizedRecords(agentSlug, dateStamp);

  return {
    agentSlug,
    dateStamp,
    totalRecords: records.length,
    classificationCounts: computeClassificationCounts(records),
    topHighlights: computeTopHighlights(records, 3),
    alerts: computeAlerts(records, 5),
    sourceBreakdown: computeSourceBreakdown(records),
  };
}

export async function buildDashboardReport(
  agentSlugs: string[],
  dateStamp = todayStamp()
): Promise<DashboardReport> {
  const summaries = await Promise.all(
    agentSlugs.map(slug => buildAgentDashboardSummary(slug, dateStamp))
  );

  const totalRecords = summaries.reduce((sum, summary) => sum + summary.totalRecords, 0);
  const totalAlerts = summaries.reduce((sum, summary) => sum + summary.alerts.length, 0);

  return {
    dateStamp,
    generatedAt: new Date().toISOString(),
    agents: summaries,
    totals: {
      records: totalRecords,
      alerts: totalAlerts,
    },
  };
}

export async function persistDashboardReport(report: DashboardReport): Promise<string> {
  await ensureDir(DASHBOARD_ROOT);
  const filePath = path.join(DASHBOARD_ROOT, `daily-${report.dateStamp}.json`);
  await fs.writeFile(filePath, JSON.stringify(report, null, 2), 'utf-8');
  return filePath;
}
