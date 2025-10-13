#!/usr/bin/env node

// Test Custom GPT Friendly Syntax for Drive Handlers
const API_KEY = 'zantara-internal-dev-key-2025';
const BASE_URL = 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app';
const ZERO_FOLDER_ID = '1AlJaNatn8L7RL5MY5Ex7P6DIfiW42Ipr';

async function testCustomGPTSyntax() {
  console.log('🤖 Testing Custom GPT Friendly Drive Syntax');
  console.log('=============================================');

  const tests = [
    // Test 1: drive.list with folderId (Custom GPT friendly)
    {
      name: 'drive.list - Custom GPT syntax (folderId)',
      payload: {
        key: 'drive.list',
        params: {
          folderId: ZERO_FOLDER_ID,
          pageSize: 10
        }
      }
    },

    // Test 2: drive.list with mimeType filter
    {
      name: 'drive.list - MIME type filter',
      payload: {
        key: 'drive.list',
        params: {
          mimeType: 'image/png',
          pageSize: 5
        }
      }
    },

    // Test 3: drive.search with folderId (Custom GPT friendly)
    {
      name: 'drive.search - Custom GPT syntax (folderId)',
      payload: {
        key: 'drive.search',
        params: {
          folderId: ZERO_FOLDER_ID,
          pageSize: 10
        }
      }
    },

    // Test 4: drive.search with query + folderId
    {
      name: 'drive.search - Query + FolderId combo',
      payload: {
        key: 'drive.search',
        params: {
          query: 'zantara',
          folderId: ZERO_FOLDER_ID,
          pageSize: 5
        }
      }
    },

    // Test 5: drive.search with mimeType only
    {
      name: 'drive.search - MIME type only',
      payload: {
        key: 'drive.search',
        params: {
          mimeType: 'image/png',
          pageSize: 5
        }
      }
    },

    // Test 6: Backward compatibility - old syntax
    {
      name: 'drive.list - Original Google API syntax (backward compatibility)',
      payload: {
        key: 'drive.list',
        params: {
          q: `'${ZERO_FOLDER_ID}' in parents`,
          pageSize: 5
        }
      }
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    console.log(`\n${i + 1}. ${test.name}`);
    console.log('─'.repeat(60));

    try {
      const response = await fetch(`${BASE_URL}/call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': API_KEY
        },
        body: JSON.stringify(test.payload)
      });

      const result = await response.json();

      if (response.ok && result.ok) {
        console.log('✅ SUCCESS');

        if (result.data.files) {
          console.log(`📁 Files found: ${result.data.files.length}`);

          // Show first 3 files
          result.data.files.slice(0, 3).forEach((file, idx) => {
            console.log(`   ${idx + 1}. ${file.name} (${file.size || 'N/A'} bytes)`);
          });
        }

        if (result.data.query) {
          console.log(`🔍 Search query: "${result.data.query}"`);
        }

        passedTests++;
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${result.error || 'Unknown error'}`);

        if (result.error && result.error.includes('Invalid Value')) {
          console.log('💡 Hint: This might be a syntax issue with the query');
        }
      }

    } catch (error) {
      console.log('❌ NETWORK ERROR');
      console.log(`Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 800));
  }

  console.log('\n🏁 TEST RESULTS SUMMARY');
  console.log('======================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🤖 Custom GPT can now use simplified syntax:');
    console.log('   • folderId instead of "in parents" queries');
    console.log('   • mimeType for file type filtering');
    console.log('   • Backward compatibility maintained');
  } else {
    console.log('\n⚠️  Some tests failed. Check error messages above.');
  }
}

testCustomGPTSyntax().catch(console.error);