/**
 * Google Workspace Module Registry
 * Auto-registers all handlers in this module
 */

import logger from '../../services/logger.js';
import { globalRegistry } from '../../core/handler-registry.js';

// Import all handlers
import { gmailHandlers } from './gmail.js';
import { driveUpload, driveList, driveSearch, driveRead } from './drive.js';
import { calendarCreate, calendarList, calendarGet } from './calendar.js';
import { sheetsRead, sheetsAppend, sheetsCreate } from './sheets.js';
import { docsCreate, docsRead, docsUpdate } from './docs.js';
import { slidesCreate, slidesRead, slidesUpdate } from './slides.js';
import { contactsList, contactsCreate } from './contacts.js';

/**
 * Register all Google Workspace handlers
 * This function is called automatically when the module is imported
 */
export function registerGoogleWorkspaceHandlers() {
  // Gmail handlers (object-based)
  for (const [key, handler] of Object.entries(gmailHandlers)) {
    globalRegistry.register({
      key,
      handler,
      module: 'google-workspace',
      requiresAuth: true,
      description: `Gmail: ${key.replace('gmail.', '')}`
    });
  }

  // Drive handlers
  globalRegistry.registerModule('google-workspace', {
    'drive.upload': driveUpload,
    'drive.list': driveList,
    'drive.search': driveSearch,
    'drive.read': driveRead
  }, { requiresAuth: true });

  // Calendar handlers
  globalRegistry.registerModule('google-workspace', {
    'calendar.create': calendarCreate,
    'calendar.list': calendarList,
    'calendar.get': calendarGet
  }, { requiresAuth: true });

  // Sheets handlers
  globalRegistry.registerModule('google-workspace', {
    'sheets.read': sheetsRead,
    'sheets.append': sheetsAppend,
    'sheets.create': sheetsCreate
  }, { requiresAuth: true });

  // Docs handlers
  globalRegistry.registerModule('google-workspace', {
    'docs.create': docsCreate,
    'docs.read': docsRead,
    'docs.update': docsUpdate
  }, { requiresAuth: true });

  // Slides handlers
  globalRegistry.registerModule('google-workspace', {
    'slides.create': slidesCreate,
    'slides.read': slidesRead,
    'slides.update': slidesUpdate
  }, { requiresAuth: true });

  // Contacts handlers
  globalRegistry.registerModule('google-workspace', {
    'contacts.list': contactsList,
    'contacts.create': contactsCreate
  }, { requiresAuth: true });

  logger.info('✅ Google Workspace handlers registered');
}

// Auto-register on module load
registerGoogleWorkspaceHandlers();
