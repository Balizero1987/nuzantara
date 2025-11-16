// test-connectivity.ts
import axios from 'axios';
import { Pool } from 'pg';
import pLimit from 'p-limit';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const limit = pLimit(10); // Max 10 concurrent requests

async function testConnectivity() {
  try {
    // Get all T1 sources
    const { rows: sources } = await pool.query(`
      SELECT id, name, url, category
      FROM sources
      WHERE tier = 'T1' AND active = true
      ORDER BY category, name
    `);

    console.log(`🔍 Testing ${sources.length} Tier 1 sources...\n`);

    const results = await Promise.all(
      sources.map(source => limit(async () => {
        try {
          const response = await axios.get(source.url, {
            timeout: 10000,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; BaliZeroBot/1.0)'
            }
          });

          const status = response.status;
          const success = status >= 200 && status < 300;

          // Update last_scraped if successful
          if (success) {
            await pool.query(
              'UPDATE sources SET last_scraped = CURRENT_TIMESTAMP WHERE id = $1',
              [source.id]
            );
          }

          return {
            ...source,
            status,
            success,
            message: success ? 'OK' : `HTTP ${status}`
          };
        } catch (error: any) {
          return {
            ...source,
            status: 0,
            success: false,
            message: error.code || error.message
          };
        }
      }))
    );

    // Print results by category
    const categories = [...new Set(sources.map(s => s.category))];

    for (const category of categories) {
      const categoryResults = results.filter(r => r.category === category);
      const successCount = categoryResults.filter(r => r.success).length;

      console.log(`\n📁 ${category.toUpperCase()} (${successCount}/${categoryResults.length} OK)`);

      for (const result of categoryResults) {
        const icon = result.success ? '✅' : '❌';
        console.log(`  ${icon} ${result.name}: ${result.message}`);
      }
    }

    // Summary
    const totalSuccess = results.filter(r => r.success).length;
    const successRate = ((totalSuccess / results.length) * 100).toFixed(1);

    console.log(`\n📊 SUMMARY: ${totalSuccess}/${results.length} sources OK (${successRate}%)`);

    // Save metrics
    await pool.query(`
      INSERT INTO scraping_metrics (
        date, articles_scraped, errors_count, avg_quality_score
      ) VALUES (CURRENT_DATE, $1, $2, $3)
    `, [totalSuccess, results.length - totalSuccess, parseFloat(successRate)]);
  } catch (error) {
    console.error('❌ Connectivity test failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run test
testConnectivity().catch(console.error);

