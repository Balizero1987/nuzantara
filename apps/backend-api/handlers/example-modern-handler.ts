/**
 * Example: Modern Handler using HandlerRegistry
 *
 * This demonstrates the new pattern for creating handlers
 * that auto-register without manual router.ts updates
 */

import { globalRegistry } from "../core/handler-registry.js";
import { ok, err } from "../../utils/response.js";

/**
 * Handler: Send Email via Gmail
 *
 * Auto-registers as "gmail.send.v2"
 */
export async function sendEmailV2(params: any, req?: any) {
  const { to, subject, body } = params;

  if (!to || !subject || !body) {
    return err("missing_params", "to, subject, and body are required");
  }

  // TODO: Implement actual Gmail API call
  // For now, mock success
  return ok({
    messageId: `msg_${Date.now()}`,
    to,
    subject,
    status: "sent",
    timestamp: new Date().toISOString()
  });
}

/**
 * Handler: List Inbox
 *
 * Auto-registers as "gmail.list.v2"
 */
export async function listInboxV2(params: any, req?: any) {
  const { maxResults = 10, pageToken } = params;

  // TODO: Implement actual Gmail API call
  return ok({
    messages: [],
    nextPageToken: null,
    resultSizeEstimate: 0
  });
}

/**
 * Handler: KBLI Lookup (modern version)
 *
 * Auto-registers as "kbli.lookup.v2"
 */
export async function kbliLookupV2(params: any, req?: any) {
  const { code, query } = params;

  if (!code && !query) {
    return err("missing_params", "Either 'code' or 'query' is required");
  }

  // TODO: Implement KBLI database lookup
  // For now, return mock data
  return ok({
    code: code || "62010",
    title: "Pemrograman Komputer",
    risk: "low",
    requirements: ["NIB", "OSS", "NPWP"],
    category: "Information & Communication"
  });
}

// === AUTO-REGISTRATION ===
// Register all handlers in this module

globalRegistry.registerModule('gmail-v2', {
  'send': sendEmailV2,
  'list': listInboxV2
}, {
  requiresAuth: true,
  version: '2.0'
});

globalRegistry.registerModule('kbli-v2', {
  'lookup': kbliLookupV2
}, {
  requiresAuth: false,
  version: '2.0'
});

// Alternative: Individual registration
// globalRegistry.register({
//   key: 'gmail.send.v2',
//   handler: sendEmailV2,
//   module: 'google-workspace',
//   description: 'Send email via Gmail API v2',
//   requiresAuth: true,
//   version: '2.0'
// });
