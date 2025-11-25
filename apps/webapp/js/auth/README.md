# Unified Authentication System

This directory contains the consolidated authentication logic for the ZANTARA WebApp.

## Core Components

### 1. `unified-auth.js` (The Core)
This is the **Single Source of Truth** for authentication.
- **Manages State:** Holds the current user, token, and session data.
- **Handles API:** Communicates with `/api/auth/team/login` (Team Auth) for robust session management (HttpOnly cookies + localStorage fallback).
- **Storage:** Standardizes how tokens are saved to `localStorage` (keys: `zantara-token`, `zantara-user`).

**Usage:**
```javascript
import { unifiedAuth } from './auth/unified-auth.js';

// Login
await unifiedAuth.loginTeam(email, pin);

// Check status
if (unifiedAuth.isAuthenticated()) { ... }

// Get Token
const token = unifiedAuth.getToken();
```

### 2. `../login.js` (The UI)
The login page script now **delegates** all logic to `unifiedAuth`. It only handles UI interactions (inputs, buttons, error messages).

### 3. `../auth-guard.js` (The Gatekeeper)
A lightweight, dependency-free script that runs immediately on protected pages.
- Checks `localStorage` for `zantara-token`.
- Validates expiration.
- Redirects to `/login` if invalid.
- **Note:** It relies on the `localStorage` cache set by `unifiedAuth`.

## Architecture Improvements (Fixing "Fragility")
- **Consistency:** Login and Auth Checks now share the exact same logic and storage keys.
- ** robustness:** `unified-auth.js` handles API response variations and errors centrally.
- **Safety:** `auth-guard.js` now safely handles malformed JSON in localStorage without crashing.
