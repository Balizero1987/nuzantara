#!/usr/bin/env node

// Test bypassing OAuth2 and forcing Service Account for Docs/Slides
const API_KEY = 'zantara-internal-dev-key-2025';
const BASE_URL = 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app';

async function testForceServiceAccount() {
  console.log('🔧 Testing Service Account Force for Docs/Slides');
  console.log('=================================================');

  // First, let's check if the server environment has USE_OAUTH2 enabled
  console.log('1. Environment Check');
  console.log('────────────────────');
  console.log('Expected: USE_OAUTH2=true should be set');
  console.log('Expected: oauth2-tokens.json should exist');
  console.log('Expected: Service Account should have domain-wide delegation');

  // Check timestamp of OAuth2 token expiry
  console.log('\n2. Token Analysis');
  console.log('─────────────────');
  const expiryTimestamp = 1758696138817;
  const expiryDate = new Date(expiryTimestamp);
  const now = new Date();
  const isExpired = expiryDate < now;

  console.log(`Token expires: ${expiryDate.toISOString()}`);
  console.log(`Current time:  ${now.toISOString()}`);
  console.log(`Token status:  ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);

  console.log('\n3. Google APIs Scope Analysis');
  console.log('─────────────────────────────');
  const scopes = [
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar'
  ];

  const tokenScopes = "https://www.googleapis.com/auth/presentations https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/documents https://www.googleapis.com/auth/drive https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/documents.readonly https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly https://www.googleapis.com/auth/presentations.readonly https://www.googleapis.com/auth/gmail.send".split(' ');

  scopes.forEach(scope => {
    const hasScope = tokenScopes.includes(scope);
    console.log(`${hasScope ? '✅' : '❌'} ${scope}`);
  });

  console.log('\n4. API Status Comparison');
  console.log('───────────────────────');

  const tests = [
    { name: 'drive.list', expected: '✅', api: 'Drive API' },
    { name: 'calendar.list', expected: '✅', api: 'Calendar API' },
    { name: 'docs.create', expected: '❌', api: 'Docs API' },
    { name: 'slides.create', expected: '❌', api: 'Slides API' }
  ];

  for (const test of tests) {
    console.log(`Testing ${test.name} (${test.api})...`);

    try {
      const testPayload = test.name === 'drive.list' ? { pageSize: 1 } :
                         test.name === 'calendar.list' ? { maxResults: 1 } :
                         test.name === 'docs.create' ? { title: 'Test Doc' } :
                         { title: 'Test Slides' };

      const response = await fetch(`${BASE_URL}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify({
          key: test.name,
          params: testPayload
        })
      });

      const result = await response.json();
      const status = result.ok ? '✅' : '❌';
      const error = result.error ? ` - ${result.error}` : '';

      console.log(`   ${status} ${test.name}${error}`);
    } catch (e) {
      console.log(`   ❌ ${test.name} - Network error`);
    }

    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('\n5. Analysis & Recommendations');
  console.log('──────────────────────────────');

  if (isExpired) {
    console.log('🔴 PROBLEM: OAuth2 token is EXPIRED');
    console.log('💡 SOLUTION: Refresh OAuth2 token or regenerate');
    console.log('   → Run OAuth2 flow again to get fresh tokens');
  } else {
    console.log('🟡 PROBLEM: Token valid but Docs/Slides APIs not responding');
    console.log('💡 POSSIBLE CAUSES:');
    console.log('   → Google Docs/Slides APIs have different auth requirements');
    console.log('   → Service Account delegation not fully propagated');
    console.log('   → API client IDs mismatch between OAuth2 and Service Account');
  }

  console.log('\n🔧 NEXT STEPS:');
  console.log('   1. Wait 30-60 minutes for domain-wide delegation to propagate');
  console.log('   2. OR refresh OAuth2 tokens with fresh authorization');
  console.log('   3. OR force Service Account only (bypass OAuth2 temporarily)');
}

testForceServiceAccount().catch(console.error);