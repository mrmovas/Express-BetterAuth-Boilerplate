# express-auth-boilerplate

> version 1.0.0 - A boilerplate for handling authentication in Express.js using Better-Auth, Prisma with PostgreSQL and Typescript.

> v1.1.0 Roadmap: I plan to integrate a frontend framework, likely Astro, to build a dedicated landing page. This will provide a user interface to showcase the authentication flow in action.

This project is being created to learn and provide a template for me and others to quickly set up authentication in Express.js applications to avoid having to rewrite the same code for every project, to help focus on the unique features of the application and not have to worry about the authentication.

At the moment, this project is still in development and is not yet ready for production use.
However, at the current state, it is ready to be used as a starting point if you know how to set up your pages and routes, and how to use the authentication middleware provided in this boilerplate.

This boilerplate is using Better-Auth for handling authentication, Prisma for database management and PostgreSQL as the database. It also uses TypeScript for type safety and a better development experience.
Better-Auth is set up and ready. All routes and middleware for authentication are ready to use; the only thing missing is the pages and routes for handling user authentication, which will be added in the next updates.

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

---

## Installation

You can create the `.env` file based on the values the `src/config/env.config.ts` file expects.

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

## License

[MIT](./LICENSE) — use it, fork it, ship it. Attribution appreciated but not required.
