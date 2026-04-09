# Deployment

Two Docker Compose configurations are provided:

| File | Purpose |
|---|---|
| [docker-compose.dev.yml](../docker-compose.dev.yml) | Local development with hot-reload and Mailpit |
| [docker-compose.prod.yml](../docker-compose.prod.yml) | Production-ready build with restart policies |

---

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- A `.env` file at the project root (see [environment.md](./environment.md))

---

## Dockerfile Stages

The [Dockerfile](../Dockerfile) uses multi-stage builds with three named targets:

| Stage | Target | Base | Description |
|---|---|---|---|
| 0 | `development` | `node:24-alpine` | Installs all dependencies, mounts `src/` as a volume, runs `npm run dev` |
| 1 | `builder` | `node:24-alpine` | Compiles TypeScript to `dist/` via `npm run build` |
| 2 | `production` | `node:24-alpine` | Copies compiled output from `builder`, installs prod-only deps, runs as a non-root user with `dumb-init` |

The production image:
- Installs [`dumb-init`](https://github.com/Yelp/dumb-init) to forward `SIGTERM`/`SIGINT` correctly to Node
- Creates a non-root `appuser:appgroup` and runs as that user
- Exposes port `4000` and starts with `node dist/index.js`

---

## Development

The dev stack includes the app, a PostgreSQL 17 database, and [Mailpit](https://mailpit.axllent.org/) for local email testing.

**Start the stack:**

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Service | URL | Notes |
|---|---|---|
| App | `http://localhost:${PORT:-4000}` | Hot-reloads on `src/` changes |
| Mailpit SMTP | `localhost:1025` | Use as `EMAIL_HOST` in `.env` |
| Mailpit Web UI | `http://localhost:8025` | Inspect outbound emails |

**Dev `.env` email settings for Mailpit:**

```env
EMAIL_HOST=mailpit
EMAIL_PORT=1025
EMAIL_USER=test@example.com
EMAIL_PASS=unused
EMAIL_FROM=noreply@example.com
EMAIL_SECURE=false
```

The `src/` directory is mounted as a volume so code changes are reflected immediately without rebuilding the image. Logs are persisted to `./logs`.

---

## Production

The prod stack builds the compiled image and runs app + a PostgreSQL 17 database with `restart: unless-stopped`. There is no Mailpit, configure a real SMTP provider in `.env`.

**Start the stack:**

```bash
docker compose -f docker-compose.prod.yml up -d --build
```