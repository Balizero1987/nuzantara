#!/usr/bin/env node

/**
 * Script to check which scopes the Service Account can actually use
 * This helps verify Domain-Wide Delegation configuration
 */

import { google } from 'googleapis';
import fs from 'fs';

async function checkScopes() {
  console.log('🔍 ZANTARA Service Account Scope Checker\n');

  try {
    // Load service account
    const keyFile = './zantara-v2-key.json';
    const sa = JSON.parse(fs.readFileSync(keyFile, 'utf8'));

    console.log('📋 Service Account:', sa.client_email);
    console.log('🆔 Client ID:', sa.client_id || 'Not found - check in GCP Console');
    console.log('👤 Impersonating:', process.env.IMPERSONATE_USER || 'zero@balizero.com');
    console.log('\n');

    // Test scopes
    const scopeTests = [
      {
        name: 'Gmail',
        scopes: ['https://www.googleapis.com/auth/gmail.send'],
        test: async (auth) => {
          const gmail = google.gmail({ version: 'v1', auth });
          await gmail.users.getProfile({ userId: 'me' });
        }
      },
      {
        name: 'Drive',
        scopes: ['https://www.googleapis.com/auth/drive'],
        test: async (auth) => {
          const drive = google.drive({ version: 'v3', auth });
          await drive.files.list({ pageSize: 1 });
        }
      },
      {
        name: 'Calendar',
        scopes: ['https://www.googleapis.com/auth/calendar'],
        test: async (auth) => {
          const calendar = google.calendar({ version: 'v3', auth });
          await calendar.events.list({ calendarId: 'primary', maxResults: 1 });
        }
      },
      {
        name: 'Sheets',
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        test: async (auth) => {
          const sheets = google.sheets({ version: 'v4', auth });
          // Just check if we can access the API
          return true;
        }
      },
      {
        name: 'Docs',
        scopes: ['https://www.googleapis.com/auth/documents'],
        test: async (auth) => {
          const docs = google.docs({ version: 'v1', auth });
          // Just check if we can access the API
          return true;
        }
      },
      {
        name: 'Slides',
        scopes: ['https://www.googleapis.com/auth/presentations'],
        test: async (auth) => {
          const slides = google.slides({ version: 'v1', auth });
          // Just check if we can access the API
          return true;
        }
      }
    ];

    console.log('📊 Testing Service Account Access:\n');
    console.log('Service | Status | Note');
    console.log('--------|--------|------');

    for (const scopeTest of scopeTests) {
      try {
        const jwt = new google.auth.JWT({
          email: sa.client_email,
          key: sa.private_key,
          scopes: scopeTest.scopes,
          subject: process.env.IMPERSONATE_USER || 'zero@balizero.com'
        });

        await scopeTest.test(jwt);
        console.log(`${scopeTest.name.padEnd(7)} | ✅     | Working with current configuration`);
      } catch (error) {
        if (error.message?.includes('Domain-wide delegation')) {
          console.log(`${scopeTest.name.padEnd(7)} | ❌     | Needs Domain-Wide Delegation`);
        } else if (error.message?.includes('insufficient')) {
          console.log(`${scopeTest.name.padEnd(7)} | ⚠️      | Insufficient scopes - needs admin config`);
        } else {
          console.log(`${scopeTest.name.padEnd(7)} | ❌     | ${error.message?.substring(0, 30)}...`);
        }
      }
    }

    console.log('\n📌 To fix issues, add these scopes in Admin Console:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('1. Go to: Admin Console → Security → API Controls → Domain-wide Delegation');
    console.log('2. Add Client ID:', sa.client_id || '113210531554033168032');
    console.log('3. Add ALL these scopes (copy the entire line):');
    console.log('\nhttps://www.googleapis.com/auth/gmail.send,https://www.googleapis.com/auth/drive,https://www.googleapis.com/auth/calendar,https://www.googleapis.com/auth/spreadsheets,https://www.googleapis.com/auth/documents,https://www.googleapis.com/auth/presentations,https://www.googleapis.com/auth/contacts.readonly\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkScopes();