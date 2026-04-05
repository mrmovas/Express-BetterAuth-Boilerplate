# Express-BetterAuth-Boilerplate

> **Current version 1.3.1** - A backend boilerplate for handling authentication in Express.js using Better-Auth, Kysely with PostgreSQL and Typescript.

This project is being created to learn and provide a template for me and others to quickly set up authentication in Express.js applications to avoid having to rewrite the same code for every project, to help focus on the unique features of the application and not have to worry about the authentication.

This boilerplate is using [Better-Auth](https://better-auth.com/) for handling authentication, Kysely for database management and PostgreSQL as the database. It also uses TypeScript for type safety and a better development experience.
Better-Auth is set up and ready. All routes and middleware for authentication are ready to use.

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

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express.js |
| Database | PostgreSQL |
| Query Builder | Kysely |
| Authentication | Better-Auth |
| Logging | Winston |

---

## Installation

You can create the `.env` file from the `example.env` file.

To install the dependencies, run the following command in the root directory of the project:

```bash
npm install
```

## Database Setup

You will need to host a PostgreSQL database or use a service to host it for you, and then set the `DATABASE_URL` environment variable in the `.env` file to point to your database.

`src/bootstrap/database-setup.ts` is set up to check for the necessary tables and create them if they don't exist, so you can simply run the development server and it will handle the database setup for you.

## Type Checking
To check for type errors in the project, you can run the following command:

```bash
npm run typecheck
```

## Development Launch
To start the development server, run the following command:

```bash
npm run dev
```

---

## Roadmap
The next updates for this boilerplate will include:

### Logging
Logging is still something I haven't fully figured out yet.
I don't want to just dump logs into a file. I'm trying to understand how to handle this properly in a more professional way.

### API Features / Example Implementations
I want to create implementations to demonstrate API routes with features like users could create text posts, and an admin role could delete users, remove posts, or manage other features that I'll define later.

### Documentation
It's important to properly document how everything works. That way, both I and anyone else can understand the structure of the project, how it's built, and how to use it as a starting point for building our own ideas on top of it.

---

## Contributing

Contributions are welcome! If you have any suggestions, improvements or bug reports, please feel free to open an issue or submit a pull request.

To create a pull request, follow these steps:
- Fork the repository and create a new branch (e.g., `feature/new-feature` or `fix/fix-reset-password`).
- Make your changes and commit them with clear and descriptive messages.
- Push your changes and open a pull request against the `main` branch of this repository.

Please keep changes focused, large pull requests may be harder to review and merge. 

---

## License

[MIT](./LICENSE) — use it, fork it, ship it. Attribution appreciated but not required.
