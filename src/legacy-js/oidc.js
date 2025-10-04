import { OAuth2Client } from "google-auth-library";
/**
 * Verifica il bearer token OIDC che Google Chat invia (Authorization: Bearer <token>)
 * Soft-lock: lasciamo l'endpoint pubblico, ma accettiamo SOLO richieste con token valido.
 */
const oidc = new OAuth2Client();
/** Audience attesa: per sicurezza combacia con l'URL del tuo endpoint /chat/events */
const EXPECTED_AUD = process.env.CHAT_AUDIENCE || ""; // es. https://...run.app/chat/events
export async function verifyChatOIDC(req, res, next) {
    try {
        const auth = req.headers.authorization || "";
        if (!auth.startsWith("Bearer "))
            return res.status(401).send("Missing bearer token");
        const idToken = auth.slice(7);
        const ticket = await oidc.verifyIdToken({
            idToken,
            // L'audience può essere il tuo endpoint; se vuoto, accettiamo comunque ma controlliamo issuer.
            audience: EXPECTED_AUD || undefined,
        });
        const payload = ticket.getPayload();
        if (!payload)
            return res.status(401).send("Invalid token");
        const iss = payload.iss || "";
        if (!iss.includes("accounts.google.com"))
            return res.status(401).send("Invalid issuer");
        // opzionale: puoi controllare azp, email_verified, ecc.
        req.__chat_oidc = payload;
        return next();
    }
    catch (e) {
        return res.status(401).send("OIDC failed: " + (e?.message || e));
    }
}
