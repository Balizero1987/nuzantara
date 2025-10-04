#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import { OAUTH2_CONFIG } from './oauth2-config.js';

const authCode = process.argv[2];

if (!authCode) {
  console.log('❌ Please provide the authorization code');
  console.log('Usage: node complete-workspace-auth.js [AUTH_CODE]');
  process.exit(1);
}

console.log('🔧 Completing OAuth2 authorization...');

const oauth2Client = new google.auth.OAuth2(
  OAUTH2_CONFIG.CLIENT_ID,
  OAUTH2_CONFIG.CLIENT_SECRET,
  OAUTH2_CONFIG.REDIRECT_URI
);

try {
  // Exchange code for tokens
  const { tokens } = await oauth2Client.getAccessToken(authCode);

  console.log('✅ Tokens received');

  // Save new tokens
  fs.writeFileSync('oauth2-tokens-workspace.json', JSON.stringify(tokens, null, 2));

  // Also update the main token file
  fs.writeFileSync('oauth2-tokens.json', JSON.stringify(tokens, null, 2));

  console.log('✅ Tokens saved to oauth2-tokens-workspace.json');
  console.log('✅ Updated oauth2-tokens.json');

  // Test the tokens
  oauth2Client.setCredentials(tokens);

  console.log('');
  console.log('🧪 Testing APIs...');

  try {
    const drive = google.drive({ version: 'v3', auth: oauth2Client });
    await drive.files.list({ pageSize: 1 });
    console.log('✅ Google Drive: Working');
  } catch (error) {
    console.log('❌ Google Drive: Failed');
  }

  try {
    const docs = google.docs({ version: 'v1', auth: oauth2Client });
    console.log('✅ Google Docs: API Accessible');
  } catch (error) {
    console.log('❌ Google Docs: Failed');
  }

  try {
    const sheets = google.sheets({ version: 'v4', auth: oauth2Client });
    console.log('✅ Google Sheets: API Accessible');
  } catch (error) {
    console.log('❌ Google Sheets: Failed');
  }

  try {
    const slides = google.slides({ version: 'v1', auth: oauth2Client });
    console.log('✅ Google Slides: API Accessible');
  } catch (error) {
    console.log('❌ Google Slides: Failed');
  }

  console.log('');
  console.log('🎉 Authorization complete!');
  console.log('💡 Restart ZANTARA server to use new tokens');
  console.log('🧪 Test with: node test-workspace.js');

} catch (error) {
  console.error('❌ Authorization failed:', error.message);
  process.exit(1);
}