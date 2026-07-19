import { and, desc, eq, inArray, isNotNull, isNull, lt, or } from "drizzle-orm";
import { db } from "../index";
import { feeds, items } from "../schema";

export const getFeeds = () => {
  return db.select().from(feeds).orderBy(feeds.category).all();
};

export const getStaleFeeds = (staleMinutes: number = 5) => {
  const cutoff = new Date(Date.now() - staleMinutes * 60 * 1000).toISOString();
  return db
    .select()
    .from(feeds)
    .where(or(isNull(feeds.lastFetchedAt), lt(feeds.lastFetchedAt, cutoff)))
    .orderBy(feeds.category)
    .all();
};

export const setFeedLastFetchedAt = (feedId: number) => {
  return db
    .update(feeds)
    .set({ lastFetchedAt: new Date().toISOString() })
    .where(eq(feeds.id, feedId))
    .run();
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
    .innerJoin(feeds, eq(items.feedId, feeds.id))
    .where(eq(feeds.category, category))
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

export type Cursor = { pubDate: string; itemId: number };
const PAGE_SIZE = 50;

type ItemRow = {
  itemId: number;
  title: string | null;
  bookmarkedAt: string | null;
  pubDate: string | null;
  read: boolean;
};

type PageResult = {
  items: ItemRow[];
  nextCursor: Cursor | null;
};

function buildCursorCondition(cursor: Cursor) {
  return or(
    lt(items.pubDate, cursor.pubDate),
    and(eq(items.pubDate, cursor.pubDate), lt(items.id, cursor.itemId)),
  );
}

export const getAllFeedItemsPaginated = (
  cursor?: Cursor | null,
  limit = PAGE_SIZE,
): PageResult => {
  const result = db
    .select({
      itemId: items.id,
      title: items.title,
      bookmarkedAt: items.bookmarkedAt,
      pubDate: items.pubDate,
      read: items.read,
    })
    .from(items)
    .where(cursor ? buildCursorCondition(cursor) : undefined)
    .orderBy(desc(items.pubDate), desc(items.id))
    .limit(limit)
    .all();

  const last = result[result.length - 1];
  return {
    items: result,
    nextCursor:
      result.length === limit && last.pubDate
        ? { pubDate: last.pubDate, itemId: last.itemId }
        : null,
  };
};

export const getFeedItemsByCategoryPaginated = (
  category: string,
  cursor?: Cursor | null,
  limit = PAGE_SIZE,
): PageResult => {
  const result = db
    .select({
      itemId: items.id,
      title: items.title,
      bookmarkedAt: items.bookmarkedAt,
      pubDate: items.pubDate,
      read: items.read,
    })
    .from(items)
    .innerJoin(feeds, eq(items.feedId, feeds.id))
    .where(
      cursor
        ? and(eq(feeds.category, category), buildCursorCondition(cursor))
        : eq(feeds.category, category),
    )
    .orderBy(desc(items.pubDate), desc(items.id))
    .limit(limit)
    .all();

  const last = result[result.length - 1];
  return {
    items: result,
    nextCursor:
      result.length === limit && last.pubDate
        ? { pubDate: last.pubDate, itemId: last.itemId }
        : null,
  };
};

export const getFeedItemsByFeedIdPaginated = (
  feedId: number,
  cursor?: Cursor | null,
  limit = PAGE_SIZE,
): PageResult => {
  const result = db
    .select({
      itemId: items.id,
      title: items.title,
      bookmarkedAt: items.bookmarkedAt,
      pubDate: items.pubDate,
      read: items.read,
    })
    .from(items)
    .where(
      cursor
        ? and(eq(items.feedId, feedId), buildCursorCondition(cursor))
        : eq(items.feedId, feedId),
    )
    .orderBy(desc(items.pubDate), desc(items.id))
    .limit(limit)
    .all();

  const last = result[result.length - 1];
  return {
    items: result,
    nextCursor:
      result.length === limit && last.pubDate
        ? { pubDate: last.pubDate, itemId: last.itemId }
        : null,
  };
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

export const setBookmark = (itemId: number) => {
  return db
    .update(items)
    .set({ bookmarkedAt: new Date().toISOString() })
    .where(eq(items.id, itemId))
    .run();
};

export const removeBookmark = (itemId: number) => {
  return db
    .update(items)
    .set({ bookmarkedAt: null })
    .where(eq(items.id, itemId))
    .run();
};
// Add cursor based navigation
export const getBookmarkedPaginated = (
  cursor?: Cursor | null,
  limit = PAGE_SIZE,
): PageResult => {
  const result = db
    .select({
      itemId: items.id,
      title: items.title,
      bookmarkedAt: items.bookmarkedAt,
      pubDate: items.pubDate,
      read: items.read,
    })
    .from(items)
    .where(
      cursor
        ? and(isNotNull(items.bookmarkedAt), buildCursorCondition(cursor))
        : isNotNull(items.bookmarkedAt),
    )
    .orderBy(desc(items.pubDate), desc(items.id))
    .limit(limit)
    .all();
  const last = result[result.length - 1];
  return {
    items: result,
    nextCursor:
      result.length === limit && last.pubDate
        ? { pubDate: last.pubDate, itemId: last.itemId }
        : null,
  };
};

export const setAllBookmarkedAsRead = () => {
  return db
    .update(items)
    .set({ read: true })
    .where(isNotNull(items.bookmarkedAt))
    .run();
};
