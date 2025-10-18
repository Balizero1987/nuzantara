#!/usr/bin/env node

// Test Google Contacts and Maps Integration
const API_KEY = 'zantara-internal-dev-key-2025';
const BASE_URL = 'https://zantara-v520-chatgpt-patch-1064094238013.europe-west1.run.app';

async function testContactsAndMaps() {
  console.log('👥🗺️ Testing Google Contacts & Maps Integration');
  console.log('===============================================');

  const tests = [
    // Test 1: Google Contacts List
    {
      name: 'contacts.list - List Google Contacts',
      payload: {
        key: 'contacts.list',
        params: {
          pageSize: 10
        }
      }
    },

    // Test 2: Google Maps Directions (to Bali Zero office)
    {
      name: 'maps.directions - Directions to Bali Zero',
      payload: {
        key: 'maps.directions',
        params: {
          origin: 'Ngurah Rai Airport, Denpasar, Bali',
          destination: 'Kerobokan, Badung Regency, Bali, Indonesia',
          mode: 'driving'
        }
      }
    },

    // Test 3: Google Maps Places (Government offices near Bali Zero)
    {
      name: 'maps.places - Government offices near Bali Zero',
      payload: {
        key: 'maps.places',
        params: {
          query: 'government office immigration Denpasar Bali',
          pageSize: 5
        }
      }
    },

    // Test 4: Google Maps Places (Banks near Kerobokan)
    {
      name: 'maps.places - Banks near Kerobokan',
      payload: {
        key: 'maps.places',
        params: {
          query: 'bank ATM Kerobokan Bali',
          pageSize: 3
        }
      }
    },

    // Test 5: Create Contact (test client)
    {
      name: 'contacts.create - Create test client contact',
      payload: {
        key: 'contacts.create',
        params: {
          name: 'John Doe - Visa Client',
          email: 'john.doe@example.com',
          phone: '+1-555-0123',
          organization: 'Test Company Inc',
          title: 'CEO',
          notes: 'B211A visa application - Bali Zero client'
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

        // Handle different response types
        if (result.data.contacts) {
          console.log(`👥 Contacts found: ${result.data.totalContacts}`);
          result.data.contacts.slice(0, 3).forEach((contact, idx) => {
            console.log(`   ${idx + 1}. ${contact.name} - ${contact.email || 'No email'}`);
          });
        }

        if (result.data.route) {
          console.log(`🚗 Route: ${result.data.route.distance} - ${result.data.route.duration}`);
          console.log(`📍 From: ${result.data.route.startAddress}`);
          console.log(`📍 To: ${result.data.route.endAddress}`);
        }

        if (result.data.places) {
          console.log(`🏢 Places found: ${result.data.places.length}`);
          result.data.places.slice(0, 3).forEach((place, idx) => {
            console.log(`   ${idx + 1}. ${place.name} - ${place.address}`);
          });
        }

        if (result.data.contact) {
          console.log(`👤 Contact created: ${result.data.contact.name}`);
          console.log(`📧 Email: ${result.data.contact.email}`);
        }

        passedTests++;
      } else {
        console.log('❌ FAILED');
        console.log(`Error: ${result.error || 'Unknown error'}`);

        // Common error patterns
        if (result.error?.includes('not configured')) {
          console.log('💡 Hint: API key or OAuth2 configuration needed');
        }
        if (result.error?.includes('PERMISSION_DENIED')) {
          console.log('💡 Hint: Google API permissions need to be enabled');
        }
      }

    } catch (error) {
      console.log('❌ NETWORK ERROR');
      console.log(`Error: ${error.message}`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n🏁 TEST RESULTS SUMMARY');
  console.log('======================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`📈 Success Rate: ${((passedTests/totalTests) * 100).toFixed(1)}%`);

  console.log('\n🎯 INTEGRATION CAPABILITIES:');
  console.log('============================');
  console.log('👥 Google Contacts:');
  console.log('   • contacts.list → Lista clienti esistenti');
  console.log('   • contacts.create → Aggiungi nuovo cliente');

  console.log('\n🗺️ Google Maps:');
  console.log('   • maps.directions → Indicazioni per ufficio');
  console.log('   • maps.places → Trova uffici governativi, banche');
  console.log('   • maps.placeDetails → Dettagli di un luogo specifico');

  console.log('\n💼 BUSINESS USE CASES:');
  console.log('======================');
  console.log('• "Lista tutti i clienti" → contacts.list');
  console.log('• "Aggiungi cliente per visa B211A" → contacts.create');
  console.log('• "Come arrivare al nostro ufficio?" → maps.directions');
  console.log('• "Dove sono gli uffici immigration?" → maps.places');
}

testContactsAndMaps().catch(console.error);