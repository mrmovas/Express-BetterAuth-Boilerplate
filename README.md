# Express BetterAuth Starter Template

> **Current version 1.3.3** - A a production-ready REST API server built with Express.js using Better-Auth, Kysely with PostgreSQL and Typescript.

## Overview

Express-BetterAuth-Boilerplate is a production-ready REST API server built with Express and TypeScript. It provides a complete authentication foundation (email/password, email verification, password reset) via [Better-Auth](https://better-auth.com/), backed by PostgreSQL with Kysely as the query builder. The boilerplate is designed to be cloned and extended, API routes are intentionally empty, while all cross-cutting concerns (auth, logging, rate limiting, validation, error handling) are pre-wired.

> This project is being created to provide a template for me and others to quickly set up a backend server in Express.js applications to avoid having to rewrite the same code for every project, to help focus on the unique features of the application and not have to worry about the authentication.

---

## Documentation

| Document | Description |
|---|---|
| [Architecture](./docs/architecture.md) | Project structure, request lifecycle, middleware stack, logging, validation, and response format |
| [Authentication](./docs/authentication.md) | Better-Auth configuration, password policy, rate limits, email flows, and user fields |
| [Environment](./docs/environment.md) | All environment variables, and validation |
| [Deployment](./docs/deployment.md) | Docker setup, dev and prod compose |

---

## Features
- TypeScript for type safety and better development experience.
- User registration and login with Better-Auth.
- Password reset functionality.
- Email verification for new users.
- Protected routes that require authentication or specific user roles.
- PostgreSQL database management with Kysely.
- Logging with Winston.
  - File logging, log rotation, and different log levels (info, warn, error).
  - Custom log format that includes timestamps, log levels, and messages.
  - HTTP request logging with morgan integrated into Winston.
  - Logs all incoming HTTP requests with method, URL, status code, response time, IP, agent, userID and custom UUID for each request for better traceability between logs.

---

## Quick Start

### Prerequisites
- Node.js
- PostgreSQL database (local or hosted)
- An SMTP server for email testing (e.g. [Mailpit](https://mailpit.axllent.org/))

### Setup

```bash
git clone https://github.com/mrmovas/Express-BetterAuth-Boilerplate.git
cd Express-BetterAuth-Boilerplate
```

You can create the `.env` file from the `.env.example` file.

```bash
cp .env.example .env
```

To install the dependencies, run the following command in the root directory of the project:

```bash
npm install
```

To start the development server locally, run the following command:

```bash
npm run dev
```

The database tables are created automatically on first run - no migrations to run manually.

## Running with Docker

### Development
Starts the app with hot reload, PostgreSQL, and [Mailpit](https://mailpit.axllent.org/) for email testing.

```bash
docker compose -f docker-compose.dev.yml up
```

- App: `http://localhost:4000`
- Mailpit UI: `http://localhost:8025`
- SMTP: `localhost:1025`

Code changes are reflected immediately without restarting the container.

### Production
Builds and runs the optimised production image.

```bash
docker network create app-net  # only needed once
docker compose -f docker-compose.prod.yml up --build
```

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with hot reload |
| `npm run build` | Compile TypeScript to JavaScript and resolve path aliases |
| `npm start` | Start the compiled production server |
| `npm run typecheck` | Check for type errors in the project |

---

## Contributing

[Contributing](./CONTRIBUTING.md) - contributions, suggestions, and feedback are welcome!

---

## License

[MIT](./LICENSE) — use it, fork it, ship it. Attribution appreciated but not required.
