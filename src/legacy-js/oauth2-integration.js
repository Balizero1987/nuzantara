import { readFileSync, existsSync } from 'fs';
import { google } from 'googleapis';

// OAuth2 Integration for Production
let oauth2Client = null;

export async function initOAuth2() {
    try {
        // Check for oauth2-tokens.json in production
        const tokenPath = './oauth2-tokens.json';
        
        if (!existsSync(tokenPath)) {
            console.warn('⚠️ OAuth2 tokens file not found, some handlers may require authentication');
            return null;
        }

        const tokens = JSON.parse(readFileSync(tokenPath, 'utf8'));
        
        // Initialize OAuth2 client with service account or OAuth2 tokens
        const auth = new google.auth.OAuth2();
        auth.setCredentials(tokens);
        
        oauth2Client = auth;
        console.log('✅ OAuth2 client initialized successfully');
        return oauth2Client;
        
    } catch (error) {
        console.error('❌ OAuth2 initialization failed:', error.message);
        return null;
    }
}

export function getOAuth2Client() {
    return oauth2Client;
}

export function isOAuth2Available() {
    return oauth2Client !== null;
}