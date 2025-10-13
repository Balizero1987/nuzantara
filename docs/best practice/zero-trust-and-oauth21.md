# Zero Trust and OAuth 2.1

## Zero Trust Architecture
- Follow NIST SP 800-207: strong identity, policy decisions per request, segmentation, and least privilege.
- Adopt BeyondCorp principles: grant access based on user, device, and context attributes instead of network location.
- Enforce mutual TLS or Identity-Aware Proxy layers between services; define micro-perimeters around critical resources.

## OAuth 2.1 Practices
- Treat OAuth 2.1 as the consolidated baseline: implicit grant and resource owner password credentials are deprecated, PKCE is mandatory, and HTTPS is required.
- Prefer the authorization code flow with PKCE for all applications, including server-side web apps.
- Rotate refresh tokens, revoke on suspicion, and bind access tokens to the client (mTLS or DPoP) wherever possible.
- Use PAR (Pushed Authorization Requests) and JAR (JWT Secured Authorization Requests) when your identity provider supports them.
- Issue minimal scopes, restrict audiences, and keep token lifetimes short.
