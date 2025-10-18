import logger from './logger.js';
import { google } from 'googleapis';
import * as fs from 'fs';
import { getOAuth2TokensPath } from './token-path.js';
// OAuth2 client singleton
let oauth2ClientState = null;
let secretManagerClient = null;
// OAuth2 configuration (from environment variables)
const OAUTH2_CONFIG = {
    client_id: process.env.GOOGLE_OAUTH_CLIENT_ID || '',
    client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET || '',
    redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI || 'http://localhost:8080/auth/callback'
};
// Constants for token management
const TOKEN_REFRESH_BUFFER_MS = 5 * 60 * 1000; // Refresh 5 minutes before expiry
const TOKEN_REFRESH_INTERVAL_MS = 10 * 60 * 1000; // Check every 10 minutes
const MIN_REFRESH_INTERVAL_MS = 30 * 1000; // Minimum 30 seconds between refreshes
// Initialize Secret Manager client for token persistence
async function getSecretManagerClient() {
    // Skip Secret Manager on Railway (no ADC available)
    if (process.env.SKIP_SECRET_MANAGER === 'true') {
        return null;
    }
    if (secretManagerClient)
        return secretManagerClient;
    try {
        const { SecretManagerServiceClient } = await import('@google-cloud/secret-manager');
        secretManagerClient = new SecretManagerServiceClient({
            projectId: process.env.FIREBASE_PROJECT_ID || 'involuted-box-469105-r0'
        });
        return secretManagerClient;
    }
    catch (error) {
        logger.warn('⚠️ Secret Manager not available:', error.message);
        return null;
    }
}
// Save tokens to Secret Manager
async function saveTokensToSecretManager(tokens) {
    try {
        const client = await getSecretManagerClient();
        if (!client)
            return false;
        const projectId = process.env.FIREBASE_PROJECT_ID || 'involuted-box-469105-r0';
        const secretName = `projects/${projectId}/secrets/OAUTH2_TOKENS`;
        await client.addSecretVersion({
            parent: secretName,
            payload: {
                data: Buffer.from(JSON.stringify(tokens, null, 2))
            }
        });
        logger.info('💾 OAuth2 tokens saved to Secret Manager');
        return true;
    }
    catch (error) {
        logger.warn('⚠️ Failed to save tokens to Secret Manager:', error.message);
        return false;
    }
}
// Save tokens to local file as fallback
function saveTokensToFile(tokens) {
    try {
        const tokenPath = getOAuth2TokensPath();
        fs.writeFileSync(tokenPath, JSON.stringify(tokens, null, 2));
        logger.info(`💾 OAuth2 tokens saved to file: ${tokenPath}`);
        return true;
    }
    catch (error) {
        logger.error('❌ Failed to save tokens to file:', error.message);
        return false;
    }
}
// Comprehensive token persistence
async function persistTokens(tokens) {
    const secretManagerSuccess = await saveTokensToSecretManager(tokens);
    const fileSuccess = saveTokensToFile(tokens);
    if (!secretManagerSuccess && !fileSuccess) {
        logger.error('❌ CRITICAL: Failed to persist OAuth2 tokens to both Secret Manager and file!');
    }
}
// Async token refresh with proper error handling
async function refreshTokensAsync(client, currentTokens) {
    try {
        logger.info('🔄 Refreshing OAuth2 tokens...');
        const { credentials } = await client.refreshAccessToken();
        const newTokens = {
            ...currentTokens,
            access_token: credentials.access_token,
            expiry_date: credentials.expiry_date,
            ...(credentials.refresh_token && { refresh_token: credentials.refresh_token })
        };
        // Persist tokens immediately
        await persistTokens(newTokens);
        logger.info(`✅ OAuth2 tokens refreshed successfully. Expires at: ${new Date(newTokens.expiry_date)}`);
        return newTokens;
    }
    catch (error) {
        logger.error('❌ Failed to refresh OAuth2 tokens:', error.message);
        // Check if it's a recoverable error
        if (error.code === 400 && error.message?.includes('invalid_grant')) {
            logger.error('❌ CRITICAL: Refresh token is invalid. OAuth2 re-authorization required.');
        }
        return null;
    }
}
// Proactive token refresh scheduler
function scheduleTokenRefresh(state) {
    if (state.refreshSchedule) {
        clearTimeout(state.refreshSchedule);
    }
    const now = Date.now();
    const timeUntilExpiry = state.tokens.expiry_date - now;
    const timeUntilRefresh = Math.max(timeUntilExpiry - TOKEN_REFRESH_BUFFER_MS, MIN_REFRESH_INTERVAL_MS);
    logger.info(`⏰ Scheduling OAuth2 token refresh in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
    state.refreshSchedule = setTimeout(async () => {
        if (state.refreshPromise) {
            logger.info('🔄 Token refresh already in progress, waiting...');
            await state.refreshPromise;
            return;
        }
        const timeSinceLastRefresh = now - state.lastRefresh;
        if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
            logger.info('⏭️ Skipping refresh - too soon since last refresh');
            scheduleTokenRefresh(state); // Reschedule
            return;
        }
        state.refreshPromise = (async () => {
            try {
                const newTokens = await refreshTokensAsync(state.client, state.tokens);
                if (newTokens) {
                    state.tokens = newTokens;
                    state.client.setCredentials(newTokens);
                    state.lastRefresh = Date.now();
                }
            }
            finally {
                state.refreshPromise = null;
                scheduleTokenRefresh(state); // Schedule next refresh
            }
        })();
        await state.refreshPromise;
    }, timeUntilRefresh);
}
// Check if token needs immediate refresh
function needsImmediateRefresh(tokens) {
    const now = Date.now();
    const timeUntilExpiry = tokens.expiry_date - now;
    return timeUntilExpiry <= TOKEN_REFRESH_BUFFER_MS;
}
// Initialize OAuth2 client with enhanced token management
async function initializeOAuth2Client() {
    if (oauth2ClientState?.client) {
        // Check if token needs refresh
        if (needsImmediateRefresh(oauth2ClientState.tokens)) {
            logger.info('⏰ Token needs immediate refresh');
            if (!oauth2ClientState.refreshPromise) {
                oauth2ClientState.refreshPromise = (async () => {
                    try {
                        const newTokens = await refreshTokensAsync(oauth2ClientState.client, oauth2ClientState.tokens);
                        if (newTokens) {
                            oauth2ClientState.tokens = newTokens;
                            oauth2ClientState.client.setCredentials(newTokens);
                            oauth2ClientState.lastRefresh = Date.now();
                        }
                    }
                    finally {
                        oauth2ClientState.refreshPromise = null;
                    }
                })();
            }
            await oauth2ClientState.refreshPromise;
        }
        // Log current token scopes for debugging
        logger.info('🔍 OAuth2 token scopes:', oauth2ClientState.tokens.scope?.split(' ') || 'unknown');
        return oauth2ClientState.client;
    }
    try {
        // Check if USE_OAUTH2 is enabled
        if (!process.env.USE_OAUTH2 || process.env.USE_OAUTH2 !== 'true') {
            logger.info('🔒 OAuth2 initialization skipped: USE_OAUTH2 is not "true" (current value: ' + (process.env.USE_OAUTH2 || 'not set') + ')');
            return null;
        }
        const tokenPath = getOAuth2TokensPath();
        // Load tokens from file
        if (!fs.existsSync(tokenPath)) {
            logger.warn(`⚠️ OAuth2 tokens file not found at ${tokenPath}`);
            return null;
        }
        const tokens = JSON.parse(fs.readFileSync(tokenPath, 'utf8'));
        logger.info('🔍 OAuth2 tokens loaded:', {
            has_access_token: !!tokens.access_token,
            has_refresh_token: !!tokens.refresh_token,
            scopes: tokens.scope?.split(' ') || 'unknown',
            expires_at: new Date(tokens.expiry_date).toISOString()
        });
        if (!tokens.refresh_token) {
            logger.error('❌ No refresh token found in OAuth2 tokens');
            return null;
        }
        const client = new google.auth.OAuth2(OAUTH2_CONFIG.client_id, OAUTH2_CONFIG.client_secret, OAUTH2_CONFIG.redirect_uri);
        client.setCredentials(tokens);
        // Initialize state
        oauth2ClientState = {
            client,
            tokens,
            refreshPromise: null,
            lastRefresh: 0,
            refreshSchedule: null
        };
        // Setup automatic token refresh event handler
        client.on('tokens', async (newTokens) => {
            logger.info('🔄 OAuth2 tokens refreshed via event handler');
            const updatedTokens = {
                ...oauth2ClientState.tokens,
                access_token: newTokens.access_token,
                expiry_date: newTokens.expiry_date,
                ...(newTokens.refresh_token && { refresh_token: newTokens.refresh_token })
            };
            oauth2ClientState.tokens = updatedTokens;
            oauth2ClientState.lastRefresh = Date.now();
            // Persist tokens
            await persistTokens(updatedTokens);
        });
        // Perform immediate refresh if token is expired or close to expiry
        if (needsImmediateRefresh(tokens)) {
            logger.info('⏰ Token expired or close to expiry, refreshing immediately...');
            const newTokens = await refreshTokensAsync(client, tokens);
            if (newTokens) {
                oauth2ClientState.tokens = newTokens;
                client.setCredentials(newTokens);
                oauth2ClientState.lastRefresh = Date.now();
            }
            else {
                logger.error('❌ Failed to refresh expired token on initialization');
                return null;
            }
        }
        // Start proactive refresh scheduler
        scheduleTokenRefresh(oauth2ClientState);
        // Set up periodic health checks
        setInterval(() => {
            if (oauth2ClientState && needsImmediateRefresh(oauth2ClientState.tokens)) {
                logger.info('🚨 Periodic check: Token needs refresh');
                scheduleTokenRefresh(oauth2ClientState);
            }
        }, TOKEN_REFRESH_INTERVAL_MS);
        logger.info('✅ Enhanced OAuth2 client initialized with proactive token management');
        return client;
    }
    catch (error) {
        logger.error('❌ OAuth2 initialization failed:', error.message);
        return null;
    }
}
// Get OAuth2 client or throw error
export async function getOAuth2Client() {
    const client = await initializeOAuth2Client();
    if (!client) {
        const error = new Error('OAuth2 not configured. Set USE_OAUTH2=true and ensure oauth2 tokens file exists');
        error.name = 'OAUTH2_NOT_CONFIGURED';
        throw error;
    }
    return client;
}
// Check if OAuth2 is available
export async function isOAuth2Available() {
    try {
        const client = await initializeOAuth2Client();
        return client !== null;
    }
    catch {
        return false;
    }
}
// Get current token status for monitoring
export function getTokenStatus() {
    if (!oauth2ClientState) {
        return { available: false, error: 'Not initialized' };
    }
    const now = Date.now();
    const timeUntilExpiry = oauth2ClientState.tokens.expiry_date - now;
    const expiresAt = new Date(oauth2ClientState.tokens.expiry_date);
    return {
        available: true,
        expiresAt: expiresAt.toISOString(),
        timeUntilExpiryMs: timeUntilExpiry,
        needsRefresh: needsImmediateRefresh(oauth2ClientState.tokens),
        refreshInProgress: oauth2ClientState.refreshPromise !== null,
        lastRefresh: oauth2ClientState.lastRefresh ? new Date(oauth2ClientState.lastRefresh).toISOString() : null
    };
}
// Manual token refresh for testing/emergency use
export async function forceTokenRefresh() {
    if (!oauth2ClientState) {
        logger.error('❌ OAuth2 not initialized');
        return false;
    }
    try {
        // Wait for any existing refresh to complete
        if (oauth2ClientState.refreshPromise) {
            await oauth2ClientState.refreshPromise;
        }
        const newTokens = await refreshTokensAsync(oauth2ClientState.client, oauth2ClientState.tokens);
        if (newTokens) {
            oauth2ClientState.tokens = newTokens;
            oauth2ClientState.client.setCredentials(newTokens);
            oauth2ClientState.lastRefresh = Date.now();
            // Reschedule next refresh
            scheduleTokenRefresh(oauth2ClientState);
            return true;
        }
        return false;
    }
    catch (error) {
        logger.error('❌ Force refresh failed:', error.message);
        return false;
    }
}
// Get Google service with OAuth2 auth
export async function getGoogleService(serviceName, version = 'v3') {
    try {
        const auth = await getOAuth2Client();
        logger.info(`🔍 Creating OAuth2 ${serviceName} service with version ${version}`);
        // Verify token has proper scopes for the service
        if (oauth2ClientState?.tokens.scope) {
            const scopes = oauth2ClientState.tokens.scope.split(' ');
            logger.info(`🔍 OAuth2 token has scopes:`, scopes);
            // Check for Drive-specific scopes if it's Drive service
            if (serviceName === 'drive') {
                const hasDriveScope = scopes.some(scope => scope.includes('drive') || scope.includes('Drive'));
                if (!hasDriveScope) {
                    logger.warn('⚠️ OAuth2 token may not have Drive scopes!');
                    logger.warn('📋 Required Drive scopes: https://www.googleapis.com/auth/drive, https://www.googleapis.com/auth/drive.file');
                }
            }
        }
        // @ts-ignore - Dynamic service access
        return google[serviceName]({ version, auth });
    }
    catch (error) {
        if (error.name === 'OAUTH2_NOT_CONFIGURED') {
            throw error; // Re-throw OAuth2 configuration errors
        }
        throw new Error(`Failed to create ${serviceName} service: ${error.message}`);
    }
}
// Export service shortcuts
export const getCalendarService = () => getGoogleService('calendar', 'v3');
export const getDriveService = () => getGoogleService('drive', 'v3');
export const getSheetsService = () => getGoogleService('sheets', 'v4');
export const getDocsService = () => getGoogleService('docs', 'v1');
export const getSlidesService = () => getGoogleService('slides', 'v1');
export const getPeopleService = () => getGoogleService('people', 'v1');
// Cleanup function for graceful shutdown
export function cleanupOAuth2Client() {
    if (oauth2ClientState?.refreshSchedule) {
        clearTimeout(oauth2ClientState.refreshSchedule);
        oauth2ClientState.refreshSchedule = null;
        logger.info('🧹 OAuth2 refresh scheduler cleaned up');
    }
}
