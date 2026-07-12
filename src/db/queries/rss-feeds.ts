import { desc, eq, inArray } from "drizzle-orm";
import { db } from "../index";
import { feeds, items } from "../schema";

export const getFeeds = () => {
  return db.select().from(feeds).orderBy(feeds.category).all();
};

export const AddFeed = (title: string, url: string, category?: string) => {
  return db
    .insert(feeds)
    .values({
      title: title,
      url: url,
      category: category ?? "uncategorized",
      addedAt: new Date().toISOString(),
    })
    .returning({ feedId: feeds.id })
    .all();
};

export type feedItem = {
  guid: string;
  title: string;
  description: string;
  link: string;
  content: string;
  pubDate: string;
};
type NewItem = typeof items.$inferInsert;

export const insertFeedItems = (feedItems: NewItem[]) => {
  const rows: NewItem[] = feedItems.map((item) => ({
    feedId: item.feedId,
    guid: item.guid,
    title: item.title,
    link: item.link,
    content: item.content,
    contentSnippet: item.contentSnippet,
    pubDate: item.pubDate,
  }));

  return db
    .insert(items)
    .values(rows)
    .onConflictDoNothing({ target: items.guid })
    .run();
};

export const removeFeed = (feedId: number) => {
  return db.delete(feeds).where(eq(feeds.id, feedId)).run();
};

export const getAllFeedItems = () => {
  return db
    .select({
      itemId: items.id,
      title: items.title,
      pubDate: items.pubDate,
      read: items.read,
    })
    .from(items)
    .orderBy(desc(items.pubDate), items.feedId)
    .all();
};

export const getFeedItemsByCategory = (category: string) => {
  return db
    .select({
      itemId: items.id,
      title: items.title,
      pubDate: items.pubDate,
      read: items.read,
    })
    .from(items)
    .where(
      inArray(
        items.feedId,
        db
          .select({ id: feeds.id })
          .from(feeds)
          .where(eq(feeds.category, category)),
      ),
    )
    .orderBy(desc(items.pubDate), items.feedId)
    .all();
};

export const getFeedItemsByFeedId = (feedId: number) => {
  return db
    .select({
      itemId: items.id,
      title: items.title,
      pubDate: items.pubDate,
      read: items.read,
    })
    .from(items)
    .where(eq(items.feedId, feedId))
    .orderBy(desc(items.pubDate))
    .all();
};

export const getFeedItemById = (itemId: number) => {
  return db.select().from(items).where(eq(items.id, itemId)).all();
};

export const markFeedItemAsRead = (itemId: number) => {
  return db.update(items).set({ read: true }).where(eq(items.id, itemId)).run();
};

export const markFeedAsRead = (feedId: number) => {
  return db
    .update(items)
    .set({ read: true })
    .where(eq(items.feedId, feedId))
    .run();
};

export const markCategoryAsRead = (category: string) => {
  return db
    .update(items)
    .set({ read: true })
    .where(
      inArray(
        items.feedId,
        db
          .select({ id: feeds.id })
          .from(feeds)
          .where(eq(feeds.category, category)),
      ),
    )
    .run();
};

export const markAllAsRead = () => {
  return db.update(items).set({ read: true }).run();
};
