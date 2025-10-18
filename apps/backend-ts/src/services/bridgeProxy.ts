// Bridge.js is disabled in production (legacy code)
// All handlers now use direct implementations instead of bridge fallback

// DISABLED: Bridge loading removed to fix MODULE_NOT_FOUND error in production
// The legacy bridge.js system has been replaced with direct TypeScript handlers

export async function forwardToBridgeIfSupported(_key: string, _params: any) {
  // Bridge disabled - return null to indicate handler not found via bridge
  // Handlers will use their own implementations
  return null;
}
