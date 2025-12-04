#!/usr/bin/env node
/**
 * Get Authentication Token
 * 
 * Helper script to get JWT token for testing
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

async function login(email, pin, backendUrl, apiKey) {
  return new Promise((resolve, reject) => {
    // Try /api/auth/team-login endpoint (used by webapp)
    const url = new URL(`${backendUrl}/api/auth/team-login`);
    
    const protocol = url.protocol === 'https:' ? https : http;
    const headers = {
      'Content-Type': 'application/json',
    };
    
    // Add API key if available
    if (apiKey) {
      headers['X-API-Key'] = apiKey;
    }
    
    const options = {
      hostname: url.hostname,
      port: url.port || (url.protocol === 'https:' ? 443 : 80),
      path: url.pathname,
      method: 'POST',
      headers,
    };

    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk.toString();
      });
      res.on('end', () => {
        if (res.statusCode !== 200) {
          // Try fallback to /api/auth/login
          if (res.statusCode === 404 || res.statusCode === 401) {
            const fallbackUrl = new URL(`${backendUrl}/api/auth/login`);
            const fallbackReq = protocol.request({
              hostname: fallbackUrl.hostname,
              port: fallbackUrl.port || (fallbackUrl.protocol === 'https:' ? 443 : 80),
              path: fallbackUrl.pathname,
              method: 'POST',
              headers,
            }, (fallbackRes) => {
              let fallbackBody = '';
              fallbackRes.on('data', (chunk) => {
                fallbackBody += chunk.toString();
              });
              fallbackRes.on('end', () => {
                if (fallbackRes.statusCode !== 200) {
                  reject(new Error(`HTTP ${fallbackRes.statusCode}: ${fallbackBody}`));
                  return;
                }
                try {
                  const data = JSON.parse(fallbackBody);
                  resolve(data.token || data.access_token);
                } catch (e) {
                  reject(new Error(`Failed to parse response: ${e.message}`));
                }
              });
            });
            fallbackReq.on('error', reject);
            fallbackReq.write(JSON.stringify({ email, pin }));
            fallbackReq.end();
            return;
          }
          reject(new Error(`HTTP ${res.statusCode}: ${body}`));
          return;
        }
        try {
          const data = JSON.parse(body);
          resolve(data.token || data.access_token);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${e.message}`));
        }
      });
    });

    req.on('error', reject);
    req.write(JSON.stringify({ email, pin }));
    req.end();
  });
}

async function main() {
  const args = process.argv.slice(2);
  let email = process.env.E2E_TEST_EMAIL || 'test@balizero.com';
  let pin = process.env.E2E_TEST_PIN || '123456';
  let backendUrl = process.env.NUZANTARA_API_URL || 'https://nuzantara-rag.fly.dev';
  let apiKey = process.env.NUZANTARA_API_KEY || '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      email = args[i + 1];
      i++;
    } else if (args[i] === '--pin' && args[i + 1]) {
      pin = args[i + 1];
      i++;
    } else if (args[i] === '--url' && args[i + 1]) {
      backendUrl = args[i + 1];
      i++;
    } else if (args[i] === '--api-key' && args[i + 1]) {
      apiKey = args[i + 1];
      i++;
    }
  }

  try {
    console.log(`Logging in as ${email}...`);
    const token = await login(email, pin, backendUrl, apiKey);
    console.log(token);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

