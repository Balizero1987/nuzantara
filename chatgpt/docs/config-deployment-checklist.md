# Production Deployment Checklist for Configuration

This checklist ensures that the new configuration system is deployed to production correctly and securely.

- [ ] **Verify Environment Variables:** Ensure that all required environment variables (e.g., `NODE_ENV`, `DB_PASSWORD`, `JWT_SECRET`) are set in the production environment.
- [ ] **File Permissions:** The `production.yaml` file should have restricted read permissions.
- [ ] **Disable Hot-Reload:** Confirm that hot-reloading is disabled in the production environment. The `centralized-config.ts` should already handle this.
- [ ] **Logging:** Verify that the logging system is correctly configured to capture configuration-related events.
- [ ] **Secret Management:** Confirm that a secure secret management solution (like HashiCorp Vault or AWS Secrets Manager) is in place for production secrets.
- [ ] **Backup:** Take a backup of the existing configuration before deploying the new system.
- [ ] **Rollback Plan:** Have a rollback plan in place in case of any issues.


## CORS Configuration

- [ ] **Verify Allowed Origins:** Ensure that the `cors.allowedOrigins` in the production YAML file is correctly configured with the production frontend URL.
- [ ] **Check Security Headers:** Confirm that security headers (CSP, HSTS, etc.) are being correctly applied by `helmet`.
