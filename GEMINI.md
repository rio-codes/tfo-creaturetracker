# Project Overview

This is a Next.js project called "TFO Creature Tracker", designed for the game "The Final Outpost". It allows users to track their creature collections, predict breeding outcomes, and manage research goals. The application is deployed on Vercel and can be accessed at [tfo.creaturetracker.net](https://tfo.creaturetracker.net).

## Main Technologies

*   **Framework:** Next.js
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS
*   **Database:** Drizzle ORM with Neon
*   **Authentication:** NextAuth.js
*   **Deployment:** Vercel

# Building and Running

## Development

To run the project in development mode, use the following command:

```bash
pnpm dev
```

## Production

To build the project for production, use:

```bash
pnpm build
```

To start the production server, use:

```bash
pnpm start
```

## Database

The project uses Drizzle ORM for database management. The following commands are available:

*   `pnpm db:generate`: Generate Drizzle ORM migration files.
*   `pnpm db:push`: Push database changes.

# Development Conventions

*   **Linting:** The project uses ESLint for code linting. To run the linter, use `pnpm lint`.
*   **Formatting:** The project uses Prettier for code formatting.
*   **Commits:** The project follows the conventional commits specification.
*   **Contributing:** Contribution guidelines are available on the project's [wiki](https://github.com/rio-codes/tfo-creaturetracker/wiki).
