# ADR-001: Migrate from Global Variables to StateManager

**Date:** 2025-01-20
**Status:** Accepted
**Deciders:** Development Team

## Context

The webapp currently uses global variables (`let zantaraClient`, `let messages`) for state management. This causes:
- State inconsistency across components
- Difficult debugging
- No state change tracking
- No persistence strategy

## Decision

Migrate to centralized StateManager (`js/core/state-manager.js`) using Proxy-based reactivity.

## Consequences

### Positive
- Centralized state management
- Reactive updates (Proxy pattern)
- Better debugging (state change tracking)
- Easier testing (mock state)
- Pub-sub pattern for state changes

### Negative
- Migration effort (~2-3 hours)
- Learning curve for new developers
- Slight performance overhead (Proxy)

## Implementation

1. Import StateManager in app.js
2. Replace global variables with stateManager.setState()
3. Subscribe to state changes where needed
4. Update all references to use stateManager.getState()

## References
- `js/core/state-manager.js` (230 lines, production-ready)
- Proxy pattern: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy
