# Express-BetterAuth-Boilerplate

> Current version 1.1.1-beta - A boilerplate for handling authentication in Express.js using Better-Auth, Prisma with PostgreSQL and Typescript. Alpine.js

This project is being created to learn and provide a template for me and others to quickly set up authentication in Express.js applications to avoid having to rewrite the same code for every project, to help focus on the unique features of the application and not have to worry about the authentication.

This boilerplate is using [Better-Auth](https://better-auth.com/) for handling authentication, Prisma for database management and PostgreSQL as the database. It also uses TypeScript for type safety and a better development experience.
Better-Auth is set up and ready. All routes and middleware for authentication are ready to use.

Alpine.js is used for the frontend, but for anyone who wants to use a different frontend framework or library, it can be easily replaced or removed as needed.
I am personally planning to learn React and Next.js, and I will perhaps replace Alpine.js with React in the future, but for now, I will keep it simple with Alpine.js as it is something I am already familiar so I can focus on the backend and authentication part of the project which is the main goal of this boilerplate.

> At the moment, this project is still in development and is not yet ready for production use.
> However, at the current state, it is ready to be used as a starting point if you know how to set up your pages and routes, and how to use the authentication middleware provided in this boilerplate.

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
