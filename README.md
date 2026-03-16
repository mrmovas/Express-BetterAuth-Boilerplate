# express-auth-boilerplate

A production-ready authentication boilerplate built with Express, TypeScript, and PostgreSQL -
signup, email verification, login, password reset, and session management, all with security best practices and a clean architecture.

> **v0.1.0** — Ships with a hand-rolled auth implementation to demonstrate the full flow end to end. A future release will replace this with a battle-tested library (BetterAuth or similar) while keeping the rest of the stack intact.

---

## What's Included

- **Signup** with email + password + phone validation
- **Email verification** with expiring, single-use tokens
- **Login / Logout** with secure PostgreSQL-backed sessions
- **Password reset** via email link
- **Change password** (authenticated)
- **Role-based access control** (`USER`, `ADMINISTRATOR`)
- **Rate limiting** per route group
- **Suspicious input detection** (SQLi, XSS, path traversal)
- **Structured logging** with Winston — request context, caller location on errors
- **EJS SSR frontend** — zero client-side JS except password match check
- **Full API layer** — all auth endpoints available as JSON REST API

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Sessions | express-session + connect-pg-simple |
| Validation | Zod |
| Password hashing | bcrypt |
| Email | Nodemailer |
| Logging | Winston + Morgan |
| Templating | EJS + express-ejs-layouts |

---

## API Reference

All endpoints are prefixed with `/api/auth`.

### Public routes

| Method | Endpoint | Body | Description |
|---|---|---|---|
| `POST` | `/signup` | `{ email, password, firstName, lastName, phone: { countryCode, number } }` | Register a new user |
| `GET` | `/verify-email` | `?token=` | Verify email address |
| `POST` | `/login` | `{ email, password }` | Log in — sets session cookie |
| `POST` | `/resend-verification` | `{ email }` | Resend verification email |
| `POST` | `/request-password-reset` | `{ email }` | Send password reset email |
| `POST` | `/reset-password` | `{ token, password }` | Reset password using token from email |

### Protected routes (require active session)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/me` | Get current session user |
| `POST` | `/logout` | Destroy session |
| `POST` | `/change-password` | `{ oldPassword, newPassword }` |

### Response format

```json
{ "success": true,  "data": {},  "message": "..." }
{ "success": false, "error": { "code": "...", "message": "..." } }
```

---

## Architecture Notes

**Why sessions over JWT?**
Sessions stored in PostgreSQL are revocable instantly. A stolen JWT is valid until it expires with no server-side way to invalidate it. For a server-rendered or same-domain app, sessions are simpler and safer.

**Why hash tokens before storing?**
The plain token is sent to the user via email. Only the SHA-256 hash is stored in the database. If the DB is compromised, an attacker can't use the hashes — they'd need the original tokens which only ever existed in the email.

**SSR web layer vs API layer**
`/api/auth` returns JSON for external clients (mobile, React, third-party). The `core/web/` layer is the EJS SSR frontend — it calls the same services directly without an internal HTTP round trip, so rate limiting sees the real client IP and validation runs once from shared Zod schemas.

---

## Security Defaults

- Passwords hashed with bcrypt (configurable rounds, default 12)
- Session secret minimum 32 characters, validated on startup via Zod
- Tokens are 64-character cryptographically random values, SHA-256 hashed at rest
- Separate rate limiters for auth, email verification, and password reset routes
- Zod schemas use `.strict()` — unknown fields are rejected
- Suspicious input detection runs before Zod — blocks SQLi, XSS, and path traversal patterns
- Cookies: `httpOnly`, `sameSite: strict`, `secure` in production

---

## Roadmap

**v0.1.0 — current release**
Hand-rolled auth to demonstrate the full implementation. Complete auth lifecycle, EJS SSR frontend, REST API, rate limiting, validation, structured logging.

**v1.0.0 — planned**
Swap custom auth for [BetterAuth](https://www.better-auth.com/) or similar. Adds OAuth (Google, Discord), optional 2FA. Same stack, same project structure — only the auth layer changes.

---

## License

[MIT](./LICENSE) — use it, fork it, ship it. Attribution appreciated but not required.
