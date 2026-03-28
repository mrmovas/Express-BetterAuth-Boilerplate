# Express-BetterAuth-Boilerplate

> **Current version 1.1.1-beta** - A backend boilerplate for handling authentication in Express.js using Better-Auth, Prisma with PostgreSQL and Typescript.

> ℹ️ **Info:**
> At the moment, this project is still in development and is not yet ready for production use.
> However, at the current state, it is ready to be used as a starting point if you know how to set up your pages and routes, and how to use the authentication middleware provided in this boilerplate.

> ⚠️ **Note:**
> This project, with simple words, is the backend; anything related to the frontend will be removed from the repo because I am working on a new repo [Nuxt-BetterAuth-Boilerplate](https://github.com/mrmovas/Nuxt-BetterAuth-Boilerplate), which will be a frontend template using this backend template.  

This project is being created to learn and provide a template for me and others to quickly set up authentication in Express.js applications to avoid having to rewrite the same code for every project, to help focus on the unique features of the application and not have to worry about the authentication.

This boilerplate is using [Better-Auth](https://better-auth.com/) for handling authentication, Prisma for database management and PostgreSQL as the database. It also uses TypeScript for type safety and a better development experience.
Better-Auth is set up and ready. All routes and middleware for authentication are ready to use.

---

## Roadmap
The next updates for this boilerplate will include:

### Frontend
Alpine.js is currently used for the frontend, but anyone who prefers a different framework or library can easily replace or remove it as needed.
I'd like to note that in the future update, the HTML files will be removed and be replaced with a new logic supporting integration with another frontend framework, supporting both development and production environments.

### Docker & Production Setup
Plan to add Docker to containerize the applications and make them production-ready.

### Logging
Logging is still something I haven't fully figured out yet.
I don't want to just dump logs into a file. I'm trying to understand how to handle this properly in a more professional way.

### API Features / Example Implementations
I want to create implementations to demonstrate API routes with features like users could create text posts, and an admin role could delete users, remove posts, or manage other features that I'll define later.

### Cookies & Analytics
I also plan to add a cookie consent pop-up, including support for statistics cookies (such as Google Analytics), allowing users to enable or disable them.

### Documentation
It's important to properly document how everything works. That way, both I and anyone else can understand the structure of the project, how it's built, and how to use it as a starting point for building our own ideas on top of it.

---

## Features
- TypeScript for type safety and better development experience.
- User registration and login with Better-Auth.
- Password reset functionality.
- Email verification for new users.
- Protected routes that require authentication or specific user roles.
- PostgreSQL database management with Prisma.
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
| ORM | Prisma |
| Authentication | Better-Auth |
| Frontend | Alpine.js |
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

```bash
npm run db:migrate # This maps your schema.prisma to the actual database tables.

npm run db:generate # This generates the Prisma client based on your schema.prisma file.
```

## Tailwind CSS Setup

To build the Tailwind CSS styles, run the following command:

```bash
npm run tailwind:build
```

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

## Contributing

Contributions are welcome! If you have any suggestions, improvements or bug reports, please feel free to open an issue or submit a pull request.

To create a pull request, follow these steps:
- Fork the repository and create a new branch (e.g., `feature/new-feature` or `fix/fix-reset-password`).
- Make your changes and commit them with clear and descriptive messages.
- Push your changes and open a pull request against the `main` branch of this repository.

Please keep changes focused, large pulled requests may be harder to review and merge. 

---

## License

[MIT](./LICENSE) — use it, fork it, ship it. Attribution appreciated but not required.
