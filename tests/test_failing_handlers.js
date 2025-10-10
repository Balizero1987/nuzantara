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

console.log('🔍 INVESTIGATING FAILING HANDLERS\n');

// Test 1: Bali Zero Chat - detailed error
console.log('1. Bali Zero Chat (detailed):');
let res = await apiCall('bali.zero.chat', {
  query: 'What is KITAS?',
  user_role: 'member'
});
console.log(JSON.stringify(res, null, 2));

// Test 2: Memory Retrieve - detailed error
console.log('\n2. Memory Retrieve (detailed):');
const testUserId = 'test_user_webapp';
res = await apiCall('memory.save', {
  userId: testUserId,
  content: 'Test memory content'
});
console.log('Save result:', JSON.stringify(res, null, 2));

res = await apiCall('memory.retrieve', { userId: testUserId });
console.log('Retrieve result:', JSON.stringify(res, null, 2));

// Test 3: Pricing - detailed error
console.log('\n3. Pricing Calculate (detailed):');
res = await apiCall('pricing.calculate', {
  serviceType: 'pt_pma_setup',
  params: { company_type: 'PT PMA', capital: 1000000000 }
});
console.log(JSON.stringify(res, null, 2));

// Test 4: KBLI Search - detailed error
console.log('\n4. KBLI Search (detailed):');
res = await apiCall('kbli.search', {
  query: 'software',
  limit: 3
});
console.log(JSON.stringify(res, null, 2));
