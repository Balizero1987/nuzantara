# Zantara Bridge - Best Practices (v2025-09)

Short version: robustness, security, performance. In that order.
Operating slogan: build calm, ship fast, measure honestly.

## Index
- 10. Custom GPT and AI Assistants
  - 10.1 Assistants API v2, Responses API, and tools
  - 10.2 GPT Store optimisation
  - 10.3 Plugin to GPT Actions migration
  - 10.4 Voice assistants (Alexa and Google)
  - 10.5 Conversational patterns and dialog management
  - 10.6 NLU and NLP pipelines (intent and entities)
  - 10.7 Multi-turn and context management
  - 10.8 Persona and tone
- 11. Mobile and Cross-Platform
  - 11.1 PWA offline and Workbox
  - 11.2 React Native
  - 11.3 Flutter
  - 11.4 Push notifications (FCM and APNs)
  - 11.5 Biometrics and passkeys
  - 11.6 QR codes and check-in
  - 11.7 Geolocation and privacy
  - 11.8 Mobile SDKs (native integrations)
- Security overlay (OWASP MASVS quick map)

---

## 10. Custom GPT and AI Assistants

### 10.1 Assistants API v2, Responses API, and tools
- Prefer the Responses API for general agentic workflows (unified tooling, structured outputs, web and file search, computer use) and migrate Assistants v2 flows to Responses where stateless pipelines fit better.
- Continue using Assistants v2 when server-side management of threads, messages, and vector stores is required with OpenAI File Search or Code Interpreter.
- For real-time voice, use the Realtime API (low latency, speech-to-speech, multimodal).

**Robust outputs**
- Enable structured outputs with JSON schema and `strict: true` so responses validate cleanly. Version schemas and fall back to an explanation path if validation fails.
- For function or action calling, define idempotent contracts, safe timeouts, exponential backoff, and correlation IDs.

**RAG and file search**
- Store documents in OpenAI vector stores only when hosted tooling is required; otherwise run RAG in-house for cost and privacy control.

**Testing and evals**
- Maintain eval sets with gold conversations and KPIs (accuracy, tool success, hallucination rate). Automate nightly regression when prompts or tools change.

**Checklist (API)**
- Structured outputs active on critical responses.
- Tool calling idempotent with retry and backoff.
- Realtime API for voice with latency under 300 ms.
- Minimum evals per feature before merge.

### 10.2 GPT Store optimisation
- Verify the Builder Profile (name or domain) and set visibility to Everyone with the correct category.
- GPT Actions backed by external APIs require verified domain and privacy policy URL.
- Follow Usage Policies and Brand Guidelines; apply for "Get featured" only with a clear value proposition, tidy instructions, and strong previews.
- Optimise the About section with structured instructions (trigger to action), few-shot examples, and consistent tone.
- Legacy plugins are deprecated; migrate investment to GPTs plus Actions.

**Checklist (Store)**
- Builder Profile verified (name or domain).
- Category, imagery, and benefit-first pitch in place.
- Actions linked to verified domain with privacy policy.

### 10.3 Plugin to GPT Actions migration
- Convert plugin endpoints into OpenAPI schemas for GPT Actions, specifying auth (OAuth or API key), rate limits, and response models.
- Update manuals from "Plugins deprecated" to "Use GPT Actions".

**Checklist (Actions)**
- Valid OpenAPI with request and response samples.
- User-friendly errors mapped into structured outputs.

### 10.4 Voice assistants (Alexa and Google)
- Google Conversational Actions are sunset (2023-06-13); avoid new builds and migrate to Android App Actions or shortcuts.
- Alexa: follow the design guide for interaction model, visuals, and certification; craft a unique invocation phrase, consistent UX, and compliant policy handling.
- Conversation design principles: clear persona, short turns, context management, disambiguation based on the cooperative principle.

**Checklist (Voice)**
- No new Conversational Actions work.
- Alexa skills pass certification with personalisation and monetisation tests.

### 10.5 Conversational patterns and dialog management
- State capabilities and limits transparently; use clickable guidance and tolerate ambiguity (NNG guidance).
- Provide prompt controls with standard icons and labels, grouping functions and exposing parameters to lower cognitive load.
- Ask targeted clarification questions when user input is vague.

**Checklist (Dialog)**
- Bot communicates what it can do.
- Prompt UI is simple, labelled, and grouped.

### 10.6 NLU and NLP pipelines (intent and entities)
- Start with about 10-20 utterances per intent, expand with analytics, and capture synonyms and variants.
- Configure confidence thresholds with fallback messaging and human handoff flows.
- Use input and output contexts to disambiguate umbrella intents in multi-scene conversations.

**Checklist (NLU)**
- Threshold and fallback logic with helpful messaging.
- Contexts active for umbrella intents.

### 10.7 Multi-turn and context management
- Manage token budgets by summarising conversations periodically and keeping the last K turns; leave roughly 25k tokens free for reasoning and output with long-context models.
- Store persistent data (consent, preferences) in your own storage; keep API threads for ephemeral context only.

**Checklist (Context)**
- Automatic summarisation triggered after N turns.
- PII handled outside prompts in secure stores.

### 10.8 Persona and tone
- Craft clear, positive instructions with few-shot examples; avoid ambiguous negative instructions.
- Keep persona guidance specific yet concise so it stays top of mind (Google conversation design guidance).
- Use Custom Instructions or the instructions parameter to encode tone, goals, and output formats.

**Persona skeleton**
```json
{
  "role": "system",
  "instructions": "# Who you are\n...\n# Do/Don't\n...\n# Style\n...\n# Examples\n- Input: ...\n  Output: ..."
}
```

---

## 11. Mobile and Cross-Platform

### 11.1 PWA offline and Workbox
- Register a service worker with precached versioned assets plus runtime caching: stale-while-revalidate for lists, cache-first for fonts and icons, network-only for mutations.
- Use Workbox for routing, strategies, updates, and simplified lifecycle handling.
- Design offline UX (fallback page) and apply caching policies for safety and performance.

**Checklist (PWA)**
- Service worker registered with precache and runtime caching.
- Offline fallback and update prompt present.

### 11.2 React Native
- Adopt the New Architecture (Fabric and TurboModules) and Hermes (React Native 0.74+) for performance and compatibility.
- Track releases (for example 0.77 styling changes, Android 16 KB pages) and debug via Hermes or Flipper.

**Checklist (React Native)**
- New Architecture enabled, Hermes on.
- Release builds apply ProGuard or R8 and `shrinkResources`.

### 11.3 Flutter
- Enable Impeller (precompiled shaders) to reduce jank; profile with DevTools Performance and target 60 or 120 fps.
- Separate ephemeral and app state; minimise rebuilds by positioning consumers deep in the widget tree.

**Checklist (Flutter)**
- Impeller active with jank profiling.
- State management pattern explicit (Provider, Riverpod, BLoC, or platform native).

### 11.4 Push notifications (FCM and APNs)
- FCM: manage token lifecycle (rotation and cleanup), leverage topics or device groups for targeting and scale.
- APNs: request permission at the right time (including provisional auth for trials), set correct headers (`apns-push-type`, TTL), and reuse connections.
- Configure iOS Live Activities with correct priority and relevance for push updates.

**Checklist (Push)**
- Token hygiene and retry strategy for FCM.
- Provisional permissions and timing handled on iOS.

### 11.5 Biometrics and passkeys
- Android: use `BiometricPrompt` with Class 3 authenticators; avoid direct PIN fallback for high-risk actions; integrate Credential Manager for passkeys.
- Apple: use `LocalAuthentication` and `LAContext` for Face or Touch ID and `AuthenticationServices` with iCloud Keychain for passkeys.

**Checklist (Auth)**
- Passkeys offered as default sign-in.
- BiometricPrompt or LAContext flows with deliberate fallback UX.

### 11.6 QR codes and check-in
- Use on-device scanners (ML Kit or VisionKit) and whitelist expected symbologies for speed and accuracy.
- Provide dedicated scan regions and UI guidance for lighting and contrast (ZXing best practices).
- Avoid PII in QR payloads; use signed JWTs or short-lived tokens (TOTP or nonce).

**Checklist (QR)**
- Symbologies whitelist and region of interest defined.
- Payload uses signed claims or ephemeral tokens.

### 11.7 Geolocation and privacy
- Follow W3C principles: explicit consent, minimisation, no retransmission without permission, encrypted transit.
- Android: respect strict background location rules (`ACCESS_BACKGROUND_LOCATION`), optimise battery with fused provider or geofencing.
- iOS: choose permission granularity (when-in-use or always, precise or approximate) and appropriate services (standard or significant-change).

**Checklist (Geo)**
- Contextual permission prompt with precise or approximate toggle.
- Background location reserved for mission-critical cases with UX and battery budget documented.

### 11.8 Mobile SDKs (native integrations)
- iOS: include a Privacy Manifest (collected data plus Required Reason APIs) and distribute through Swift Package Manager or XCFramework; update entries when telemetry changes.
- Android: publish AAR artifacts to Maven Central using Gradle `maven-publish`; follow SemVer with clear changelog.
- Track Android Privacy Sandbox and SDK Runtime (Android 14+) when integrating advertising or measurement SDKs.

**Checklist (SDK)**
- Privacy manifest and Required Reason API entries present on iOS.
- Publishing pipeline (Maven or SPM) automated with SemVer tags.

---

## Security overlay (OWASP MASVS quick map)
- Networking: enforce TLS with certificate or public-key pinning where appropriate.
- Storage: prevent data leaks in backups, logs, or clipboard.
- Local auth: follow platform biometric best practices.
- Resilience: implement baseline anti-tampering and require updates for critical releases.
- Reference MASVS v2.1.0 including the privacy track.

---

## Appendix - reusable snippets

**Workbox runtime caching**
```js
// sw.js
import { registerRoute } from 'workbox-routing'
import { StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'

registerRoute(({ request }) => request.destination === 'style', new StaleWhileRevalidate())
registerRoute(({ request }) => request.destination === 'image', new CacheFirst({ cacheName: 'images' }))
```

**Android BiometricPrompt setup**
```kotlin
val promptInfo = BiometricPrompt.PromptInfo.Builder()
  .setTitle("Unlock")
  .setAllowedAuthenticators(BIOMETRIC_STRONG)
  .build()
```

---

## Final operational notes
- Track OpenAI model changelogs and production best practices for cost, latency, and robustness.
- Refresh ChatGPT Store listings with examples, changelog entries, and policy alignment.

## Optional next steps
- Add `CHECKS.md` with extracted checklists ready for CI.
- Create a `prompts/` directory with persona and structured output templates.
- Label tasks (Critical, Recommended, Nice-to-have) to avoid sandcastle syndrome.
