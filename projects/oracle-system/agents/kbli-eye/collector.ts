import cron from 'node-cron';
import { fetchSource, IntelSource } from '../utils/intel-collector';
import {
  buildDigestMarkdown,
  normalizeIntelRecords,
  NormalizedIntelRecord,
  NormalizationOptions,
  persistNormalizedIntel,
  persistRawIntel,
  todayStamp,
  writeDigest,
} from '../utils/intel-processor';

const AGENT_SLUG = 'kbli-eye';

const KBLI_SOURCES: IntelSource[] = [
  {
    id: 'oss-news',
    label: 'OSS RBA Updates',
    url: 'https://news.google.com/rss/search?q=site%3Aoss.go.id%20pengumuman&hl=id&gl=ID&ceid=ID:id',
    type: 'rss',
    frequencyMinutes: 120,
  },
  {
    id: 'bkpm-press',
    label: 'BKPM Press Releases',
    url: 'https://news.google.com/rss/search?q=site%3Abkpm.go.id%20press%20release&hl=id&gl=ID&ceid=ID:id',
    type: 'rss',
    frequencyMinutes: 240,
  },
  {
    id: 'permendag-updates',
    label: 'Kementerian Perdagangan',
    url: 'https://news.google.com/rss/search?q=site%3Akemendag.go.id%20peraturan&hl=id&gl=ID&ceid=ID:id',
    type: 'rss',
    frequencyMinutes: 360,
  },
];

function getNormalizationOptions(): NormalizationOptions {
  return {
    agentSlug: AGENT_SLUG,
    classificationRules: {
      confidentialKeywords: ['strategic', 'internal memo'],
      internalKeywords: ['compliance', 'regulation change', 'policy draft'],
      publicKeywords: ['announcement', 'licensing', 'kbli'],
    },
    relevanceRules: {
      baseScore: 25,
      highImpactKeywords: ['investasi', 'investment', 'restriction', 'izin', 'license', 'mandatory'],
      mediumImpactKeywords: ['kbli', 'oss', 'nib', 'timeline', 'permendag', 'permen'],
      decayDays: 28,
    },
  };
}

function enrichTags(record: NormalizedIntelRecord): NormalizedIntelRecord {
  const tags = new Set(record.tags || []);
  tags.add('kbli');
  tags.add('business');
  tags.add('licensing');
  return {
    ...record,
    tags: Array.from(tags),
  };
}

async function collectFromSources(now = new Date()): Promise<NormalizedIntelRecord[]> {
  const rawRecords = [];
  for (const source of KBLI_SOURCES) {
    try {
      const records = await fetchSource(source, { now });
      rawRecords.push(
        ...records.map(record => ({
          ...record,
          collectedAt: now.toISOString(),
          priority: record.priority || (source.id.includes('oss') ? 'high' : 'medium'),
          tags: [...(record.tags || []), 'kbli'],
        }))
      );
    } catch (error) {
      console.warn(`[${AGENT_SLUG}] Failed to fetch ${source.id}:`, error);
    }
  }

  const normalizationOptions = getNormalizationOptions();
  const normalized = normalizeIntelRecords(rawRecords, normalizationOptions).map(enrichTags);

  const stamp = todayStamp(now);
  await persistRawIntel(AGENT_SLUG, normalized, stamp);
  await persistNormalizedIntel(AGENT_SLUG, normalized, stamp);

  return normalized;
}

export async function generateKbliEyeDigest(now = new Date()): Promise<{ records: NormalizedIntelRecord[]; digestPath?: string; digestMarkdown: string; }> {
  const normalized = await collectFromSources(now);
  const stamp = todayStamp(now);
  const markdown = buildDigestMarkdown('KBLI Eye', normalized, stamp);
  let digestPath: string | undefined;

  if (normalized.length > 0) {
    digestPath = await writeDigest(AGENT_SLUG, stamp, markdown);
  }

  return { records: normalized, digestPath, digestMarkdown: markdown };
}

export function scheduleKbliEyeCollectors(): cron.ScheduledTask {
  const job = cron.schedule('15 */2 * * *', async () => {
    const now = new Date();
    const result = await generateKbliEyeDigest(now);
    console.log(`[${AGENT_SLUG}] Collected ${result.records.length} records at ${now.toISOString()}`);
  });

  return job;
}
