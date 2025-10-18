#!/usr/bin/env node

// Test Google Docs & Slides after Domain-wide Delegation configuration
const API_KEY = 'zantara-internal-dev-key-2025';
const BASE_URL = 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app';

async function testDocsSlides() {
  console.log('📝🎨 Testing Google Docs & Slides Auth - Post Configuration');
  console.log('========================================================');

  const tests = [
    // Test 1: Create Google Doc
    {
      name: 'docs.create - Create ZANTARA document',
      payload: {
        key: 'docs.create',
        params: {
          title: 'ZANTARA - Client Onboarding Template',
          content: `Welcome to Bali Zero!

This document outlines the onboarding process for new clients:

1. Initial Consultation
   - Service requirements assessment
   - Document collection
   - Timeline discussion

2. Service Options
   - Visa Services (B211A, B211B, Kitas)
   - Company Setup (PT PMA, Local PT, CV)
   - Tax Services (NPWP, Monthly reporting)

3. Next Steps
   - Document submission
   - Payment processing
   - Application tracking

Contact: info@balizero.com
WhatsApp: +62 859 0436 9574`
        }
      }
    },

    // Test 2: Create Google Slides presentation
    {
      name: 'slides.create - Create ZANTARA presentation',
      payload: {
        key: 'slides.create',
        params: {
          title: 'ZANTARA - Bali Zero Services Overview'
        }
      }
    },

    // Test 3: Create another document (different content)
    {
      name: 'docs.create - Create contract template',
      payload: {
        key: 'docs.create',
        params: {
          title: 'ZANTARA - Service Agreement Template',
          content: `SERVICE AGREEMENT - BALI ZERO

Client Information:
- Name: [CLIENT_NAME]
- Email: [CLIENT_EMAIL]
- Service: [SERVICE_TYPE]
- Date: ${new Date().toLocaleDateString()}

Terms and Conditions:
1. Service delivery timeline
2. Payment terms
3. Document requirements
4. Support and follow-up

Bali Zero
Kerobokan, Bali, Indonesia
info@balizero.com`
        }
      }
    },

    // Test 4: Test docs.read (if first doc creation succeeds)
    {
      name: 'docs.read - Read document (will test if docs work)',
      payload: {
        key: 'docs.read',
        params: {
          documentId: 'placeholder' // Will be replaced if docs.create succeeds
        }
      },
      skipIfNoDoc: true
    }
  ];

  let passedTests = 0;
  let totalTests = tests.length;
  let createdDocId = null;
  let createdSlideId = null;

  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];

    // Skip docs.read if no document was created
    if (test.skipIfNoDoc && !createdDocId) {
      console.log(`\n${i + 1}. ${test.name}`);
      console.log('─'.repeat(60));
      console.log('⏭️  SKIPPED - No document ID available');
      totalTests--;
      continue;
    }

    // Replace placeholder document ID
    if (test.payload.params.documentId === 'placeholder' && createdDocId) {
      test.payload.params.documentId = createdDocId;
    }

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

        // Handle different response types
        if (result.data.documentId) {
          console.log(`📄 Document created: ${result.data.documentId}`);
          console.log(`🔗 URL: ${result.data.documentUrl}`);
          if (!createdDocId) createdDocId = result.data.documentId;
        }

        if (result.data.presentationId) {
          console.log(`🎨 Presentation created: ${result.data.presentationId}`);
          console.log(`🔗 URL: ${result.data.presentationUrl}`);
          createdSlideId = result.data.presentationId;
        }

        if (result.data.content) {
          console.log(`📖 Document content: ${result.data.content.substring(0, 100)}...`);
        }

        passedTests++;
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${result.error || 'Unknown error'}`);

        // Specific error analysis
        if (result.error === 'Login Required.') {
          console.log('💡 CAUSE: Domain-wide delegation scope missing');
          console.log('   → Add docs/slides scopes to Service Account');
        }

        if (result.error?.includes('PERMISSION_DENIED')) {
          console.log('💡 CAUSE: API not enabled or insufficient permissions');
          console.log('   → Enable Google Docs/Slides API in Google Cloud');
        }

        if (result.error?.includes('not configured')) {
          console.log('💡 CAUSE: Service account configuration issue');
          console.log('   → Check GOOGLE_APPLICATION_CREDENTIALS');
        }
      }

    } catch (error) {
      console.log('❌ NETWORK ERROR');
      console.log(`Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1500));
  }

  // Final summary
  console.log('\n🏁 AUTHENTICATION TEST RESULTS');
  console.log('===============================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

  if (passedTests === totalTests) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('🔒 Domain-wide delegation is correctly configured');
    console.log('📄 Google Docs & Slides are now fully operational');
    console.log('\n📋 Created Documents:');
    if (createdDocId) console.log(`   📄 Doc: https://docs.google.com/document/d/${createdDocId}/edit`);
    if (createdSlideId) console.log(`   🎨 Slides: https://docs.google.com/presentation/d/${createdSlideId}/edit`);
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('🔧 Next Steps:');
    console.log('   1. Check Google Admin Console → Domain-wide delegation');
    console.log('   2. Verify scope list includes docs/slides permissions');
    console.log('   3. Wait 5-15 minutes for propagation');
    console.log('   4. Re-run this test');
  }

  console.log('\n📋 REQUIRED SCOPES (copy-paste ready):');
  console.log('==========================================');
  console.log('https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/drive.file,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/documents.readonly,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/presentations.readonly,https://www.googleapis.com/auth/contacts,https://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/gmail.readonly,https://www.googleapis.com/auth/spreadsheets');
}

testDocsSlides().catch(console.error);