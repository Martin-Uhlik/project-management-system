# Project management system

A project management system that enables efficient workforce planning. It allows assigning employees and machines to specific tasks and setting their execution times. A key advantage is the visualization of task dependencies using a graph, making planning and coordination easier. At the same time, the system is designed to be intuitive and easy to use, even for less technically skilled users.

# Images

![main_desktop](https://github.com/user-attachments/assets/4de7c5d1-af75-4c42-a0f6-377654b2109f)

![project_desktop](https://github.com/user-attachments/assets/8a17d123-6fa8-4a1c-ae4a-4f2d5e1e683e)

![main_mobile](https://github.com/user-attachments/assets/da301e9a-12b5-4c22-8a8b-5230123b136d)

# Graphical design

![02-1_D_Home](https://github.com/user-attachments/assets/62a1eb3b-a900-4619-818b-811f0e9fc4a7)

# Technical design

![USE-CASE](https://github.com/user-attachments/assets/f9af1ab1-115f-41a7-9757-d02bdbec7225)

![ERD](https://github.com/user-attachments/assets/b028dfa5-0bf7-495a-bfae-91312e2656e3)

# User manual

[Here](https://github.com/Martin-Uhlik/project-management-system/blob/main/manual/user_manual.pdf)

# Development

All settings live in one `.env` in this folder, made from the template: `cp .env.example .env`. The Compose files pass each service only what it needs, and `npm run dev` on this machine reads the same file.

## Develop with Docker (no Node.js needed)

`docker-compose.dev.yml` runs the Vite dev server, the API with live reload and a dev database, all in containers:

```bash
docker compose -f docker-compose.dev.yml up
```

- Frontend on http://localhost:3000 (sign in with `admin` / `admin`), API on http://localhost:4000, database on `localhost:5432` (`pms` / `pms` / `pms`).
- `frontend/` and `backend/` are mounted into the containers: a saved file reloads the page (frontend) or restarts the API (backend). If it doesn't (rare with Docker Desktop), uncomment `VITE_WATCH_POLLING` in `docker-compose.dev.yml`.
- On every start the backend installs packages when `package-lock.json` changed, applies `backend/prisma/schema.prisma` to the database (`npm run db:push`) and creates the first admin account in an empty database (`npm run db:seed`). After changing the schema, restart it: `docker compose -f docker-compose.dev.yml restart backend`.
- The packages are installed inside the containers (Linux builds) into Docker volumes, never into `frontend/node_modules` or `backend/node_modules` here.
- It is its own Compose project (`project-management-system-dev`) with its own database volume; the production data in `database/data` is never touched. `docker compose -f docker-compose.dev.yml down -v` throws the dev database and the packages away.

Running commands inside the containers:

```bash
docker compose -f docker-compose.dev.yml exec frontend npm run lint
```

```bash
docker compose -f docker-compose.dev.yml exec frontend npm test
```

```bash
docker compose -f docker-compose.dev.yml exec backend npm run lint
```

```bash
docker compose -f docker-compose.dev.yml exec backend npm install <package>
```

To skip typing `-f docker-compose.dev.yml`, run `export COMPOSE_FILE=docker-compose.dev.yml` in the terminal first.

## Develop with Node.js on this machine

Node.js 26 (see `.nvmrc`; the Docker images use the same version). The app has two parts, each with its own `package.json`:

- `backend/` (Express 5, Prisma 7, TypeScript): `npm install`, then `npm run dev` (uses `DATABASE_URL` and `BACKEND_PORT` from `.env`; `docker compose up -d database` starts a database for it). Create or update the database tables with `npm run db:push`, and create the first admin account in an empty database with `npm run db:seed`.
- `frontend/` (React 19, Vite, MUI): `npm install`, then `npm run dev` (the API address is `VITE_BACKEND` in `.env`).

Both have `npm run lint` (ESLint), `npm run format` / `npm run format:check` (Prettier) and `npm run build`; the frontend has `npm test` (Vitest).

## The whole system, like in production

`docker compose up -d --build` builds the production images (nginx with the built frontend, the compiled API) and runs them with the database in `database/data`.
