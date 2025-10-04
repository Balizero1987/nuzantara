import { google } from "googleapis";
import { getSecretString, setSecretString } from "./secrets";
export async function getOAuthClient(opts) {
    const { projectId, clientId, clientSecret, redirectUri, tokensSecretId, scopes } = opts;
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
    // Try to load tokens from Secret Manager
    const stored = await getSecretString(projectId, tokensSecretId);
    if (stored) {
        try {
            const tokens = JSON.parse(stored);
            oauth2Client.setCredentials(tokens);
        }
        catch {
            // ignore parse errors, a new consent may be required
        }
    }
    function generateAuthUrl() {
        return oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scopes,
            prompt: "consent"
        });
    }
    async function handleCallback(code) {
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        await setSecretString(projectId, tokensSecretId, JSON.stringify(tokens));
        return tokens;
    }
    return { oauth2Client, generateAuthUrl, handleCallback };
}
