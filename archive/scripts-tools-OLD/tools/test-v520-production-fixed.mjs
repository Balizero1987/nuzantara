#!/usr/bin/env node

// ZANTARA v5.2.0 Production Test Suite
// Tests all critical handlers after deployment

import https from 'https';
import http from 'http';

const SERVICE_URL = 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app';
const API_KEY = 'zantara-internal-dev-key-2025';

class ProductionTester {
    constructor() {
        this.passed = 0;
        this.failed = 0;
        this.results = [];
    }

    async makeRequest(path, options = {}) {
        return new Promise((resolve, reject) => {
            const url = new URL(SERVICE_URL + path);
            const reqOptions = {
                hostname: url.hostname,
                port: url.port || 443,
                path: url.pathname + url.search,
                method: options.method || 'GET',
                headers: {
                    'x-api-key': API_KEY,
                    'Content-Type': 'application/json',
                    'User-Agent': 'ZANTARA-Test/5.2.0',
                    ...options.headers
                }
            };

            const req = https.request(reqOptions, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    try {
                        const parsed = data ? JSON.parse(data) : {};
                        resolve({ status: res.statusCode, data: parsed, raw: data });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: null, raw: data });
                    }
                });
            });

            req.on('error', reject);

            if (options.body) {
                req.write(JSON.stringify(options.body));
            }

            req.end();
        });
    }

    async test(name, testFn) {
        try {
            console.log(`🧪 Testing: ${name}`);
            const result = await testFn();
            if (result.success) {
                console.log(`✅ ${name}: ${result.message}`);
                this.passed++;
            } else {
                console.log(`❌ ${name}: ${result.message}`);
                this.failed++;
            }
            this.results.push({ name, ...result });
        } catch (error) {
            console.log(`💥 ${name}: ERROR - ${error.message}`);
            this.failed++;
            this.results.push({ name, success: false, message: error.message });
        }
    }

    async runTests() {
        console.log('🚀 ZANTARA v5.2.0 Production Test Suite Starting...');
        console.log('='.repeat(60));

        // Test 1: Health Check
        await this.test('Health Check', async () => {
            const response = await this.makeRequest('/health');
            if (response.status === 200 && response.data?.status === 'healthy') {
                return { success: true, message: `Version ${response.data.version}, uptime: ${response.data.uptime}s` };
            }
            return { success: false, message: `Status ${response.status}: ${response.raw}` };
        });

        // Test 2: Contact Info (Public endpoint)
        await this.test('Contact Info Endpoint', async () => {
            const response = await this.makeRequest('/contact.info');
            if (response.status === 200 && response.data?.company === 'Bali Zero') {
                return { success: true, message: `Company: ${response.data.company}` };
            }
            return { success: false, message: `Status ${response.status}` };
        });

        // Test 3: API Documentation
        await this.test('OpenAPI Specification', async () => {
            const response = await this.makeRequest('/openapi-v520-custom-gpt.yaml');
            if (response.status === 200 && response.raw.includes('ZANTARA API')) {
                return { success: true, message: 'OpenAPI spec available' };
            }
            return { success: false, message: `Status ${response.status}` };
        });

        // Test 4: AI Chat Handler
        await this.test('AI Chat Handler', async () => {
            const response = await this.makeRequest('/ai.chat', {
                method: 'POST',
                body: {
                    prompt: 'Hello, this is a production test. Please respond briefly.',
                    model: 'gemini'
                }
            });
            if (response.status === 200 && response.data?.response) {
                return { success: true, message: `AI responded: ${response.data.response.substring(0, 50)}...` };
            }
            return { success: false, message: `Status ${response.status}: ${response.data?.error || response.raw}` };
        });

        // Test 5: Identity Resolution
        await this.test('Identity Resolution', async () => {
            const response = await this.makeRequest('/identity.resolve', {
                method: 'POST',
                body: {
                    email: 'zero@balizero.com'
                }
            });
            if (response.status === 200) {
                return { success: true, message: 'Identity resolved successfully' };
            }
            return { success: false, message: `Status ${response.status}: ${response.data?.error || response.raw}` };
        });

        // Test 6: Handler Call - Sheets Create (OAuth2 Test)
        await this.test('OAuth2 Sheets Handler', async () => {
            const response = await this.makeRequest('/call', {
                method: 'POST',
                body: {
                    key: 'sheets.create',
                    params: {
                        title: 'ZANTARA v5.2.0 Production Test',
                        data: [['Test', 'Status', 'Timestamp'], ['Production Deployment', 'Success', new Date().toISOString()]]
                    }
                }
            });
            if (response.status === 200 && response.data?.ok) {
                return { success: true, message: `Sheet created: ${response.data.data?.spreadsheetId}` };
            }
            return { success: false, message: `Status ${response.status}: ${response.data?.error || response.raw}` };
        });

        // Test 7: Lead Save
        await this.test('Lead Save Handler', async () => {
            const response = await this.makeRequest('/lead.save', {
                method: 'POST',
                body: {
                    name: 'Production Test User',
                    email: 'test@zantara-production.test',
                    service: 'Company Setup',
                    details: 'Production deployment test',
                    urgency: 'normal'
                }
            });
            if (response.status === 200 && response.data?.leadId) {
                return { success: true, message: `Lead saved: ${response.data.leadId}` };
            }
            return { success: false, message: `Status ${response.status}: ${response.data?.error || response.raw}` };
        });

        // Test 8: Metrics Endpoint
        await this.test('System Metrics', async () => {
            const response = await this.makeRequest('/metrics');
            if (response.status === 200 && response.data?.requests) {
                return { success: true, message: `Requests: ${response.data.requests.total}, Errors: ${response.data.requests.errors}` };
            }
            return { success: false, message: `Status ${response.status}` };
        });

        this.printResults();
    }

    printResults() {
        console.log('\n' + '='.repeat(60));
        console.log('🏁 PRODUCTION TEST RESULTS');
        console.log('='.repeat(60));
        console.log(`✅ Passed: ${this.passed}`);
        console.log(`❌ Failed: ${this.failed}`);
        console.log(`📊 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);

        if (this.failed > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.filter(r => !r.success).forEach(r => {
                console.log(`  • ${r.name}: ${r.message}`);
            });
        }

        if (this.passed >= 6) {
            console.log('\n🎉 PRODUCTION DEPLOYMENT SUCCESSFUL!');
            console.log('✅ Custom GPT can connect to ZANTARA v5.2.0');
        } else {
            console.log('\n⚠️  PRODUCTION ISSUES DETECTED');
            console.log('🔍 Check Cloud Run logs for detailed error information');
        }
    }
}

// Run tests
const tester = new ProductionTester();
tester.runTests().catch(console.error);