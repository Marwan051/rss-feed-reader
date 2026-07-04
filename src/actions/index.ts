import { z } from "astro/zod";
import { ActionError, defineAction } from "astro:actions";
import {
  AddFeed,
  getFeeds,
  insertFeedItems,
  removeFeed,
} from "../db/queries/rss-feeds";
import Parser from "rss-parser";
import pLimit from "p-limit";

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
        return AddFeed(input.title, input.url, input.category);
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

  updateFeedItems: defineAction({
    handler: async () => {
      const parser = new Parser();
      const feeds = getFeeds();
      const limit = pLimit({ concurrency: 5 });
      const feedItems = await Promise.all(
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

      const succeeded = feedItems.filter((f) => f.success);
      // TODO: handle failures later
      const failed = feedItems.filter((f) => !f.success);

      succeeded.map((feedItem) => {
        const feedItemsData = feedItem.data.items.flatMap((item) => {
          if (!item.title || !item.link || !item.guid) return [];
          return [
            {
              feedId: feedItem.id,
              guid: item.guid.split("#")[0],
              title: item.title,
              link: item.link,
              content: item.content || "",
              contentSnippet: item.contentSnippet || "",
              pubDate: item.pubDate || "",
            },
          ];
        });
        console.log(feedItemsData);
        try {
          insertFeedItems(feedItemsData);
        } catch (error) {
          // TODO: Handle error handling
          console.error("Error inserting data ", error);
          return;
        }
      });
    },
  }),
  removeFeed: defineAction({
    input: z.object({ id: z.number() }),
    handler: (input) => {
      try {
        removeFeed(input.id);
      } catch (error) {
        // TODO: Handle error handling
        console.error("Error inserting data ", error);
        return;
      }
    },
  }),
};
