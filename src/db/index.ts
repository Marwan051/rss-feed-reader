import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const sqlite = new Database("rss.db");

sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema: schema });

migrate(db, {
  migrationsFolder: "./drizzle",
});
