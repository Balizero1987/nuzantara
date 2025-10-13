/**
 * Centralized Google Authentication Service
 * Unifies OAuth2 + Service Account authentication patterns
 * Eliminates duplicate GoogleAuth configurations across handlers
 */

import { google } from 'googleapis';
import { GoogleAuth } from 'google-auth-library';
import * as fs from 'fs';
import {
  getCalendarService,
  getDriveService,
  getSheetsService,
  getDocsService,
  getSlidesService,
  getPeopleService,
  isOAuth2Available
} from './oauth2-client.js';

interface AuthConfig {
  scopes: string[];
  serviceName: string;
}

/**
 * Get authenticated Google service with unified OAuth2 → Service Account fallback
 */
async function getAuthenticatedService<T>(
  config: AuthConfig,
  serviceFactory: (auth: any) => T,
  oauth2Service?: () => Promise<T>
): Promise<T | null> {

  // Detailed auth configuration logging
  console.log(`🔍 Auth config for ${config.serviceName}:`, {
    USE_OAUTH2: process.env.USE_OAUTH2 || 'not set',
    GOOGLE_APPLICATION_CREDENTIALS: process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'set' : 'not set',
    GOOGLE_SERVICE_ACCOUNT_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? 'set' : 'not set',
    IMPERSONATE_USER: process.env.IMPERSONATE_USER || 'not set',
    Required_scopes: config.scopes
  });

  // Check if USE_OAUTH2 is explicitly enabled and OAuth2 is available
  const useOAuth2 = process.env.USE_OAUTH2 === 'true';
  const oauth2Available = useOAuth2 ? await isOAuth2Available() : false;

  console.log(`🔐 Auth decision for ${config.serviceName}:`, {
    USE_OAUTH2_env: process.env.USE_OAUTH2,
    useOAuth2_parsed: useOAuth2,
    oauth2Available: oauth2Available,
    willUseOAuth2: oauth2Available && oauth2Service
  });

  if (oauth2Available && oauth2Service) {
    try {
      console.log(`🔑 Attempting OAuth2 for ${config.serviceName}...`);
      const service = await oauth2Service();
      console.log(`✅ OAuth2 succeeded for ${config.serviceName}`);
      return service;
    } catch (error: any) {
      console.warn(`⚠️ OAuth2 ${config.serviceName} failed:`, {
        error: error?.message,
        name: error?.name,
        code: error?.code,
        details: error?.response?.data || error?.errors
      });

      // Log specific OAuth2 errors for debugging
      if (error.name === 'OAUTH2_NOT_CONFIGURED') {
        console.warn('🔧 OAuth2 not configured properly');
      } else if (error.code === 401) {
        console.warn('🔐 OAuth2 authentication failed - token may be expired');
      } else if (error.code === 403) {
        console.warn('🚫 OAuth2 access denied - check scopes');
        if (error?.message?.includes('insufficient authentication scopes')) {
          console.warn('📋 OAuth2 token missing required scopes:', config.scopes);
        }
      }
      console.log(`🔄 Falling back to Service Account for ${config.serviceName}`);
    }
  } else if (useOAuth2) {
    console.log(`⚠️ OAuth2 enabled but not available for ${config.serviceName}, using service account`);
  } else {
    console.log(`🔑 OAuth2 disabled (USE_OAUTH2=${process.env.USE_OAUTH2}), using Service Account for ${config.serviceName}`);
  }

  // Use service account authentication (Domain‑Wide Delegation via JWT)
  try {
    console.log(`🔑 Initializing Service Account (JWT) for ${config.serviceName}`);
    const keyFile = process.env.GOOGLE_APPLICATION_CREDENTIALS || '';
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '';
    const impersonate = process.env.IMPERSONATE_USER || undefined;

    if (!keyFile && !raw) {
      console.error('❌ No Google Service Account credentials found');
      console.error('💡 Set GOOGLE_APPLICATION_CREDENTIALS (file path) or GOOGLE_SERVICE_ACCOUNT_KEY (JSON string)');
      return null;
    }

    const sa = raw
      ? JSON.parse(raw)
      : JSON.parse(fs.readFileSync(keyFile, 'utf8'));

    if (!sa.client_email || !sa.private_key) {
      throw new Error('Service account JSON missing client_email/private_key');
    }

    console.log(`📋 Service Account config:`, {
      keyFile: keyFile ? `✅ Set (${keyFile})` : '❌ Not set',
      credentialsKey: raw ? `✅ Set (length: ${raw.length})` : '❌ Not set',
      client_email: sa.client_email || 'missing',
      private_key: sa.private_key ? `✅ Set (length: ${sa.private_key.length})` : '❌ Missing',
      scopes: config.scopes,
      impersonate: impersonate || 'none'
    });

    const jwt = new google.auth.JWT({
      email: sa.client_email,
      key: sa.private_key,
      scopes: config.scopes,
      subject: impersonate,
    });

    console.log(`🔗 Creating ${config.serviceName} client with JWT…`);
    const service = serviceFactory(jwt);
    console.log(`✅ Service Account authentication successful for ${config.serviceName}`);
    return service;
  } catch (error: any) {
    console.error(`❌ ${config.serviceName} Service Account authentication failed:`, error?.message);
    console.error(`❌ Error details:`, {
      name: error.name,
      code: error.code,
      status: error.status,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });

    // Provide helpful error messages
    if (error.message?.includes('ENOENT')) {
      console.error('💡 Service account key file not found. Check GOOGLE_APPLICATION_CREDENTIALS path.');
    } else if (error.message?.includes('invalid_grant')) {
      console.error('💡 Service account key is invalid or expired.');
    } else if (error.message?.includes('unregistered callers')) {
      console.error('💡 Service account not authorized for this API. Check:');
      console.error('   - Google Cloud Console: Enable required APIs');
      console.error('   - Service account has necessary IAM roles');
      console.error('   - For Workspace APIs: Enable domain-wide delegation');
    }
    return null;
  }
}

/**
 * Unified Google Calendar authentication
 */
export async function getCalendar() {
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/calendar.readonly',
      ],
      serviceName: 'Calendar'
    },
    (auth) => google.calendar({ version: 'v3', auth: auth as any }),
    async () => {
      try {
        return await getCalendarService();
      } catch (error: any) {
        console.error('🔴 OAuth2 Calendar service failed:', error.message);
        throw error;
      }
    }
  );
}

/**
 * Unified Google Drive authentication
 */
export async function getDrive() {
  // Use the unified authentication function with proper logging
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/drive',
        'https://www.googleapis.com/auth/drive.file',
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/drive.metadata.readonly'
      ],
      serviceName: 'Drive'
    },
    (auth) => google.drive({ version: 'v3', auth: auth as any }),
    async () => {
      try {
        const service = await getDriveService();
        // Check if the OAuth2 client has sufficient scopes
        console.log('🔍 Verifying OAuth2 Drive scopes...');
        return service;
      } catch (error: any) {
        console.error('🔴 OAuth2 Drive service failed:', {
          error: error.message,
          code: error.code,
          details: error?.response?.data || error?.errors
        });
        throw error;
      }
    }
  );
}

/**
 * Unified Google Sheets authentication
 */
export async function getSheets() {
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/spreadsheets.readonly',
      ],
      serviceName: 'Sheets'
    },
    (auth) => google.sheets({ version: 'v4', auth: auth as any }),
    async () => {
      try {
        return await getSheetsService();
      } catch (error: any) {
        console.error('🔴 OAuth2 Sheets service failed:', error.message);
        throw error;
      }
    }
  );
}

/**
 * Unified Google Docs authentication
 */
export async function getDocs() {
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/documents',
        'https://www.googleapis.com/auth/documents.readonly',
      ],
      serviceName: 'Docs'
    },
    (auth) => google.docs({ version: 'v1', auth: auth as any }),
    async () => {
      try {
        return await getDocsService();
      } catch (error: any) {
        console.error('🔴 OAuth2 Docs service failed:', error.message);
        throw error;
      }
    }
  );
}

/**
 * Unified Google Slides authentication
 */
export async function getSlides() {
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/presentations',
        'https://www.googleapis.com/auth/presentations.readonly',
      ],
      serviceName: 'Slides'
    },
    (auth) => google.slides({ version: 'v1', auth: auth as any }),
    async () => {
      try {
        return await getSlidesService();
      } catch (error: any) {
        console.error('🔴 OAuth2 Slides service failed:', error.message);
        throw error;
      }
    }
  );
}

/**
 * Unified Gmail authentication
 */
export async function getGmail() {
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      serviceName: 'Gmail'
    },
    (auth) => google.gmail({ version: 'v1', auth: auth as any })
    // No OAuth2 service for Gmail yet - only service account
  );
}

/**
 * Unified Google Contacts authentication
 */
export async function getContacts() {
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/contacts',
        'https://www.googleapis.com/auth/contacts.readonly',
      ],
      serviceName: 'Contacts'
    },
    (auth) => google.people({ version: 'v1', auth: auth as any }),
    async () => {
      try {
        return await getPeopleService();
      } catch (error: any) {
        console.error('🔴 OAuth2 Contacts service failed:', error.message);
        throw error;
      }
    }
  );
}

/**
 * Unified Google Translate authentication
 */
export async function getTranslate() {
  return getAuthenticatedService(
    {
      scopes: [
        'https://www.googleapis.com/auth/cloud-translation',
      ],
      serviceName: 'Translate'
    },
    (auth) => google.translate({ version: 'v2', auth: auth as any })
  );
}

/**
 * Generic Google Service authentication for any service
 */
export async function getGoogleService<T>(
  serviceFactory: (auth: any) => T,
  scopes: string[],
  serviceName: string = 'Google Service'
): Promise<T | null> {
  return getAuthenticatedService(
    { scopes, serviceName },
    serviceFactory
  );
}
