import {
  sqliteTable,
  integer,
  text,
  uniqueIndex,

} from "drizzle-orm/sqlite-core";

export const feeds = sqliteTable(
  "feeds",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    url: text("url").notNull(),
    title: text("title").notNull(),
    category: text("category"),
    addedAt: text("added_at").notNull(),
  },
  (t) => [uniqueIndex("feeds_url_unique").on(t.url)],
);

export const items = sqliteTable(
  "items",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id, { onDelete: "cascade" }),
    guid: text("guid").notNull().unique(),
    title: text("title"),
    link: text("link"),
    content: text("content"),
    contentSnippet: text("contentSnippet"),
    pubDate: text("pub_date"),
    read: integer("read",{ mode: "boolean" }).default(false).notNull(),
    bookmarkedAt:text("bookmarked_at")
  },
  (t) => [uniqueIndex("items_feed_guid_unique").on(t.feedId, t.guid)],
);

export const schema = {
  feeds,
  items,
};
