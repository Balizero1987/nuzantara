# WhatsApp Templates and Flows

## Interactive Flows (WhatsApp Flows)
- Use Flows for structured data capture such as bookings, lead intake, or feedback forms directly inside WhatsApp.
- Define the interface in Flow JSON, publish versions (draft to published), and maintain backward compatibility for in-flight users.
- Validate the `X-Hub-Signature-256` header on callbacks using your app secret and respond idempotently; treat each Flow submission as an event that can retry.
- Pre-fill known fields to reduce friction and implement backend "save and resume" with explicit TTLs for partial submissions.

## Template Messages
- Select the correct template category (marketing, utility, authentication, service) and craft concise, contextual copy with parameter placeholders such as `{{1}}`.
- Respect creation and edit rate limits; localize templates with WhatsApp language codes and keep translation inventories synchronized.
- Model per-message costs per geography and category in your financial planning.

### Recommended Patterns
- Marketing: single clear call to action, explicit value proposition, and opt-out links.
- Utility: transactional updates (order status, appointment slot) with minimal copy.
- Authentication: OTP or PIN with expiry, retry counter, and client-side input validation cues.
