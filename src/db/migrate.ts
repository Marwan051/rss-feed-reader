// src/db/migrate.ts
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";

let migrated = false;

export function runMigrations() {
  console.log("running migrations...");

  if (migrated) return;

  const sqlite = new Database("./rss.db");

  migrate(drizzle(sqlite), {
    migrationsFolder: "./drizzle",
  });

  migrated = true;
}
