# ADR-002: Migrate from localStorage to httpOnly Cookies

**Date:** 2025-01-20  
**Status:** Accepted  
**Deciders:** Development Team

## Context

Authentication tokens are currently stored in localStorage, which is vulnerable to XSS attacks. Tokens can be accessed by malicious JavaScript.

## Decision

Migrate to httpOnly cookies for token storage. Cookies are automatically sent with requests and cannot be accessed by JavaScript.

## Consequences

### Positive
- Enhanced security (XSS protection)
- Automatic token transmission
- Server-side token management
- Better session control

### Negative
- Requires backend changes (cookie-parser)
- Frontend must use credentials: 'include'
- Slightly more complex debugging

## Implementation

1. Install cookie-parser in backend
2. Set httpOnly cookie on login
3. Clear cookie on logout
4. Update frontend to use credentials: 'include'
5. Remove localStorage token storage

## References
- OWASP: https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html
- MDN: https://developer.mozilla.org/en-US/docs/Web/HTTP/Cookies

