#!/usr/bin/env node
const fs = require('fs');

const API_URL = process.env.API_URL || 'http://localhost:8080';
const API_KEY = process.env.API_KEY || 'zantara-internal-dev-key-2025';

const cases = [
  { name: 'tools.list', body: { key: 'system.handlers.tools' } },
  { name: 'memory.search.semantic', body: { key: 'memory.search.semantic', params: { query: 'KITAS process steps' } } },
  { name: 'memory.search.hybrid', body: { key: 'memory.search.hybrid', params: { query: 'tax expert' } } },
  { name: 'memory.search.entity', body: { key: 'memory.search.entity', params: { entity: 'zero' } } },
  { name: 'memory.entities', body: { key: 'memory.entities', params: { userId: 'zero' } } },
  { name: 'memory.entity.info', body: { key: 'memory.entity.info', params: { entity: 'google_workspace' } } },
  { name: 'memory.entity.events', body: { key: 'memory.entity.events', params: { entity: 'google_workspace', category: 'projects' } } },
  { name: 'memory.event.save', body: { key: 'memory.event.save', params: { userId: 'zero', event: 'Deploy', type: 'deployment' } } },
  { name: 'memory.timeline.get', body: { key: 'memory.timeline.get', params: { userId: 'zero', startDate: '2025-10-01', endDate: '2025-10-07' } } },
  { name: 'memory.search', body: { key: 'memory.search', params: { query: 'KITAS' } } },
  { name: 'lead.save', body: { key: 'lead.save', params: { name: 'Mario Rossi', email: 'mario@example.com', source: 'web', service: 'visa' } } },
  { name: 'quote.generate', body: { key: 'quote.generate', params: { service: 'KITAS', country: 'ID', tier: 'standard' } } },
  { name: 'document.prepare', body: { key: 'document.prepare', params: { type: 'proposal', customer: { name: 'Mario' }, details: { items: 2 } } } },
  { name: 'maps.directions', body: { key: 'maps.directions', params: { origin: 'Denpasar', destination: 'Canggu' } } },
  { name: 'maps.places', body: { key: 'maps.places', params: { query: 'immigration office Bali' } } },
  { name: 'maps.placeDetails', body: { key: 'maps.placeDetails', params: { placeId: 'test' } } },
];

async function call(body) {
  const res = await fetch(`${API_URL}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  let json = {};
  try { json = await res.json(); } catch {}
  return { status: res.status, json };
}

(async () => {
  const logDir = '.claude/test-logs';
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = `${logDir}/${new Date().toISOString().slice(0,10)}_critical-handlers.jsonl`;
  const stream = fs.createWriteStream(logFile, { flags: 'a' });

  const STRICT_MAPS = String(process.env.STRICT_MAPS || 'false') === 'true';
  let pass = 0; let fail = 0;
  for (const c of cases) {
    try {
      const r = await call(c.body);
      let ok = r.json && r.status === 200 && (r.json.ok !== false);
      if (c.name.startsWith('maps.')) {
        const msg = typeof r.json === 'object' ? JSON.stringify(r.json) : '';
        if (!STRICT_MAPS && r.status === 400 && msg.includes('API key not configured')) ok = true;
      }
      if (ok) pass++; else fail++;
      stream.write(JSON.stringify({ case: c.name, status: r.status, ok: r.json?.ok, sample: JSON.stringify(r.json)?.slice(0,300) }) + '\n');
      console.log(`${ok ? '✅' : '❌'} ${c.name} (${r.status})`);
    } catch (e) {
      fail++;
      stream.write(JSON.stringify({ case: c.name, error: String(e) }) + '\n');
      console.log(`❌ ${c.name} (error)`);
    }
  }
  stream.end();
  console.log(`\nResult: ${pass} passed, ${fail} failed. Logs: ${logFile}`);
  process.exit(fail ? 1 : 0);
})().catch(err => { console.error(err); process.exit(1); });
