# NUZANTARA - Naming Conventions

**Version**: 1.0.0  
**Date**: 2025-11-17 (Phase 2 - Architecture Refactoring)  
**Status**: Standard

This document defines naming conventions for the NUZANTARA monorepo to ensure consistency and maintainability.

---

## 1. Package Names

### NPM Packages

**Standard**: Use scoped `@nuzantara/*` namespace

```json
✅ CORRECT:
"name": "@nuzantara/backend-ts"
"name": "@nuzantara/memory-service"
"name": "@nuzantara/types"

❌ INCORRECT:
"name": "nuzantara-backend-ts"  // Missing scope
"name": "backend-ts"             // Missing namespace
"name": "bali-zero-journal"      // Inconsistent
```

**Format**: `@nuzantara/<app-name>`
- Use lowercase
- Use kebab-case for multi-word names
- Be descriptive but concise

### Shared Packages

**Standard**: Always use `@nuzantara/*` scope

```json
✅ Examples:
"name": "@nuzantara/types"
"name": "@nuzantara/utils"
"name": "@nuzantara/config"
"name": "@nuzantara/common"
```

---

## 2. Directory Names

### Apps Directory

**Standard**: Use kebab-case, descriptive names

```
✅ CORRECT:
apps/backend-ts/
apps/backend-rag/
apps/memory-service/
apps/intel-scraping/

❌ INCORRECT:
apps/BackendTS/          // PascalCase
apps/backend_ts/         // snake_case
apps/memoryService/      // camelCase
```

### Shared Directories

```
✅ CORRECT:
packages/types/
packages/utils/
scripts/dataset/generators/
shared/config/

❌ INCORRECT:
Packages/types/          // Capital
packages_types/          // Underscore
packagesTypes/           // camelCase
```

---

## 3. File Names

### TypeScript/JavaScript Files

**Standard**: Use kebab-case

```
✅ CORRECT:
server.ts
user-service.ts
auth-middleware.ts
api-routes.ts

❌ INCORRECT:
Server.ts               // PascalCase
user_service.ts         // snake_case
authMiddleware.ts       // camelCase
```

**Exception**: Test files can use `.test.ts` or `.spec.ts`

### Python Files

**Standard**: Use snake_case (Python convention)

```
✅ CORRECT:
generate_dataset.py
validate_data.py
api_handler.py

❌ INCORRECT:
generateDataset.py      // camelCase
generate-dataset.py     // kebab-case
GenerateDataset.py      // PascalCase
```

### Configuration Files

**Standard**: Use standard naming for each type

```
✅ CORRECT:
package.json
tsconfig.json
.env.example
docker-compose.yml
requirements.txt

❌ INCORRECT:
Package.json            // Capital
ts-config.json          // Extra hyphen
.envExample             // Missing dot
```

---

## 4. Code Naming

### Variables & Functions (TypeScript/JavaScript)

**Standard**: Use camelCase

```typescript
✅ CORRECT:
const userName = 'John';
const apiKey = process.env.API_KEY;
function getUserById(id: string) { }
const handleRequest = async () => { };

❌ INCORRECT:
const user_name = 'John';       // snake_case
const UserName = 'John';         // PascalCase
const APIKEY = '...';            // SCREAMING_SNAKE (reserve for constants)
function GetUserById() { }       // PascalCase (reserved for classes)
```

### Constants (TypeScript/JavaScript)

**Standard**: Use SCREAMING_SNAKE_CASE for true constants

```typescript
✅ CORRECT:
const API_VERSION = 'v1';
const DEFAULT_PORT = 8080;
const MAX_RETRIES = 3;

❌ INCORRECT:
const apiVersion = 'v1';        // camelCase (config, not constant)
const DefaultPort = 8080;       // PascalCase
```

### Classes & Interfaces (TypeScript)

**Standard**: Use PascalCase

```typescript
✅ CORRECT:
class UserService { }
interface ApiResponse { }
type RequestHandler = () => void;
enum UserRole { Admin, User }

❌ INCORRECT:
class userService { }           // camelCase
interface apiResponse { }       // camelCase
type request_handler = () => void;  // snake_case
```

### Python Variables & Functions

**Standard**: Use snake_case (PEP 8)

```python
✅ CORRECT:
user_name = "John"
def get_user_by_id(user_id: str):
    pass

❌ INCORRECT:
userName = "John"               # camelCase
def GetUserById(userId):        # PascalCase
```

### Python Classes

**Standard**: Use PascalCase (PEP 8)

```python
✅ CORRECT:
class UserService:
    pass

class DataValidator:
    pass

❌ INCORRECT:
class user_service:             # snake_case
class dataValidator:            # camelCase
```

---

## 5. API Endpoints

**Standard**: Use kebab-case, lowercase

```
✅ CORRECT:
/api/v1/users
/api/v1/auth/login
/api/v1/user-profiles
/api/v1/chat-history

❌ INCORRECT:
/api/v1/Users               // Capital
/api/v1/auth_login          // Underscore
/api/v1/userProfiles        // camelCase
/api/V1/chat-history        // Capital version
```

---

## 6. Environment Variables

**Standard**: Use SCREAMING_SNAKE_CASE

```bash
✅ CORRECT:
NODE_ENV=production
API_KEY=abc123
DATABASE_URL=postgresql://...
MAX_CONNECTIONS=100

❌ INCORRECT:
nodeEnv=production          # camelCase
api-key=abc123              # kebab-case
databaseUrl=...             # camelCase
```

---

## 7. Git Branch Names

**Standard**: Use type/description format with kebab-case

```
✅ CORRECT:
feat/add-user-authentication
fix/memory-leak-in-cache
refactor/consolidate-server-files
docs/update-api-documentation
chore/upgrade-dependencies

❌ INCORRECT:
AddUserAuthentication       # No type prefix, PascalCase
fix_memory_leak             # Underscore
refactor/consolidateServerFiles  # camelCase
update-docs                 # Missing type prefix
```

**Prefixes**:
- `feat/` - New feature
- `fix/` - Bug fix
- `refactor/` - Code refactoring
- `docs/` - Documentation
- `chore/` - Maintenance
- `test/` - Testing

---

## 8. Commit Messages

**Standard**: Use Conventional Commits

```
✅ CORRECT:
feat(auth): add JWT token validation
fix(api): resolve memory leak in cache middleware
refactor(backend): consolidate server variants
docs(readme): update installation instructions
chore(deps): upgrade TypeScript to 5.9

❌ INCORRECT:
Added JWT validation          # No type/scope
fix memory leak               # No scope
Refactoring backend code      # Capitalized, verbose
updated readme                # Lowercase type
```

**Format**: `type(scope): description`
- Type: feat, fix, refactor, docs, chore, test, perf, ci
- Scope: component affected (auth, api, backend, deps, etc.)
- Description: imperative, lowercase, no period

---

## 9. Database Names

### Table Names

**Standard**: Use snake_case, plural

```sql
✅ CORRECT:
users
user_profiles
chat_messages
api_keys

❌ INCORRECT:
Users                   -- Capital
UserProfiles            -- PascalCase
chat-messages           -- Kebab-case
api_key                 -- Singular
```

### Column Names

**Standard**: Use snake_case

```sql
✅ CORRECT:
user_id
created_at
first_name
is_active

❌ INCORRECT:
userId                  -- camelCase
CreatedAt               -- PascalCase
firstName               -- camelCase
```

---

## 10. Current State & Migration Plan

### Current Inconsistencies

```
❌ Need to fix:
"name": "nuzantara-ts-backend"       → "@nuzantara/backend-ts"
"name": "nuzantara-memory-service"   → "@nuzantara/memory-service"
"name": "nuzantara-webapp"           → "@nuzantara/webapp"
"name": "bali-zero-journal"          → "@nuzantara/intel-scraping"
```

### Migration Strategy

**Phase 3 (Code Quality)**: Update all package names to scoped format

1. Update package.json files
2. Update import statements
3. Update references in documentation
4. Publish scoped packages (if publishing to npm)

---

## 11. Examples by Category

### Good Package Structure

```
@nuzantara/backend-ts/
├── src/
│   ├── handlers/
│   │   ├── auth-handler.ts
│   │   ├── user-handler.ts
│   │   └── api-handler.ts
│   ├── middleware/
│   │   ├── auth-middleware.ts
│   │   └── error-middleware.ts
│   ├── services/
│   │   ├── user-service.ts
│   │   └── email-service.ts
│   ├── types/
│   │   ├── user-types.ts
│   │   └── api-types.ts
│   └── utils/
│       ├── validation-utils.ts
│       └── format-utils.ts
├── tests/
│   ├── auth-handler.test.ts
│   └── user-service.test.ts
├── package.json
└── tsconfig.json
```

### Good Python Package Structure

```
backend-rag/
├── app/
│   ├── routers/
│   │   ├── auth_router.py
│   │   ├── user_router.py
│   │   └── api_router.py
│   ├── services/
│   │   ├── user_service.py
│   │   └── email_service.py
│   ├── models/
│   │   ├── user_model.py
│   │   └── api_model.py
│   └── utils/
│       ├── validation_utils.py
│       └── format_utils.py
├── tests/
│   ├── test_auth_router.py
│   └── test_user_service.py
└── requirements.txt
```

---

## 12. Summary Cheat Sheet

| Item | Convention | Example |
|------|------------|---------|
| **NPM Packages** | @nuzantara/kebab-case | @nuzantara/backend-ts |
| **Directories** | kebab-case | apps/memory-service |
| **TS/JS Files** | kebab-case.ts | user-service.ts |
| **Python Files** | snake_case.py | user_service.py |
| **TS Variables** | camelCase | userName |
| **TS Constants** | SCREAMING_SNAKE | API_VERSION |
| **TS Classes** | PascalCase | UserService |
| **Python Variables** | snake_case | user_name |
| **Python Classes** | PascalCase | UserService |
| **API Routes** | /kebab-case | /api/v1/user-profiles |
| **Env Variables** | SCREAMING_SNAKE | DATABASE_URL |
| **Git Branches** | type/kebab-case | feat/add-auth |
| **Commits** | type(scope): msg | feat(auth): add JWT |
| **DB Tables** | snake_case | user_profiles |

---

## Enforcement

### Automated Tools

- **ESLint**: Enforce naming in TypeScript/JavaScript
- **Prettier**: Format code consistently
- **pylint**: Enforce PEP 8 in Python
- **lint-staged**: Pre-commit hooks
- **Code review**: Manual enforcement

### Exceptions

Document any exceptions to these conventions in this file with justification.

---

**Maintained by**: NUZANTARA Development Team  
**Last Updated**: 2025-11-17
