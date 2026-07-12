import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import {
  AddFeed,
  getAllFeedItems,
  getFeedItemById,
  getFeedItemsByCategory,
  getFeedItemsByFeedId,
  getFeeds,
  insertFeedItems,
  markAllAsRead,
  markCategoryAsRead,
  markFeedAsRead,
  markFeedItemAsRead,
  removeFeed,
} from "../db/queries/rss-feeds";
import Parser from "rss-parser";
import pLimit from "p-limit";
import { sanitizeFeedContent } from "../utils";

type FeedResult =
  | {
      success: true;
      id: number;
      url: string;
      data: Parser.Output<{
        [key: string]: any;
      }>;
    }
  | { success: false; id: number; url: string; error: unknown };

const parseAndInsertFeedItems = (
  feedId: number,
  feed: Parser.Output<{ [key: string]: any }>,
) => {
  const feedItemsData = feed.items.flatMap((item) => {
    if (!item.title || !item.link || !item.guid) return [];
    return [
      {
        feedId,
        guid: item.guid.split("#")[0],
        title: item.title,
        link: item.link,
        content: sanitizeFeedContent(
          item["content:encoded"] || item.content || "",
        ),
        contentSnippet: item.contentSnippet || "",
        pubDate: item.isoDate || new Date().toISOString(),
      },
    ];
  });
  try {
    insertFeedItems(feedItemsData);
  } catch (error) {
    console.error("Error inserting data ", error);
  }
};

export const server = {
  getFeeds: defineAction({
    handler: () => {
      try {
        return getFeeds();
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown database error";
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add feed: ${message}`,
        });
      }
    },
  }),
  addFeed: defineAction({
    input: z.object({
      title: z.string().min(1, "Title is required"),
      url: z.url("Must be a valid URL"),
      category: z.string().optional(),
    }),
    handler: (input) => {
      try {
        return AddFeed(input.title, input.url, input.category)[0].feedId;
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown database error";

        if (message.includes("UNIQUE constraint failed")) {
          throw new ActionError({
            code: "CONFLICT",
            message: `A feed with that URL already exists.`,
          });
        }

        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to add feed: ${message}`,
        });
      }
    },
  }),

  updateAllFeedItems: defineAction({
    handler: async () => {
      const parser = new Parser({
        maxRedirects: 50,
      });
      const feeds = getFeeds();
      const limit = pLimit({ concurrency: 5 });
      const feedsItems = await Promise.all(
        feeds.map((feed) =>
          limit(async () => {
            try {
              const data = await parser.parseURL(feed.url);
              return {
                success: true,
                id: feed.id,
                url: feed.url,
                data,
              } satisfies FeedResult;
            } catch (error) {
              return {
                success: false,
                id: feed.id,
                url: feed.url,
                error,
              } satisfies FeedResult;
            }
          }),
        ),
      );

      const succeeded = feedsItems.filter((f) => f.success);
      // TODO: handle failures later
      const failed = feedsItems.filter((f) => !f.success);

      succeeded.map((feedItem) => {
        parseAndInsertFeedItems(feedItem.id, feedItem.data);
      });
    },
  }),
  updateFeedItem: defineAction({
    input: z.object({
      id: z.number(),
      url: z.url(),
    }),
    handler: async (input) => {
      const parser = new Parser({
        maxRedirects: 50,
      });
      const feed = await parser.parseURL(input.url);

      parseAndInsertFeedItems(input.id, feed);
    },
  }),
  removeFeed: defineAction({
    input: z.object({ id: z.number() }),
    handler: (input) => {
      try {
        removeFeed(input.id);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error removing data ", error);
        return;
      }
    },
  }),
  getAllFeedItems: defineAction({
    handler: () => {
      try {
        return getAllFeedItems();
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error retriving data ", error);
        return;
      }
    },
  }),
  getFeedItemsByCategory: defineAction({
    input: z.object({
      category: z.string(),
    }),
    handler(input) {
      try {
        return getFeedItemsByCategory(input.category);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error retriving data ", error);
        return;
      }
    },
  }),
  getFeedItemsByFeedId: defineAction({
    input: z.object({
      feedId: z.number(),
    }),
    handler(input) {
      try {
        return getFeedItemsByFeedId(input.feedId);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error retriving data ", error);
        return;
      }
    },
  }),
  getFeedItemById: defineAction({
    input: z.object({ itemId: z.number() }),
    handler: (input) => {
      try {
        return getFeedItemById(input.itemId);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error retriving data ", error);
        return;
      }
    },
  }),
  markItemAsRead: defineAction({
    input: z.object({
      itemId: z.number(),
    }),
    handler: (input) => {
      try {
        return markFeedItemAsRead(input.itemId);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error updating data ", error);
        return;
      }
    },
  }),
  markFeedAsRead: defineAction({
    input: z.object({
      feedId: z.number(),
    }),
    handler: (input) => {
      try {
        return markFeedAsRead(input.feedId);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error updating data ", error);
        return;
      }
    },
  }),
  markCategoryAsRead: defineAction({
    input: z.object({
      category: z.string().min(1),
    }),
    handler: (input) => {
      try {
        return markCategoryAsRead(input.category);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error updating data ", error);
        return;
      }
    },
  }),
  markAllAsRead: defineAction({
    handler: () => {
      try {
        return markAllAsRead();
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error updating data ", error);
        return;
      }
    },
  }),
};
