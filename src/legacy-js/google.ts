import { google } from "googleapis";

/** ADC standard (senza impersonation) */
export async function gclient(scopes: string[]) {
  const auth = await google.auth.getClient({ scopes });
  return { google, auth };
}

/** DWD: client JWT con impersonation (legge la SA key da env SA_GMAIL_KEY) */
export function gmailImpersonatedClient(subjectEmail: string, scopes: string[]) {
  const keyJson = process.env.SA_GMAIL_KEY;
  if (!keyJson) throw new Error("Missing SA_GMAIL_KEY env");
  const key = JSON.parse(keyJson);
  const auth = new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes,
    subject: subjectEmail,
  });
  return { google, auth };
}
