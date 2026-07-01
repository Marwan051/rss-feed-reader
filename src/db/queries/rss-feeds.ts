import { db } from "../index.ts";
import { feeds } from "../schema.ts";

export function getFeeds() {
  return db.select().from(feeds);
}

export function AddFeed(url: string, title: string, category?: string) {
  return db.insert(feeds).values({
    url: url,
    title: title,
    category: category ?? "uncategorized",
    addedAt: new Date().toISOString(),
  });
}
