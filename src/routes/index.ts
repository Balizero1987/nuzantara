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

import { Express } from 'express';

// Google Workspace Routes
import gmailRoutes from './google-workspace/gmail.routes.ts';
import driveRoutes from './google-workspace/drive.routes.ts';
import calendarRoutes from './google-workspace/calendar.routes.ts';
import sheetsRoutes from './google-workspace/sheets.routes.ts';
import docsRoutes from './google-workspace/docs.routes.ts';

// AI Services Routes
import aiRoutes from './ai-services/ai.routes.ts';
import creativeRoutes from './ai-services/creative.routes.ts';

// Bali Zero Routes
import oracleRoutes from './bali-zero/oracle.routes.ts';
import pricingRoutes from './bali-zero/pricing.routes.ts';
import teamRoutes from './bali-zero/team.routes.ts';

// Communication Routes
import translateRoutes from './communication/translate.routes.ts';
// import whatsappRoutes from './communication/whatsapp.routes.ts';
// import instagramRoutes from './communication/instagram.routes.ts';

// Analytics Routes
import analyticsRoutes from './analytics/analytics.routes.ts';

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

  console.log('✅ Modular routes attached');
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
