import { actions } from "astro:actions";
import { useEffect, useRef, useState, type MouseEventHandler } from "react";
import type { Selection } from "./SideBar";
import { mapCategoriesToVisuals } from "../../lib/constants";

export type FeedItem = {
  itemId: number;
  title: string;
  read: boolean;
  pubDate: Date;
};

interface Props {
  initialItems: FeedItem[];
}

declare global {
  interface DocumentEventMap {
    "feed-item-selected": CustomEvent<{ itemId: number; title: string }>;
  }
}

export const MiddleBar = ({ initialItems }: Props) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialItems);
  const [selected, setSelected] = useState<Selection>({ kind: "all" });
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const handler = (event: CustomEvent<Selection>) => {
      scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      const sel = event.detail;
      setSelected(sel);
      switch (sel.kind) {
        case "all":
          actions.getAllFeedItems().then(({ data, error }) => {
            if (data && !error) {
              setFeedItems(
                data.map((item) => ({
                  itemId: item.itemId,
                  title: item.title ?? "No title",
                  pubDate: new Date(item.pubDate!),
                  read: item.read,
                })),
              );
            }
          });
          break;
        case "category":
          actions
            .getFeedItemsByCategory({ category: sel.key })
            .then(({ data, error }) => {
              if (data && !error) {
                setFeedItems(
                  data.map((item) => ({
                    itemId: item.itemId,
                    title: item.title ?? "No title",
                    pubDate: new Date(item.pubDate!),
                    read: item.read,
                  })),
                );
              }
            });
          break;
        case "feed":
          actions
            .getFeedItemsByFeedId({ feedId: sel.id })
            .then(({ data, error }) => {
              if (data && !error) {
                setFeedItems(
                  data.map((item) => ({
                    itemId: item.itemId,
                    title: item.title ?? "No title",
                    pubDate: new Date(item.pubDate!),
                    read: item.read,
                  })),
                );
              }
            });
          break;
      }
    };
    document.addEventListener("feed-selected", handler);
    return () => document.removeEventListener("feed-selected", handler);
  }, []);

  const handleMarkAsRead: MouseEventHandler<HTMLButtonElement> = () => {
    switch (selected.kind) {
      case "all":
        actions.markAllAsRead().then(({ data, error }) => {
          if (data && !error) {
            setFeedItems((prev) =>
              prev.map((feedItem) => ({ ...feedItem, read: true })),
            );
          }
        });
        break;
      case "category":
        actions
          .markCategoryAsRead({ category: selected.key })
          .then(({ data, error }) => {
            if (data && !error) {
              setFeedItems((prev) =>
                prev.map((feedItem) => ({ ...feedItem, read: true })),
              );
            }
          });
        break;
      case "feed":
        actions
          .markFeedAsRead({ feedId: selected.id })
          .then(({ data, error }) => {
            if (data && !error) {
              setFeedItems((prev) =>
                prev.map((feedItem) => ({ ...feedItem, read: true })),
              );
            }
          });
        break;
    }
  };

  const cls = (active: boolean, read: boolean) =>
    `hover:bg-primary-hover hover:cursor-pointer ${active ? "bg-primary" : read ? "bg-accent-subtle" : "bg-accent"}`;

  const header =
    selected.kind === "all"
      ? "All Feeds"
      : selected.kind === "category"
        ? mapCategoriesToVisuals[selected.key]
        : selected.feedTitle;

  return (
    <div className="p-3 flex flex-col h-full gap-3">
      <div className="flex flex-row justify-between px-2">
        <h2 className=" font-semibold">{header}</h2>
        <button
          type="button"
          className="text-primary hover:text-primary-hover hover:underline"
          onClick={handleMarkAsRead}
        >
          Mark all current items as read
        </button>
      </div>
      <ul
        className="flex-1 min-h-0 overflow-y-auto scrollbar-thumb-primary flex flex-col gap-1.5"
        style={{ overflowAnchor: "none" }}
        ref={scrollAreaRef}
      >
        {feedItems.map((item) => (
          <li
            key={item.itemId}
            className={`${cls(selectedItemId === item.itemId, item.read)} rounded p-2`}
            onClick={ () => {
              setSelectedItemId(item.itemId);

              actions.markItemAsRead({ itemId: item.itemId }).then(() => {
                setFeedItems((prev) =>
                  prev.map((feedItem) =>
                    feedItem.itemId === item.itemId
                      ? { ...feedItem, read: true }
                      : feedItem,
                  ),
                );
              });
              document.dispatchEvent(
                new CustomEvent("feed-item-selected", {
                  detail: { itemId: item.itemId, title: item.title },
                }),
              );
            }}
          >
            <h4 className="font-medium">{item.title}</h4>
            <p className="text-sm text-gray-600">
              {item.pubDate.toLocaleString()}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
};
