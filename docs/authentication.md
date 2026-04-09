# Authentication

This project uses [Better-Auth](https://better-auth.com) for authentication, configured in [src/utils/auth.ts](../src/utils/auth.ts).

The authentication logic was built for an email and password flow, but Better-Auth supports many other providers and strategies out of the box (OAuth, magic links, Passkey, etc) which can be enabled with configuration changes.

If you need for example to add OAuth with Google, you should probably disable most of the configurations for the email/password, remove email verification, password reset flows and rate limits related to those flows, and then enable the Google provider with the appropriate client ID/secret. The routes are automatically handled by Better-Auth and mounted at `/api/auth`. You should read the BetterAuth's documentation for more details on how to configure and customize the authentication flows, providers, and features. After all it should probably be much easier to set an OAuth provider intead of Email/password.

---

## Auth Features

| Feature | Detail |
|---|---|
| Email + Password | Enabled. Requires email verification before sign-in. |
| Auto Sign-In | Disabled - users must sign in manually after registration. |
| IP Detection | Reads `x-forwarded-for` then `x-real-ip` headers for reverse-proxy deployments. |

---

## Rate Limiting

Rate limiting is enabled and backed by the database (`storage: "database"`).

**Default rule:** 20 requests per 60-second window across all auth endpoints.

**Custom rules per endpoint:**

| Endpoint | Window | Max Requests | Reason |
|---|---|---|---|
| `POST /api/auth/sign-in/email` | 15 minutes | 10 | Brute force protection |
| `POST /api/auth/sign-up/email` | 1 hour | 5 | Spam/abuse prevention |
| `POST /api/auth/request-password-reset` | 1 hour | 5 | Email enumeration prevention |
| `POST /api/auth/send-verification-email` | 1 hour | 3 | Inbox flooding prevention |

---

## Additional User Fields

Beyond the default Better-Auth schema, these fields are collected at registration:

| Field | Type | Required | Included in Registration | Default |
|---|---|---|---|---|
| `firstName` | `string` | Yes | Yes | — |
| `lastName` | `string` | Yes | Yes | — |
| `country` | `string` | Yes | Yes | — |
| `phoneNumber` | `string` | Yes | Yes | — |
| `role` | `"user" \| "admin"` | Yes | No | `"user"` |

> `role` is server-assigned only — it is not accepted as user input during registration.

---

## Email Flows

### Verification Email
Triggered automatically on sign-up (`sendOnSignUp: true`). Handled by `sendVerificationEmail()` in [src/utils/email.util.ts](../src/utils/email.util.ts).

Token expiry is controlled by the `VERIFICATION_TOKEN_EXPIRE_IN` environment variable (default: 3600 seconds / 1 hour).

### Password Reset Email
Triggered when a user requests a password reset. Handled by `sendPasswordResetEmail()` in [src/utils/email.util.ts](../src/utils/email.util.ts).

Token expiry is controlled by the `PASSWORD_RESET_TOKEN_EXPIRE_IN` environment variable (default: 3600 seconds / 1 hour).

On a successful password reset, **all existing sessions are revoked** (`revokeSessionsOnPasswordReset: true`).

---

## Logging

Better-Auth logs are forwarded to the application logger ([src/utils/logger.util.ts](../src/utils/logger.util.ts)) and prefixed with `[BetterAuth]`.

Log level is controlled by the `BETTER_AUTH_LOG_LEVEL` environment variable (defaults to `"warn"`).
