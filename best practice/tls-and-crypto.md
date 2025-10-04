# TLS and Cryptography Standards

## Encryption in Transit
- Enforce TLS 1.3 everywhere, enable perfect forward secrecy, and disable legacy cipher suites.
- Enable HSTS with an appropriate max-age and preload configuration where feasible.
- Monitor certificate expiration, automate renewals, and pin trust stores when policy allows.

## Encryption at Rest
- Use AES-GCM 256 with centrally managed keys; reference NIST SP 800-175B for key management patterns.
- Rotate encryption keys on a fixed cadence and after security events; document rotation workflows.
- Ensure backups inherit the same encryption posture and access controls as primary storage.
