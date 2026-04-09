# Architecture

## Overview

Express-BetterAuth-Boilerplate is a production-ready REST API server built with Express 5 and TypeScript. It provides a complete authentication foundation (email/password, email verification, password reset) via Better-Auth, backed by PostgreSQL with Kysely as the query builder. The boilerplate is designed to be cloned and extended, API routes are intentionally empty, while all cross-cutting concerns (auth, logging, rate limiting, validation, error handling) are pre-wired.

---

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Runtime | Node.js 24 | |
| Framework | Express 5 |  |
| Language | TypeScript 5 |  |
| Auth | BetterAuth 1.6 | Handles sessions, tokens, and auth routes |
| Database | PostgreSQL 17 |  |
| Query Builder | Kysely | Fully type-safe SQL, shared pool with Better-Auth |
| Validation | Zod 4 | Used for env variables and request body validation |
| Logging | Winston + DailyRotateFile | JSON structured logs; separate security log stream |
| HTTP Logging | Morgan | Routed through Winston |
| Email | Nodemailer | SMTP with connection pooling |
| Rate Limiting | express-rate-limit | General + per-route rules outside Better-Auth routes |
| Containerization | Docker | Dev / Builder / Production stages |

---

## Project Structure

```bash
src/
├── index.ts                    # Entry point: creates HTTP server, starts app
├── app.ts                      # Express app setup and middleware registration
│
├── api/                        # API route handlers (empty - add routes here)
│
├── bootstrap/
│   └── database-setup.ts       # Runs Better-Auth migrations to setup tables + custom tables for the app
│
├── config/
│   ├── env.config.ts           # Zod-validated environment variables
│   ├── database.config.ts      # Kysely client + pg pool + testConnection/closeDatabase
│   ├── email.config.ts         # Nodemailer transporter singleton
│   └── config.ts               # (reserved for additional config)
│
├── middleware/
│   ├── auth.middleware.ts       # requireAuth / requireRole guards for protected routes
│   ├── session.middleware.ts    # Populates res.locals.user and res.locals.session per request
│   ├── ratelimit.middleware.ts  # Rate limiting rules for different porposes
│   ├── requestLogger.middleware.ts  # UUID request ID + Morgan HTTP logger
│   ├── validation.middleware.ts # Zod schema validation + suspicious input detection
│   ├── error.middleware.ts      # Global error handler (last middleware in chain)
│   └── notFound.middleware.ts   # 404 handler
│
├── types/
│   └── database.types.ts       # Kysely Database interface (maps table names to row types)
│
└── utils/
    ├── auth.ts                  # Better-Auth instance configuration
    ├── email.util.ts            # sendEmail, sendVerificationEmail, sendPasswordResetEmail
    ├── logger.util.ts           # Winston logger, reqCtx helper, morganStream
    ├── requestContext.util.ts   # AsyncLocalStorage for request-scoped context
    └── response.util.ts         # Typed API response helpers (sendSuccess, sendError, etc.)
```

---

## Request Lifecycle

Every inbound HTTP request passes through the following middleware stack in order:

```
Client Request
      │
      ▼
  Helmet (security headers)
      │
      ▼
  CORS
      │
      ▼
  Body parsers (JSON + urlencoded, 1 MB limit)
      │
      ▼
  Compression
      │
      ▼
  Better-Auth handler  ← handles /api/auth/* and returns early
      │
      ▼
  Session middleware   ← attaches user/session to res.locals
      │
      ▼
  Request ID middleware ← generates UUID, stores in AsyncLocalStorage
      │
      ▼
  Morgan HTTP logger
      │
      ▼
  General rate limiter
      │
      ▼
  API routes
      │
      ▼
  404 handler
      │
      ▼
  Global error handler
      │
      ▼
Client Response
```

---

## Authentication

Authentication is delegated entirely to [BetterAuth](https://better-auth.com/). The auth instance is configured in [src/utils/auth.ts](../src/utils/auth.ts) and mounted at `/api/auth` via `toNodeHandler(auth)`.

[BetterAuth Configuration Documentation](./authentication.md)

### Session Injection

`sessionMiddleware` runs on every request after the auth handler. It calls `auth.api.getSession()` and attaches the result to `res.locals`:

- `res.locals.user` - the authenticated user object, or `null`
- `res.locals.session` - the session object, or `null`

### Route Guards

Two middleware helpers are exported from [src/middleware/auth.middleware.ts](../src/middleware/auth.middleware.ts):

- `requireAuth` - rejects with 401 if no session is present
- `requireRole(role | role[])` - rejects with 401 (no session) or 403 (wrong role)

Usage in routes:

```ts
router.get('/admin/data', requireAuth, requireRole('admin'), handler);
```

---

## Database

The PostgreSQL connection is managed through a shared `pg.Pool` instance ([src/config/database.config.ts](../src/config/database.config.ts)):

- **Kysely** uses this pool for type-safe query building across the app.
- **Better-Auth** uses the same pool internally for its own tables.

### Slow Query Logging

Queries exceeding 500 ms are logged at `warn` level with the SQL text, duration, and request context (requestId, userId, ip).

### Schema Management

On startup, `setupDatabase()` ([src/bootstrap/database-setup.ts](../src/bootstrap/database-setup.ts)):

1. Runs Better-Auth's programmatic migrations (`getMigrations`) to create/update its tables (user, session, verification, account, rate limit).
2. Runs custom table checks via Kysely for application-specific tables.

> ⚠️⚠️⚠️ <br/>
> For schema changes to application tables, write migration scripts manually and update the `Database` interface in [src/types/database.types.ts](../src/types/database.types.ts) to keep Kysely's type safety current.  <br/>
> Always remember to back up your database before running new migrations in production!

---

## Logging

Logging uses Winston with three transports ([src/utils/logger.util.ts](../src/utils/logger.util.ts)):

| Transport | Path | Level | Retention |
|---|---|---|---|
| Console | stdout | Configurable (`LOG_LEVEL`) | — |
| Daily rotate file | `logs/YYYY-MM-DD.log` | `http` and above | 30 days, 20 MB/file |
| Security log | `logs/security/YYYY-MM-DD-security.log` | `warn` and above | 90 days, 10 MB/file |

All logs are structured JSON. Log entries include a `service: 'auth-API'` default field.

**Request context** is propagated via `AsyncLocalStorage` (Node's built-in). The `requestIdMiddleware` stores `{ requestId, ip, userId }` in the store; any logger call within that request's async chain can retrieve it via `getCtx()` without threading it through function arguments.

Morgan's HTTP log stream is routed through Winston (`morganStream`) so all output goes to the same transports. Token values in URLs are automatically redacted.

> **Note:** Winston's logging transports are not limited to files - you can easily add integrations for external log management services (e.g. Logstash, Datadog, Splunk) by installing the appropriate Winston transport and configuring it in `logger.util.ts`.

---

## Validation

`validateMiddleware` ([src/middleware/validation.middleware.ts](../src/middleware/validation.middleware.ts)) is a factory that wraps any Zod schema against `body`, `query`, or `params`:

```ts
type Book = z.object({
    id: z.string().uuid(),
    book: z.string().min(1).max(255),
    author: z.string().min(1).max(255)
});

router.post('/book', validateMiddleware(Book, 'body'), handler);
```

Before Zod parses the input, the middleware scans all string values recursively for three threat patterns:

- **SQL injection** - common SQL keywords combined with control characters
- **XSS** - script tags, event handlers, `javascript:` URLs
- **Path traversal** - `../` sequences and URL-encoded variants

Suspicious inputs are logged at `warn` level (the request is not blocked, but the threat type and field names are recorded).
Next the Zod validation runs, and if it fails, a formatted validation error response is sent with details about which fields were invalid.

---

## API Response Format

All route handlers should use the helpers from [src/utils/response.util.ts](../src/utils/response.util.ts) to maintain a consistent response envelope:

```ts
// Success
sendSuccess(res, data, 'Optional message', 200);

// Error
sendError(res, 'Something went wrong', 500, 'ERROR_CODE');
```

**Success shape:**
```json
{
    "success": true,
    "message": "...",
    "data": { ... },
    "meta": { 
        "timestamp": "...", 
        "requestId": "..." 
    }
}
```

**Error shape:**
```json
{
    "success": false,
    "error": { "code": "...", "message": "..." },
    "meta": { 
        "timestamp": "...", 
        "requestId": "..." 
    }
}
```

**Main response helpers:**
- `sendSuccess`
- `sendError`

**Error-specific helpers:**
They use `sendSuccess` or `sendError` under the hood with appropriate status codes and error codes, so you can choose the response helper that best matches the situation in your route handlers:
- `sendValidationError`
- `sendUnauthorized`
- `sendForbidden`
- `sendNotFound`
- `sendConflict`
- `sendTooManyRequests`.

---

## Docker

The Dockerfile uses three stages:

| Stage | Base | Purpose |
|---|---|---|
| `development` | `node:24-alpine` | Mounts `src/` as a volume, runs `tsx watch` |
| `builder` | `node:24-alpine` | Compiles TypeScript to `dist/` |
| `production` | `node:24-alpine` | Copies `dist/`, installs prod deps only, runs as non-root user with `dumb-init` |

**Development compose** (`docker-compose.dev.yml`) starts:
- `app` — the Express server (volume-mounted for hot reload)
- `postgres:17` — with a health check
- `mailpit` — local SMTP + web UI for email testing (SMTP on `1025`, UI on `8025`)

The pg connection string in dev compose is constructed from `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` env vars, pointing to the compose-internal `postgres` host.

More about the Docker setup in [deployment.md](./deployment.md).