#!/usr/bin/env node

import { google } from 'googleapis';
import fs from 'fs';
import { OAUTH2_CONFIG } from './oauth2-config.js';

console.log('🚀 ZANTARA Google Workspace Authorization');
console.log('=========================================');
console.log('');

const oauth2Client = new google.auth.OAuth2(
  OAUTH2_CONFIG.CLIENT_ID,
  OAUTH2_CONFIG.CLIENT_SECRET,
  OAUTH2_CONFIG.REDIRECT_URI
);

// Generate authorization URL with all scopes
const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  scope: OAUTH2_CONFIG.SCOPES,
  prompt: 'consent'
});

console.log('📋 New scopes being requested:');
console.log('• https://www.googleapis.com/auth/documents');
console.log('• https://www.googleapis.com/auth/spreadsheets');
console.log('• https://www.googleapis.com/auth/presentations');
console.log('• (plus existing Calendar, Drive, Gmail scopes)');
console.log('');
console.log('🔗 Please visit this URL to authorize:');
console.log(authUrl);
console.log('');
console.log('📋 Steps:');
console.log('1. Click the URL above');
console.log('2. Sign in with zero@balizero.com');
console.log('3. Accept all permissions');
console.log('4. Copy the authorization code');
console.log('5. Run: node complete-workspace-auth.js [CODE]');
console.log('');

// Save the URL for easy access
fs.writeFileSync('workspace-auth-url.txt', authUrl);
console.log('💾 Authorization URL saved to workspace-auth-url.txt');