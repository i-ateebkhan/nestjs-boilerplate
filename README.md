# NestJS Fastify Boilerplate

A high-performance boilerplate application built with [NestJS](https://nestjs.com/) and [Fastify](https://www.fastify.io/), running on Node.js.

## Features

- **Runtime**: [Node.js](https://nodejs.org/) (v22 or later).
- **Framework**: [NestJS](https://nestjs.com/) (v11) - A progressive Node.js framework for building efficient, scalable Node.js server-side applications, built and run via the [Nest CLI](https://docs.nestjs.com/cli/overview).
- **HTTP Adapter**: [Fastify](https://www.fastify.io/) - High performance and low overhead web framework.
- **Database**: [PostgreSQL](https://www.postgresql.org/) with [Prisma ORM](https://www.prisma.io/) (v7), using the `prisma-client` generator (`runtime = "nodejs"`, `engineType = "client"` — no Rust query engine) and the [`@prisma/adapter-pg`](https://www.prisma.io/docs/orm/overview/databases/postgresql) driver adapter.
- **Authentication**: JWT-based authentication with Access and Refresh tokens, passwords hashed with `bcryptjs`.
- **Validation**: [Zod](https://zod.dev/) and `class-validator`.
- **Documentation**: [Swagger](https://swagger.io/) and [Scalar](https://scalar.com/) for API reference.
- **Tooling**: [Biome](https://biomejs.dev/) for fast formatting and linting.
- **Containerization**: Docker and Docker Compose support.

## Prerequisites

- [Node.js](https://nodejs.org/) (v22 or later) and [pnpm](https://pnpm.io/) (enable via `corepack enable`)
- [Docker](https://www.docker.com/) (optional, for running the database)

## Installation

1.  Clone the repository:
    ```bash
    git clone <repository-url>
    cd nest-js-fastify
    ```

2.  Install dependencies:
    ```bash
    pnpm install
    ```

3.  Set up environment variables:
    ```bash
    cp .env.example .env
    ```
    Update the `.env` file with your configuration. At minimum set `PG_URL` (append TLS params such as `?sslmode=require` to the URL if your database requires it).

4.  Set up the database schema:

    For a **fresh database**, apply the generated migrations:
    ```bash
    pnpm db:migrate
    ```

    For **local development** (or to sync the schema after editing it), push the schema directly:
    ```bash
    pnpm db:push
    ```

    > `db:push` and `db:migrate` connect to the database and may prompt before destructive changes, so run them in an interactive terminal (not CI/piped input).

## Database (Prisma ORM)

The schema lives in `prisma/schema.prisma`. The Migrate/CLI connection URL is read in `prisma.config.ts` (Prisma 7 no longer allows `url` in the schema's `datasource` block); it picks up `PG_URL` from your `.env` (include any TLS params like `?sslmode=require` directly in the URL). After editing the schema, regenerate the client and apply changes:

```bash
pnpm db:generate   # regenerate the typed client into src/generated/prisma
pnpm db:migrate    # create + apply a migration in ./prisma/migrations (dev)
pnpm db:deploy     # apply pending migrations (CI / production)
pnpm db:push       # alternatively, push the schema directly (handy in dev)
pnpm db:studio     # browse the database in Prisma Studio
```

> The generated client (`src/generated/prisma/`) is git-ignored and regenerated automatically on `pnpm install` via the `postinstall` script.

`PrismaService` (`src/database/prisma.service.ts`) extends `PrismaClient` and is exported app-wide by the global `PrismaModule`. Inject it into any service and call Prisma methods directly:

```ts
import { PrismaService } from '@/database/prisma.service';

@Injectable()
export class SomeService {
	constructor(private readonly prisma: PrismaService) {}

	findUsers() {
		return this.prisma.user.findMany();
	}
}
```

## Running the Application

### Development

To run the application in development mode with hot reloading:

```bash
pnpm dev
```

### Production

To build and run the application in production mode:

```bash
pnpm build
pnpm start
```

### Docker

To run the application and database using Docker Compose:

```bash
docker-compose up -d
```

## Scripts

- `pnpm dev`: Starts the application in watch mode (`nest start --watch`).
- `pnpm build`: Builds the application (`nest build`).
- `pnpm start`: Starts the built application.
- `pnpm format`: Formats the code using Biome.
- `pnpm lint`: Lints the code using Biome.
- `pnpm db:generate`: Regenerates the typed Prisma client.
- `pnpm db:migrate`: Creates and applies a migration (dev).
- `pnpm db:deploy`: Applies pending migrations (CI / production).
- `pnpm db:push`: Pushes the schema directly to the database (dev).
- `pnpm db:studio`: Opens Prisma Studio to browse the database.

## API Documentation

Once the application is running, you can access the API documentation at:

- Swagger/Scalar UI: `http://localhost:5000/api/docs` (or your configured port)
