import fs from 'node:fs';
import { promises as fsp } from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';

interface DatasetEntry {
  id: string;
  path: string;
  category: string;
  region_scope?: string;
  target_examples: number;
  priority?: string;
  notes?: string;
}

interface DatasetManifest {
  description?: string;
  datasets: DatasetEntry[];
}

interface ReportRow {
  id: string;
  category: string;
  priority: string;
  exists: boolean;
  resolvedPath: string;
  lineCount: number;
  target: number;
  coveragePct: string;
  gap: number;
  notes: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..', '..');
const manifestPath = path.resolve(repoRoot, 'data/nusantara/dataset_manifest.json');

async function loadManifest(): Promise<DatasetManifest> {
  try {
    const raw = await fsp.readFile(manifestPath, 'utf-8');
    return JSON.parse(raw) as DatasetManifest;
  } catch (error) {
    throw new Error(`Unable to read dataset manifest at ${manifestPath}: ${(error as Error).message}`);
  }
}

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fsp.access(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function countLines(filePath: string): Promise<number> {
  const stream = fs.createReadStream(filePath, { encoding: 'utf-8' });
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });

  let count = 0;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  for await (const _ of rl) {
    count += 1;
  }
  rl.close();
  return count;
}

function formatPercentage(current: number, target: number): string {
  if (!target) return '0%';
  const pct = (current / target) * 100;
  return `${pct.toFixed(1)}%`;
}

async function buildReport(manifest: DatasetManifest): Promise<ReportRow[]> {
  const rows: ReportRow[] = [];

  for (const dataset of manifest.datasets) {
    const resolvedPath = path.resolve(repoRoot, dataset.path);
    const exists = await fileExists(resolvedPath);
    const lineCount = exists ? await countLines(resolvedPath) : 0;
    const target = dataset.target_examples ?? 0;
    const gap = target - lineCount;

    rows.push({
      id: dataset.id,
      category: dataset.category,
      priority: dataset.priority ?? 'unspecified',
      exists,
      resolvedPath,
      lineCount,
      target,
      coveragePct: formatPercentage(lineCount, target),
      gap,
      notes: dataset.notes ?? ''
    });
  }

  return rows;
}

function printReport(rows: ReportRow[]): void {
  console.log('');
  console.log('🇮🇩 Nusantara Dataset Coverage Summary');
  console.log('='.repeat(60));

  const headers = ['ID', 'Category', 'Priority', 'Exists', 'Lines', 'Target', 'Coverage', 'Gap', 'Path'];
  console.log(headers.join('\t'));

  for (const row of rows) {
    console.log([
      row.id,
      row.category,
      row.priority,
      row.exists ? '✅' : '❌',
      row.lineCount,
      row.target,
      row.coveragePct,
      row.gap,
      row.resolvedPath
    ].join('\t'));
  }

  console.log('');
  const totalLines = rows.reduce((acc, row) => acc + row.lineCount, 0);
  const totalTarget = rows.reduce((acc, row) => acc + row.target, 0);
  console.log(`Total examples: ${totalLines} / ${totalTarget} (${formatPercentage(totalLines, totalTarget)})`);

  const missing = rows.filter((row) => !row.exists);
  if (missing.length) {
    console.log('');
    console.log('⚠️  Missing datasets');
    for (const row of missing) {
      console.log(` - ${row.id} → expected at ${row.resolvedPath}`);
    }
  }

  console.log('');
}

async function main(): Promise<void> {
  const manifest = await loadManifest();
  const rows = await buildReport(manifest);
  printReport(rows);
}

main().catch((error) => {
  console.error('Failed to build Nusantara dataset report');
  console.error(error);
  process.exitCode = 1;
});
