import {
  sqliteTable,
  integer,
  text,
  primaryKey,
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
  },
  (t) => [uniqueIndex("items_feed_guid_unique").on(t.feedId, t.guid)],
);

export const readItems = sqliteTable(
  "read_items",
  {
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.itemId] })],
);

export const bookmarks = sqliteTable(
  "bookmarks",
  {
    itemId: integer("item_id")
      .notNull()
      .references(() => items.id, { onDelete: "cascade" }),
    savedAt: text("saved_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.itemId] })],
);

export const schema = {
  feeds,
  items,
  readItems,
  bookmarks,
};
