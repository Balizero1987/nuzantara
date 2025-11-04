#!/usr/bin/env node

const API_BASE = 'https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app';
const API_KEY = 'zantara-internal-dev-key-2025';

async function apiCall(key, params = {}) {
  const response = await fetch(`${API_BASE}/call`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify({ key, params })
  });
  return await response.json();
}

console.log('🧪 TESTING 3 FIXES\n');

console.log('1. RAG Search (was: service unavailable):');
let res = await apiCall('rag.search', { query: 'PT PMA', limit: 3 });
console.log(res.ok ? `✅ PASS: Found ${res.data.count} results` : `❌ FAIL: ${res.error}`);

console.log('\n2. Contacts Create (was: validation error):');
res = await apiCall('contacts.create', {
  givenName: 'Test',
  familyName: 'User',
  emailAddresses: [{ value: `test${Date.now()}@example.com` }]
});
console.log(res.ok ? `✅ PASS: Contact created` : `❌ FAIL: ${res.error}`);

console.log('\n3. Maps Places (was: returns null):');
res = await apiCall('maps.places', {
  query: 'restaurants',
  location: '-8.6705,115.2126',
  radius: 2000
});
console.log(res.ok && res.data.places?.length > 0 ? `✅ PASS: Found ${res.data.places.length} places` : `❌ FAIL: ${res.error}`);

console.log('\n✅ ALL 3 FIXES TESTED!\n');
