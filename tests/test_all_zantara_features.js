#!/usr/bin/env node

const API_BASE = 'https://zantara-v520-nuzantara-himaadsxua-ew.a.run.app';
const API_KEY = 'zantara-internal-dev-key-2025';

async function apiCall(key, params = {}) {
  try {
    const response = await fetch(`${API_BASE}/call`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({ key, params })
    });
    return await response.json();
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function report(category, handler, result) {
  const status = result.ok ? '✅' : '❌';
  const msg = result.ok ? 'OK' : (result.error || 'FAILED');
  console.log(`${status} ${handler.padEnd(35)} ${msg}`);
}

console.log('🧪 ZANTARA COMPLETE FEATURES TEST\n');
console.log('═══════════════════════════════════════════════════════════\n');

async function runTests() {
// Google Workspace
console.log('📧 GOOGLE WORKSPACE');
report('workspace', 'gmail.list', await apiCall('gmail.list', { maxResults: 5 }));
report('workspace', 'gmail.send', await apiCall('gmail.send', {
  to: 'test@example.com',
  subject: 'Test',
  body: 'Test message'
}));
report('workspace', 'calendar.list', await apiCall('calendar.list', { maxResults: 5 }));
report('workspace', 'calendar.events', await apiCall('calendar.events', {
  calendarId: 'primary',
  maxResults: 5
}));
report('workspace', 'drive.list', await apiCall('drive.list', { pageSize: 5 }));
report('workspace', 'drive.search', await apiCall('drive.search', {
  query: 'test',
  pageSize: 5
}));
report('workspace', 'contacts.list', await apiCall('contacts.list', { pageSize: 5 }));
report('workspace', 'contacts.create', await apiCall('contacts.create', {
  givenName: 'Test',
  familyName: 'Webapp',
  emailAddresses: [{ value: `test${Date.now()}@example.com` }]
}));
report('workspace', 'sheets.read', await apiCall('sheets.read', {
  spreadsheetId: '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms',
  range: 'Class Data!A1:E10'
}));
console.log('');

// Google Cloud
console.log('☁️  GOOGLE CLOUD');
report('cloud', 'gcp.projects.list', await apiCall('gcp.projects.list', {}));
report('cloud', 'gcp.compute.instances', await apiCall('gcp.compute.instances', {}));
report('cloud', 'gcp.storage.buckets', await apiCall('gcp.storage.buckets', {}));
console.log('');

// Maps & Places
console.log('🗺️  GOOGLE MAPS');
report('maps', 'maps.places', await apiCall('maps.places', {
  query: 'restaurants',
  location: '-8.6705,115.2126',
  radius: 2000
}));
report('maps', 'maps.directions', await apiCall('maps.directions', {
  origin: '-8.6705,115.2126',
  destination: '-8.7467,115.1681',
  mode: 'driving'
}));
report('maps', 'maps.geocode', await apiCall('maps.geocode', {
  address: 'Ubud, Bali, Indonesia'
}));
report('maps', 'maps.distance', await apiCall('maps.distance', {
  origins: ['-8.6705,115.2126'],
  destinations: ['-8.7467,115.1681'],
  mode: 'driving'
}));
console.log('');

// RAG & AI
console.log('🤖 RAG & AI SYSTEMS');
report('rag', 'rag.search', await apiCall('rag.search', { query: 'PT PMA', limit: 3 }));
report('rag', 'rag.query', await apiCall('rag.query', { query: 'What is PT PMA?' }));
report('rag', 'rag.health', await apiCall('rag.health', {}));
report('rag', 'bali.zero.chat', await apiCall('bali.zero.chat', {
  query: 'What is KITAS visa?',
  user_role: 'member'
}));
console.log('');

// Memory System
console.log('💾 MEMORY SYSTEM');
const userId = `test_webapp_${Date.now()}`;
report('memory', 'memory.save', await apiCall('memory.save', {
  userId,
  content: 'User prefers technical docs'
}));
report('memory', 'memory.retrieve', await apiCall('memory.retrieve', { userId }));
report('memory', 'memory.search.semantic', await apiCall('memory.search.semantic', {
  userId,
  query: 'technical',
  limit: 5
}));
report('memory', 'memory.search.hybrid', await apiCall('memory.search.hybrid', {
  userId,
  query: 'docs',
  limit: 5
}));
report('memory', 'memory.cache.stats', await apiCall('memory.cache.stats', {}));
console.log('');

// Team & Activity
console.log('👥 TEAM MANAGEMENT');
report('team', 'team.recent_activity', await apiCall('team.recent_activity', {
  hours: 24,
  limit: 10
}));
console.log('');

// Twitter/X Integration
console.log('🐦 TWITTER/X');
report('twitter', 'twitter.timeline', await apiCall('twitter.timeline', { limit: 5 }));
report('twitter', 'twitter.post', await apiCall('twitter.post', {
  text: 'Test tweet from Zantara'
}));
report('twitter', 'twitter.search', await apiCall('twitter.search', {
  query: 'bali',
  limit: 5
}));
console.log('');

// Instagram
console.log('📸 INSTAGRAM');
report('instagram', 'instagram.media.list', await apiCall('instagram.media.list', { limit: 5 }));
report('instagram', 'instagram.profile', await apiCall('instagram.profile', {}));
console.log('');

// WhatsApp
console.log('💬 WHATSAPP');
report('whatsapp', 'whatsapp.send', await apiCall('whatsapp.send', {
  to: '+1234567890',
  message: 'Test message'
}));
console.log('');

// Authentication
console.log('🔐 AUTHENTICATION');
report('auth', 'auth.verify', await apiCall('auth.verify', {
  token: 'test_token'
}));
report('auth', 'auth.login', await apiCall('auth.login', {
  email: 'test@example.com',
  password: 'test123'
}));
console.log('');

// Slack
console.log('💼 SLACK');
report('slack', 'slack.channels', await apiCall('slack.channels', {}));
report('slack', 'slack.post', await apiCall('slack.post', {
  channel: '#general',
  text: 'Test message'
}));
console.log('');

// Notion
console.log('📝 NOTION');
report('notion', 'notion.pages', await apiCall('notion.pages', {}));
report('notion', 'notion.databases', await apiCall('notion.databases', {}));
console.log('');

// Linear
console.log('📊 LINEAR');
report('linear', 'linear.issues', await apiCall('linear.issues', {}));
report('linear', 'linear.create', await apiCall('linear.create', {
  title: 'Test issue',
  description: 'Test'
}));
console.log('');

// GitHub
console.log('🐙 GITHUB');
report('github', 'github.repos', await apiCall('github.repos', {}));
report('github', 'github.issues', await apiCall('github.issues', {
  owner: 'test',
  repo: 'test'
}));
console.log('');

// Stripe
console.log('💳 STRIPE');
report('stripe', 'stripe.customers', await apiCall('stripe.customers', { limit: 5 }));
report('stripe', 'stripe.charges', await apiCall('stripe.charges', { limit: 5 }));
console.log('');

console.log('═══════════════════════════════════════════════════════════');
console.log('✅ COMPLETE TEST FINISHED!\n');
}

runTests();
