/**
 * ZANTARA Routes Index
 * Aggregates all modular routes
 *
 * Migration from router.ts (1,476 lines) → modular structure
 * Benefits:
 * - Better code organization
 * - Easier testing (unit test per route)
 * - Team collaboration (no merge conflicts)
 * - Lazy loading support
 */

import { logger } from '../logging/unified-logger.js';
import { Express } from 'express';

// Google Workspace Routes
import gmailRoutes from './google-workspace/gmail.routes.js';
import driveRoutes from './google-workspace/drive.routes.js';
import calendarRoutes from './google-workspace/calendar.routes.js';
import sheetsRoutes from './google-workspace/sheets.routes.js';
import docsRoutes from './google-workspace/docs.routes.js';

// AI Services Routes
import aiRoutes from './ai-services/ai.routes.js';
import creativeRoutes from './ai-services/creative.routes.js';

// Bali Zero Routes
import oracleRoutes from './bali-zero/oracle.routes.js';
import pricingRoutes from './bali-zero/pricing.routes.js';
import teamRoutes from './bali-zero/team.routes.js';

// Communication Routes
import translateRoutes from './communication/translate.routes.js';
// import whatsappRoutes from './communication/whatsapp.routes.js';
// import instagramRoutes from './communication/instagram.routes.js';

// Analytics Routes
import analyticsRoutes from './analytics/analytics.routes.js';

// RAG Management Routes
import ragRoutes from './rag.routes.js';

/**
 * Attach all routes to Express app
 */
export function attachModularRoutes(app: Express) {
  // Google Workspace
  app.use('/api/gmail', gmailRoutes);
  app.use('/api/drive', driveRoutes);
  app.use('/api/calendar', calendarRoutes);
  app.use('/api/sheets', sheetsRoutes);
  app.use('/api/docs', docsRoutes);

  // AI Services
  app.use('/api/ai', aiRoutes);
  app.use('/api/creative', creativeRoutes);

  // Bali Zero
  app.use('/api/oracle', oracleRoutes);
  app.use('/api/pricing', pricingRoutes);
  app.use('/api/team', teamRoutes);

  // Communication
  app.use('/api/translate', translateRoutes);
  // app.use('/api/whatsapp', whatsappRoutes);
  // app.use('/api/instagram', instagramRoutes);

  // Analytics
  app.use('/api/analytics', analyticsRoutes);
  
  // RAG Management
  app.use('/api/rag', ragRoutes);

  logger.info('✅ Modular routes attached (including RAG)');
}

/**
 * Get route statistics
 */
export function getRouteStats() {
  return {
    totalModules: 12, // Update as routes are added
    implemented: [
      'gmail', 'drive', 'calendar', 'sheets', 'docs',
      'ai', 'creative',
      'oracle', 'pricing', 'team',
      'translate',
      'analytics'
    ],
    pending: [
      'whatsapp', 'instagram'
    ],
    note: 'Webhook routes (WhatsApp, Instagram) remain in router.ts by design'
  };
}
