import { z } from "zod";
const schema = z.object({
    OPENAI_API_KEY: z.string().min(10),
    OPENAI_MODEL: z.string().default("gpt-4o"),
    GOOGLE_CLIENT_ID: z.string(),
    GOOGLE_CLIENT_SECRET: z.string(),
    GOOGLE_REDIRECT_URI: z.string().url(),
    GOOGLE_SCOPES: z.string().default("https://www.googleapis.com/auth/calendar"),
    GOOGLE_OAUTH_TOKENS_SECRET: z.string().default("zantara-google-oauth-tokens"),
    GCP_PROJECT_ID: z.string(),
    PORT: z.coerce.number().default(8080)
});
export function loadConfig() {
    // dotenv only for local dev. In Cloud Run we use env directly.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    require("dotenv").config();
    const cfg = schema.parse(process.env);
    return cfg;
}
