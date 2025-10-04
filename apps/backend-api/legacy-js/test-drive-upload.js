#!/usr/bin/env node

// ZANTARA drive.upload Security Test Suite
// Comprehensive testing of drive.upload handler for security vulnerabilities

const API_KEY = 'zantara-internal-dev-key-2025';
const BASE_URL = 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app';

async function testDriveUpload() {
  console.log('🔒 ZANTARA drive.upload Security Test Suite');
  console.log('=====================================');

  const tests = [
    // Test 1: Legitimate file upload
    {
      name: 'Legitimate Text File',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'test_legitimate.txt' },
          media: { body: 'SGVsbG8gV29ybGQ=', mimeType: 'text/plain' } // Hello World base64
        }
      }
    },

    // Test 2: Empty file
    {
      name: 'Empty File',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'empty.txt' },
          media: { body: '', mimeType: 'text/plain' }
        }
      }
    },

    // Test 3: Missing body (should fail)
    {
      name: 'Missing Body (Should Fail)',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'no_body.txt' },
          media: { mimeType: 'text/plain' }
        }
      }
    },

    // Test 4: Large filename
    {
      name: 'Large Filename',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'A'.repeat(100) + '.txt' },
          media: { body: 'VGVzdA==', mimeType: 'text/plain' }
        }
      }
    },

    // Test 5: HTML content (XSS test)
    {
      name: 'HTML Content (XSS Test)',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'xss_test.html' },
          media: {
            body: Buffer.from('<script>alert("xss")</script>').toString('base64'),
            mimeType: 'text/html'
          }
        }
      }
    },

    // Test 6: Binary file simulation
    {
      name: 'Binary File Simulation',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'binary_test.bin' },
          media: {
            body: Buffer.from('Binary data test').toString('base64'),
            mimeType: 'application/octet-stream'
          }
        }
      }
    },

    // Test 7: Invalid characters in filename
    {
      name: 'Invalid Filename Characters',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'test<>|:*?.txt' },
          media: { body: 'VGVzdA==', mimeType: 'text/plain' }
        }
      }
    },

    // Test 8: No authentication (should fail)
    {
      name: 'No Authentication (Should Fail)',
      payload: {
        key: 'drive.upload',
        params: {
          requestBody: { name: 'unauth_test.txt' },
          media: { body: 'VGVzdA==', mimeType: 'text/plain' }
        }
      },
      skipAuth: true
    }
  ];

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${i + 1}. Testing: ${test.name}`);
    console.log('─'.repeat(50));

    try {
      const headers = {
        'Content-Type': 'application/json'
      };

      if (!test.skipAuth) {
        headers['x-api-key'] = API_KEY;
      }

      const response = await fetch(`${BASE_URL}/call`, {
        method: 'POST',
        headers,
        body: JSON.stringify(test.payload)
      });

      const result = await response.json();

      console.log(`Status: ${response.status}`);
      console.log(`Response: ${JSON.stringify(result, null, 2).substring(0, 500)}...`);

      if (test.name.includes('Should Fail')) {
        if (response.ok) {
          console.log('⚠️  WARNING: Expected failure but got success!');
        } else {
          console.log('✅ Expected failure - security working correctly');
        }
      } else {
        if (response.ok && result.ok) {
          console.log('✅ Success');
          if (result.data && result.data.file) {
            console.log(`📄 File created: ${result.data.file.name}`);
            console.log(`🔗 URL: ${result.data.file.webViewLink || 'N/A'}`);
          }
        } else {
          console.log('❌ Failed');
        }
      }

    } catch (error) {
      console.log(`❌ Network Error: ${error.message}`);
    }

    // Wait between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 Security Test Suite Complete');
}

// Run if called directly
testDriveUpload().catch(console.error);