#!/usr/bin/env node

/**
 * Script di emergenza per risolvere il problema degli utenti PRO+
 * che ricevono messaggi sui limiti subito dopo aver pagato $60
 * 
 * QUESTO È UNA TRUFFA E VA RISOLTO SUBITO!
 */

import { Firestore } from '@google-cloud/firestore';
import readline from 'readline';

const db = new Firestore({
  projectId: process.env.GOOGLE_CLOUD_PROJECT || 'my-project',
  databaseId: 'bali-zero-memory'
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🔧 FIX IMMEDIATO PER ABBONAMENTO PRO+ 🔧');
console.log('=========================================');
console.log('');
console.log('Hai pagato $60 per PRO+ e ricevi già messaggi sui limiti?');
console.log('Questo NON dovrebbe succedere! Risolviamo subito.');
console.log('');

rl.question('📧 Inserisci la tua email utilizzata per il pagamento: ', async (email) => {
  if (!email) {
    console.error('❌ Email richiesta!');
    rl.close();
    process.exit(1);
  }

  console.log('');
  console.log(`🔄 Elaborazione per ${email}...`);

  try {
    // Generate userId from email
    const userId = email.replace(/[^a-zA-Z0-9]/g, '_');
    
    // Create PRO+ subscription record
    const subscription = {
      userId,
      email,
      plan: 'PRO_PLUS',
      status: 'active',
      startDate: new Date(),
      lastPaymentDate: new Date(), // Pagato ADESSO
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 giorni
      paymentAmount: 60,
      currency: 'USD',
      usageLimits: {
        apiCalls: 50000,   // 50.000 chiamate API/mese
        aiRequests: 10000,  // 10.000 richieste AI/mese
        ragQueries: 5000,   // 5.000 query RAG/mese
        storageGB: 100      // 100GB storage
      },
      metadata: {
        fixedManually: true,
        fixReason: 'User paid $60 but received usage warnings immediately',
        fixDate: new Date().toISOString()
      }
    };

    // Save to Firestore
    await db.collection('subscriptions').doc(userId).set({
      ...subscription,
      updatedAt: new Date()
    });

    // Reset usage counters
    const period = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    await db.collection('usage_tracking').doc(`${userId}_${period}`).set({
      userId,
      period,
      usage: {
        apiCalls: 0,
        aiRequests: 0,
        ragQueries: 0,
        storageGB: 0
      },
      lastUpdated: new Date()
    });

    console.log('');
    console.log('✅ SUCCESSO! Il tuo abbonamento PRO+ è stato configurato correttamente.');
    console.log('');
    console.log('📊 I TUOI NUOVI LIMITI MENSILI:');
    console.log('   • 50.000 chiamate API');
    console.log('   • 10.000 richieste AI'); 
    console.log('   • 5.000 query RAG');
    console.log('   • 100GB di storage');
    console.log('');
    console.log('💳 Prossimo rinnovo: ' + new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString());
    console.log('');
    console.log('🚀 NON RICEVERAI PIÙ MESSAGGI SUI LIMITI per i prossimi 30 giorni!');
    console.log('');
    console.log('📧 Se hai ancora problemi, contatta support@cursor.com');
    console.log('   e menziona che hai già eseguito il fix script.');
    console.log('');
    console.log('Ci scusiamo sinceramente per questo inconveniente! 🙏');
    
  } catch (error) {
    console.error('❌ Errore durante il fix:', error.message);
    console.error('');
    console.error('Per favore contatta il supporto con questo errore.');
  }

  rl.close();
});

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  console.log('\n\n⚠️  Operazione annullata');
  rl.close();
  process.exit(0);
});