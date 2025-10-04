// Compatibility shim: expose getHandlers for Bridge
// Routes and Bridge dynamically import this module as './handlers.js'.
// The actual implementation lives under cleanup-backup/handlers.js.
export { getHandlers } from './cleanup-backup/handlers.js';

