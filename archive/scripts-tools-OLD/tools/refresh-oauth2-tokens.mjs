#!/usr/bin/env node
import fs from 'fs';

// OAuth2 Token Refresh Script for ZANTARA
// This script refreshes expired OAuth2 tokens using the refresh_token

const OAUTH2_CONFIG = {
  client_id: '1064094238013-fj7iktn683mo2b5kpfqgl67flj0n1ui8.apps.googleusercontent.com',
  client_secret: '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',
  redirect_uri: 'http://localhost:3000/oauth2callback'
};

async function refreshTokens() {
  console.log('🔄 ZANTARA OAuth2 Token Refresh');
  console.log('===============================');

  // Read current tokens
  let currentTokens;
  try {
    const tokenData = fs.readFileSync('./oauth2-tokens.json', 'utf8');
    currentTokens = JSON.parse(tokenData);
    console.log('✅ Current tokens loaded');
  } catch (error) {
    console.error('❌ Error reading oauth2-tokens.json:', error.message);
    return;
  }

  // Check token expiry
  const expiryDate = new Date(currentTokens.expiry_date);
  const now = new Date();
  const isExpired = expiryDate < now;

  console.log(`📅 Token expires: ${expiryDate.toISOString()}`);
  console.log(`📅 Current time:  ${now.toISOString()}`);
  console.log(`⏰ Status: ${isExpired ? '❌ EXPIRED' : '✅ VALID'}`);

  if (!isExpired) {
    console.log('✅ Tokens are still valid, no refresh needed');
    return;
  }

  if (!currentTokens.refresh_token) {
    console.error('❌ No refresh_token found. Need to re-authorize manually.');
    console.log('💡 Run the OAuth2 authorization flow again to get new tokens');
    return;
  }

  console.log('\n🔄 Refreshing expired tokens...');

  try {
    // Make refresh request to Google
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: OAUTH2_CONFIG.client_id,
        client_secret: OAUTH2_CONFIG.client_secret,
        refresh_token: currentTokens.refresh_token,
        grant_type: 'refresh_token'
      })
    });

    const refreshResult = await refreshResponse.json();

    if (!refreshResponse.ok) {
      console.error('❌ Token refresh failed:', refreshResult);
      if (refreshResult.error === 'invalid_grant') {
        console.log('💡 Refresh token is invalid or expired. Need manual re-authorization.');
        console.log('   → Run OAuth2 flow again to get new refresh token');
      }
      return;
    }

    console.log('✅ Token refresh successful!');

    // Update tokens with new values
    const newTokens = {
      access_token: refreshResult.access_token,
      refresh_token: refreshResult.refresh_token || currentTokens.refresh_token, // Keep old if not provided
      scope: currentTokens.scope, // Preserve original scopes
      token_type: refreshResult.token_type || 'Bearer',
      expiry_date: Date.now() + (refreshResult.expires_in * 1000)
    };

    // Save updated tokens
    fs.writeFileSync('./oauth2-tokens.json', JSON.stringify(newTokens, null, 2));

    console.log('💾 Updated tokens saved to oauth2-tokens.json');
    console.log(`📅 New expiry: ${new Date(newTokens.expiry_date).toISOString()}`);
    console.log(`⏰ Valid for: ${Math.round(refreshResult.expires_in / 3600)} hours`);

    console.log('\n🎉 TOKEN REFRESH COMPLETE!');
    console.log('🚀 Google Docs/Slides should now work with fresh tokens');

  } catch (error) {
    console.error('❌ Error during token refresh:', error.message);
  }
}

// Utility function to check all required scopes
function checkRequiredScopes() {
  console.log('\n🔍 Required Scopes for ZANTARA:');
  console.log('================================');

  const requiredScopes = [
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
    'https://www.googleapis.com/auth/documents',
    'https://www.googleapis.com/auth/documents.readonly',
    'https://www.googleapis.com/auth/presentations',
    'https://www.googleapis.com/auth/presentations.readonly',
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/spreadsheets.readonly',
    'https://www.googleapis.com/auth/contacts',
    'https://www.googleapis.com/auth/contacts.readonly',
    'https://www.googleapis.com/auth/gmail.send',
    'https://www.googleapis.com/auth/gmail.readonly'
  ];

  let currentTokens;
  try {
    const tokenData = fs.readFileSync('./oauth2-tokens.json', 'utf8');
    currentTokens = JSON.parse(tokenData);
  } catch (error) {
    console.log('❌ Cannot read oauth2-tokens.json');
    return;
  }

  const currentScopes = currentTokens.scope ? currentTokens.scope.split(' ') : [];

  requiredScopes.forEach(scope => {
    const hasScope = currentScopes.includes(scope);
    console.log(`${hasScope ? '✅' : '❌'} ${scope}`);
  });

  const missingScopes = requiredScopes.filter(scope => !currentScopes.includes(scope));
  if (missingScopes.length > 0) {
    console.log('\n⚠️  Missing scopes detected:');
    missingScopes.forEach(scope => console.log(`   ❌ ${scope}`));
    console.log('\n💡 Need to re-run OAuth2 authorization to get missing scopes');
  } else {
    console.log('\n✅ All required scopes are present!');
  }
}

// Main execution
refreshTokens().then(() => {
  checkRequiredScopes();
}).catch(console.error);