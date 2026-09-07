# RSS Feed Reader

A server-rendered RSS reader built with Astro, React, Tailwind CSS, and SQLite.

## Features

- Add and manage RSS feeds
- Organize feeds by category
- Browse latest items with infinite scrolling
- Mark items as read (single item, feed, category, all, or all bookmarked)
- Bookmark items for quick access
- View sanitized HTML content or plain text snippets
- Automatic background feed refresh every 15 minutes in production mode

## Tech Stack

- [Astro](https://astro.build/) (SSR with Node adapter)
- React components inside Astro pages
- Tailwind CSS v4
- SQLite (`better-sqlite3`)
- Drizzle ORM + Drizzle migrations
- Express production server wrapper

## Requirements

- Node.js `>=22.12.0`
- pnpm

## Getting Started

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development server:

   ```bash
   pnpm dev
   ```

3. Open:

   ```text
   http://localhost:4321
   ```

## Production Build and Run

```bash
pnpm start
```

This runs `pnpm build` and then starts `server.mjs`.

## Database

- Database file: `rss.db` (SQLite)
- Drizzle schema: `src/db/schema.ts`
- Migrations folder: `drizzle/`
- Migrations are applied at startup via `src/db/index.ts`

Optional migration commands:

```bash
pnpm db:generate
pnpm db:migrate
```

## Project Scripts

- `pnpm dev` — run Astro dev server
- `pnpm build` — build for production
- `pnpm start` — build and run production server
- `pnpm db:generate` — generate Drizzle migration files
- `pnpm db:migrate` — apply Drizzle migrations
