# Docker Guide - Auto Garage Services

This guide explains how Docker is used in the Auto Garage Services project, how to run the full application, and how to rebuild it after future code changes.

## What Docker Does For This Project

Docker packages the project into repeatable containers so another developer, recruiter, or tester can run the app without manually installing PostgreSQL, configuring backend runtime dependencies, and starting each service separately.

This project uses three containers:

| Container | Purpose | Local URL |
| --- | --- | --- |
| `auto_garage_postgres` | PostgreSQL database | `localhost:5432` |
| `auto_garage_server` | NestJS backend API | `http://localhost:3001` |
| `auto_garage_client` | Next.js frontend | `http://localhost:3000` |

The Docker setup is defined in:

| File | Purpose |
| --- | --- |
| `docker-compose.yml` | Runs PostgreSQL, NestJS, and Next.js together |
| `server-nestjs/Dockerfile` | Builds and runs the NestJS backend |
| `server-nestjs/.dockerignore` | Keeps local backend files out of the Docker build |
| `client-nextjs/Dockerfile` | Builds and runs the Next.js frontend |
| `client-nextjs/.dockerignore` | Keeps local frontend files out of the Docker build |

## Important Project Environment Values

The backend uses:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/auto_garage
PORT=3001
NODE_ENV=development
ENABLE_CORS=http://localhost:3000
JWT_SECRET=docker_demo_secret
JWT_ACCESS_SECRET=docker_demo_access_secret
JWT_REFRESH_SECRET=docker_demo_refresh_secret
JWT_EXPIRES_IN=3600s
```

The frontend uses:

```env
BACKEND_SERVER_URL=http://server:3001
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_ACCESS_SECRET=docker_demo_access_secret
JWT_REFRESH_SECRET=docker_demo_refresh_secret
```

`BACKEND_SERVER_URL` is different inside Docker. The browser opens the frontend at `http://localhost:3000`, but the frontend container talks to the backend container through Docker's internal service name: `http://server:3001`.

## Before You Start

Install and start Docker Desktop.

Then open a terminal in the project root:

```powershell
cd G:\project\auto-garage-services
```

## Run The Project With Docker

From the project root, run:

```powershell
docker compose up --build
```

The first build can take a few minutes because Docker downloads Node.js and PostgreSQL images and installs project dependencies.

After it finishes, open:

```text
http://localhost:3000
```

Backend API:

```text
http://localhost:3001
```

PostgreSQL:

```text
localhost:5432
database: auto_garage
username: postgres
password: postgres
```

## Stop The Project

Press `Ctrl + C` in the terminal running Docker, then run:

```powershell
docker compose down
```

This stops the containers but keeps the database data because PostgreSQL uses a Docker volume.

## Remove The Database And Start Fresh

Only use this when you intentionally want to delete the local Docker database:

```powershell
docker compose down -v
```

Then rebuild:

```powershell
docker compose up --build
```

## How Database Tables Are Created

In Docker, the backend runs with:

```env
NODE_ENV=development
```

Your current TypeORM configuration enables `synchronize` when `NODE_ENV` is not `production`, so the backend can create/update tables automatically for local Docker testing.

For a real production deployment, use TypeORM migrations instead of `synchronize`.

## Demo Data Note

The Docker database starts empty the first time unless you import or seed data.

Your known demo accounts are:

| Role | Username | Password |
| --- | --- | --- |
| Admin | `admin` | `123456` |
| Mechanic | `demo_mechanic` | `123456` |
| User | `domo_user` | `123456` |

If these users are not already in the Docker database, create or import them before demo testing.

## Useful Docker Commands

Start and rebuild:

```powershell
docker compose up --build
```

Start without rebuilding:

```powershell
docker compose up
```

Run in the background:

```powershell
docker compose up -d
```

Stop containers:

```powershell
docker compose down
```

View running containers:

```powershell
docker compose ps
```

View logs for all services:

```powershell
docker compose logs -f
```

View backend logs:

```powershell
docker compose logs -f server
```

View frontend logs:

```powershell
docker compose logs -f client
```

View database logs:

```powershell
docker compose logs -f postgres
```

Open a shell inside the backend container:

```powershell
docker compose exec server sh
```

Open a shell inside the frontend container:

```powershell
docker compose exec client sh
```

Open PostgreSQL shell:

```powershell
docker compose exec postgres psql -U postgres -d auto_garage
```

## Future Code Changes

Use this workflow when you modify the project later.

### 1. Change Backend Code

Edit files inside:

```text
server-nestjs
```

Then rebuild:

```powershell
docker compose up --build server
```

Or rebuild the whole app:

```powershell
docker compose up --build
```

Use this when you change:

- NestJS controllers
- NestJS services
- TypeORM entities
- DTOs
- authentication logic
- backend `package.json`

### 2. Change Frontend Code

Edit files inside:

```text
client-nextjs
```

Then rebuild:

```powershell
docker compose up --build client
```

Or rebuild the whole app:

```powershell
docker compose up --build
```

Use this when you change:

- Next.js pages
- React components
- Next API routes
- frontend styles
- frontend `package.json`

### 3. Change Environment Variables

Edit values in `docker-compose.yml`, then restart:

```powershell
docker compose down
docker compose up --build
```

Environment variables are passed into containers by Docker Compose. Do not copy real production secrets into public GitHub files.

### 4. Change Dependencies

If you add or remove npm packages in `server-nestjs/package.json` or `client-nextjs/package.json`, rebuild the related container:

```powershell
docker compose up --build server
```

or:

```powershell
docker compose up --build client
```

For both:

```powershell
docker compose up --build
```

### 5. Change Database Entities

For local Docker development, TypeORM synchronize can update the database automatically because `NODE_ENV=development`.

For production, create migrations and run them during deployment. Do not rely on `synchronize` in production.

## Development vs Docker Production Build

This Docker setup runs production-style builds:

- NestJS runs from `dist/main`
- Next.js runs with `next start`
- PostgreSQL runs as a container

That is useful for portfolio demos because it behaves closer to deployment than local hot-reload development.

For daily coding, you can still run locally with:

Backend:

```powershell
cd server-nestjs
npm.cmd run start:dev
```

Frontend:

```powershell
cd client-nextjs
npm.cmd run dev
```

Database only through Docker:

```powershell
docker compose up postgres
```

If running locally outside Docker, set frontend `BACKEND_SERVER_URL` to:

```env
BACKEND_SERVER_URL=http://localhost:3001
```

If running inside Docker, set frontend `BACKEND_SERVER_URL` to:

```env
BACKEND_SERVER_URL=http://server:3001
```

## Troubleshooting

### Port Already In Use

If `3000`, `3001`, or `5432` is already being used, stop the other app or change the port mapping in `docker-compose.yml`.

Example:

```yaml
ports:
  - "3002:3000"
```

This means the frontend container still uses port `3000`, but your computer opens it at `http://localhost:3002`.

### Frontend Cannot Reach Backend

Inside Docker, use:

```env
BACKEND_SERVER_URL=http://server:3001
```

Do not use `http://localhost:3001` inside the frontend container. Inside a container, `localhost` means that same container, not your NestJS server container.

### Backend Cannot Reach Database

Inside Docker, use:

```env
DATABASE_URL=postgresql://postgres:postgres@postgres:5432/auto_garage
```

The host is `postgres` because that is the Docker Compose service name.

### Frontend Build Fails Because Of Prisma

The frontend does not use Prisma. The frontend Dockerfile uses:

```dockerfile
RUN npm ci --ignore-scripts
RUN npm exec next build
```

This avoids the old frontend `postinstall` Prisma command.

For a cleaner long-term setup, remove the unused frontend `postinstall` script if Prisma is not used anywhere in `client-nextjs`.

### Clean Rebuild

If Docker cache causes confusion:

```powershell
docker compose down
docker compose build --no-cache
docker compose up
```

