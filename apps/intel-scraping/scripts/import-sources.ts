// import-sources.ts
import { Pool } from 'pg';
import * as yaml from 'js-yaml';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

interface Source {
  name: string;
  url: string;
  language: string;
  selectors?: {
    title?: string;
    content?: string;
    date?: string;
  };
  reliability: number;
  frequency: string;
}

async function importSources() {
  try {
    const sourcesYamlPath = path.join(__dirname, '../sources.yaml');
    const sourcesYaml = fs.readFileSync(sourcesYamlPath, 'utf8');
    const sources = yaml.load(sourcesYaml) as any;

    let totalImported = 0;

    for (const [category, tiers] of Object.entries(sources)) {
      for (const [tier, sourceList] of Object.entries(tiers as any)) {
        const tierName = tier.replace('tier_', 'T').toUpperCase();

        for (const source of sourceList as Source[]) {
          try {
            await pool.query(`
              INSERT INTO sources (
                url, name, category, tier, language,
                reliability_score, scrape_frequency, selectors
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
              ON CONFLICT (url) DO UPDATE SET
                name = EXCLUDED.name,
                reliability_score = EXCLUDED.reliability_score,
                updated_at = CURRENT_TIMESTAMP
            `, [
              source.url,
              source.name,
              category,
              tierName,
              source.language || 'en',
              source.reliability || 5.0,
              source.frequency || '48h',
              JSON.stringify(source.selectors || {})
            ]);

            totalImported++;
            console.log(`✅ Imported: ${source.name} (${category}/${tierName})`);
          } catch (error) {
            console.error(`❌ Failed to import ${source.name}:`, error);
          }
        }
      }
    }

    console.log(`\n🎉 Successfully imported ${totalImported} sources!`);
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run import
importSources().catch(console.error);

