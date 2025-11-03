# Configuration Migration Guide

This guide outlines the steps to migrate from the old environment variable system to the new centralized configuration system.

## 1. Identify All Environment Variables

Create a comprehensive list of all environment variables currently used in the application. Look for `.env` files and any instances of `process.env` in the codebase.

## 2. Consolidate into YAML Files

Move the identified variables into the appropriate environment-specific YAML files (`development.yaml`, `staging.yaml`, `production.yaml`).

**Example:**

If you have `DB_HOST=localhost` in a `.env` file, it should be moved to `development.yaml` as:

```yaml
database:
  host: localhost
```

## 3. Update Code to Use the Centralized Config

Replace all instances of `process.env.VARIABLE_NAME` with `config.get('variableName')`.

**Example:**

**Old code:**
```typescript
const dbHost = process.env.DB_HOST;
```

**New code:**
```typescript
import { config } from './config/centralized-config';

const dbHost = config.get('database').host;
```

## 4. Handle Secrets

For sensitive information like database passwords and JWT secrets, use environment variable substitution in the `staging.yaml` and `production.yaml` files.

**Example:**

`production.yaml`:
```yaml
database:
  password: ${DB_PASSWORD}
```

These variables will be loaded from the environment at runtime.

## 5. Remove Old `.env` Files

Once the migration is complete and verified, remove all old `.env` files to avoid confusion.
