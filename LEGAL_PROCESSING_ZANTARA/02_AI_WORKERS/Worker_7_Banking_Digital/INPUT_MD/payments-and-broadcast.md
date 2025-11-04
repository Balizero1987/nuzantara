# WhatsApp Payments and Broadcast Guidance

## Payments
- Brazil: use the official Payments API to accept in-chat payments, managing order creation and charge confirmation inside WhatsApp.
- India: leverage UPI flows through WhatsApp Payments (payment links and supported gateways).
- Availability is limited to Brazil and India; in other regions rely on payment links or external checkout flows that respect WhatsApp's policies.
- Maintain PCI compliance where applicable and store payment artifacts in secure, segregated systems.

## Groups and Broadcasts
- WhatsApp Cloud API does not support sending messages to groups.
- Implement broadcasts as compliant one-to-one sends using approved marketing templates, opt-in records, frequency controls, and opt-out links.
- Segment recipients, monitor delivery and pricing, and avoid high-frequency campaigns that could trigger rate limits or user complaints.
