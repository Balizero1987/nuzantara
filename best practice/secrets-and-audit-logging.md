# Secrets Management and Audit Logging

## Secrets
- Follow NIST SP 800-57 for key lifecycle management.
- Automate rotation using services such as AWS Secrets Manager or HashiCorp Vault; prefer short-lived credentials delivered via OIDC in CI/CD pipelines.
- Avoid static tokens; restrict scope and lifetime, and monitor usage continuously.

## Audit Logging
- Base logging controls on NIST SP 800-92 and NIST SP 800-53 AU family guidance.
- For WhatsApp integrations capture at least: `event_id`, timestamp, `wa_id`, `message.id`, `phone_number_id`, direction, message type, delivery status, template name, pricing category, and webhook verification result.
- Protect logs against tampering, enforce retention policies, and stream them to a centralised, access-controlled platform.
