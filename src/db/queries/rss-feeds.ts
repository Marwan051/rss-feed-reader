import { eq } from "drizzle-orm";
import { db } from "../index";
import { feeds, items } from "../schema";

export const getFeeds = () => {
  return db.select().from(feeds).all();
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
    .run();
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

export const removeFeed = async (feedId: number) => {
  return await db.delete(feeds).where(eq(feeds.id, feedId));
};
