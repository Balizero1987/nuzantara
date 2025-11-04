import type { Request, Response, NextFunction } from 'express';
import { OAuth2Client, TokenPayload } from 'google-auth-library';

// Minimal OIDC verification for Google Chat webhook
// Enable with CHAT_VERIFY_OIDC=true and set CHAT_AUDIENCE to your webhook URL

const oidc = new OAuth2Client();

function expectedAudience(req: Request): string | undefined {
  // Prefer explicit env value; fallback to computed URL
  const aud = process.env.CHAT_AUDIENCE;
  if (aud && aud.trim()) return aud.trim();
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;
  const host = req.get('host');
  if (!host) return undefined;
  return `${proto}://${host}${req.originalUrl}`;
}

export async function verifyChatOIDC(req: Request, res: Response, next: NextFunction) {
  try {
    if (process.env.CHAT_VERIFY_OIDC !== 'true') return next();

    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) {
      return res.status(401).json({ ok: false, error: 'missing_bearer_token' });
    }

    const idToken = auth.slice(7);
    const audience = expectedAudience(req);

    const ticket = await oidc.verifyIdToken({
      idToken,
      audience, // If undefined, library won’t enforce aud
    });

    const payload: TokenPayload | undefined = ticket.getPayload();
    if (!payload) return res.status(401).json({ ok: false, error: 'invalid_token' });

    const iss = payload.iss || '';
    // Accept Google issuers; refine if needed
    if (!iss.includes('accounts.google.com')) {
      return res.status(401).json({ ok: false, error: 'invalid_issuer' });
    }

    (req as any).__chat_oidc = payload;
    return next();
  } catch (e: any) {
    return res
      .status(401)
      .json({ ok: false, error: 'oidc_failed', message: e?.message || 'verification_failed' });
  }
}
