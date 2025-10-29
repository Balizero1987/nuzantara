/**
 * Performance Testing for NUZANTARA Edge Worker
 * 
 * Tests edge routing, caching effectiveness, and latency across regions
 */

import https from 'https';

const TEST_ENDPOINTS = [
  '/health',
  '/api/oracle/query',
  '/api/system/info'
];

const TEST_REGIONS = [
  { name: 'Asia (Singapore)', header: 'SG', expected: 'asia' },
  { name: 'Europe (Frankfurt)', header: 'DE', expected: 'europe' },
  { name: 'Americas (Virginia)', header: 'US', expected: 'americas' }
];

const BASE_URL = process.argv[2] === 'staging' 
  ? 'https://staging-api.nuzantara.com'
  : 'https://api.nuzantara.com';

async function testEndpoint(endpoint, region) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: new URL(BASE_URL).hostname,
      path: endpoint,
      method: 'GET',
      headers: {
        'CF-IPCountry': region.header
      }
    };

    const req = https.request(options, (res) => {
      const latency = Date.now() - startTime;
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          endpoint,
          region: region.name,
          status: res.statusCode,
          latency,
          cacheStatus: res.headers['x-cache'] || 'N/A',
          backendRegion: res.headers['x-backend-region'] || 'N/A',
          cacheAge: res.headers['x-cache-age'] || 'N/A'
        });
      });
    });

    req.on('error', (error) => {
      resolve({
        endpoint,
        region: region.name,
        status: 0,
        latency: -1,
        error: error.message
      });
    });

    req.end();
  });
}

async function runTests() {
  console.log('🧪 NUZANTARA Edge Performance Test\n');
  console.log(`Testing: ${BASE_URL}\n`);

  const results = [];

  for (const endpoint of TEST_ENDPOINTS) {
    console.log(`Testing ${endpoint}...`);
    
    for (const region of TEST_REGIONS) {
      // First request (cache miss)
      const miss = await testEndpoint(endpoint, region);
      results.push({ ...miss, attempt: 'MISS' });
      
      // Second request (cache hit)
      await new Promise(resolve => setTimeout(resolve, 100));
      const hit = await testEndpoint(endpoint, region);
      results.push({ ...hit, attempt: 'HIT' });
    }
  }

  // Print results
  console.log('\n📊 Performance Results\n');
  console.log('='.repeat(100));
  console.log(
    'Endpoint'.padEnd(25) +
    'Region'.padEnd(20) +
    'Attempt'.padEnd(10) +
    'Status'.padEnd(10) +
    'Latency'.padEnd(12) +
    'Cache'.padEnd(10) +
    'Backend'
  );
  console.log('='.repeat(100));

  results.forEach(r => {
    console.log(
      r.endpoint.padEnd(25) +
      r.region.padEnd(20) +
      r.attempt.padEnd(10) +
      r.status.toString().padEnd(10) +
      `${r.latency}ms`.padEnd(12) +
      r.cacheStatus.padEnd(10) +
      r.backendRegion
    );
  });

  // Calculate statistics
  const avgLatency = results.reduce((sum, r) => sum + r.latency, 0) / results.length;
  const cacheHitRate = results.filter(r => r.cacheStatus === 'HIT').length / results.length * 100;

  console.log('\n📈 Summary Statistics\n');
  console.log(`Average Latency: ${avgLatency.toFixed(2)}ms`);
  console.log(`Cache Hit Rate: ${cacheHitRate.toFixed(2)}%`);
  console.log(`Total Tests: ${results.length}`);
  console.log(`Successful: ${results.filter(r => r.status === 200).length}`);
  console.log(`Failed: ${results.filter(r => r.status !== 200).length}`);
}

runTests().catch(console.error);
