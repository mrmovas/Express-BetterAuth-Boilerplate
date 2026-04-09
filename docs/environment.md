# Environment Variables

All environment variables are parsed and validated at startup via Zod in [src/config/env.config.ts](../src/config/env.config.ts). If any required variable is missing or fails validation, the process exits immediately with a formatted error.

A reference file with all variables is available at [.env.example](../.env.example). Copy it to `.env` and fill in your values:

```bash
cp .env.example .env
```

---

## Server

| Variable | Required | Default | Valid Values | Description |
|---|---|---|---|---|
| `NODE_ENV` | No | `development` | `development`, `production` | Runtime environment |
| `PORT` | No | `4000` | Any valid port | Port the HTTP server listens on |
| `LOG_LEVEL` | No | `info` | `error`, `warn`, `info`, `http`, `debug` | Winston log level for console output |
---

## Database

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | **Yes** | — | PostgreSQL connection string (e.g. `postgresql://user:password@ipaddress:port/dbname`) |

### Docker (PostgreSQL container)

These variables configure the PostgreSQL container when running via Docker Compose. They are **not** read by the application, the app connects only via `DATABASE_URL`.

| Variable | Example | Description |
|---|---|---|
| `POSTGRES_USER` | `root` | PostgreSQL superuser created on container init |
| `POSTGRES_PASSWORD` | `pass` | Password for the above user |
| `POSTGRES_DB` | `dbname` | Default database created on container init |

> When using Docker, `DATABASE_URL` is set by Docker Compose to match these values, so you don't need to set it manually.

---

## Session (Better-Auth)

| Variable | Required | Default | Description |
|---|---|---|---|
| `BETTER_AUTH_SECRET` | **Yes** | — | Secret used for signing sessions. Must be at least 32 characters. Generate with `openssl rand -base64 32`. |
| `BETTER_AUTH_URL` | **Yes** | — | Public base URL of this server (e.g. `http://localhost:4000`). Used by Better-Auth internally. |
| `BETTER_AUTH_LOG_LEVEL` | No | `warn` | `error`, `warn`, `info`, `debug` | Better-Auth internal log level. Forwarded to the app logger with a `[BetterAuth]` prefix. |

---

## Email (SMTP)

All email variables are required for the email verification and password reset flows to work.

| Variable | Required | Description |
|---|---|---|
| `EMAIL_HOST` | **Yes** | SMTP server hostname |
| `EMAIL_PORT` | **Yes** | SMTP server port (1–65535). Typically `465` (TLS) or `587` (STARTTLS). |
| `EMAIL_USER` | **Yes** | SMTP authentication username (must be a valid email address) |
| `EMAIL_PASS` | **Yes** | SMTP authentication password |
| `EMAIL_FROM` | **Yes** | From address used in outbound emails (must be a valid email address) |
| `EMAIL_SECURE` | No | Defaults to `false`. Set to `true` for port 465 (implicit TLS). Use `false` for STARTTLS (ports 587/25). |

---

## Application

| Variable | Required | Default | Description |
|---|---|---|---|
| `APP_URL` | No | `http://localhost:4000` | Public URL of this server. Used for trusted origins |
| `FRONTEND_URL` | No | `http://localhost:3000` | Public URL of the frontend. Added to CORS allowed origins and Better-Auth trusted origins. |

---

## Tokens

| Variable | Required | Default | Description |
|---|---|---|---|
| `VERIFICATION_TOKEN_EXPIRE_IN` | No | `3600` | Email verification token TTL in seconds, passed to BetterAuth's `emailVerification.expiresIn`. |
| `PASSWORD_RESET_TOKEN_EXPIRE_IN` | No | `3600` | Password reset token TTL in seconds, passed to BetterAuth's `resetPasswordTokenExpiresIn`. |
