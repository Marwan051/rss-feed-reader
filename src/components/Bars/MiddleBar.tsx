import { actions } from "astro:actions";
import { useEffect, useRef, useState, type MouseEventHandler } from "react";
import type { Selection } from "./SideBar";
import { mapCategoriesToVisuals } from "../../lib/constants";
import type { Cursor } from "../../db/queries/rss-feeds";
import { Bookmark } from "lucide-react";

export type FeedItem = {
  itemId: number;
  title: string;
  read: boolean;
  bookmarkedAt: Date | null;
  pubDate: Date;
};

interface Props {
  initialItems: FeedItem[];
  initialCursor: Cursor | null;
}

declare global {
  interface DocumentEventMap {
    "feed-item-selected": CustomEvent<{ itemId: number; title: string }>;
  }
}

export const MiddleBar = ({ initialItems, initialCursor }: Props) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialItems);
  const [cursor, setCursor] = useState<Cursor | null>(initialCursor);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Selection>({ kind: "all" });
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLUListElement>(null);
  const sentinelRef = useRef<HTMLLIElement>(null);
  const loadingRef = useRef(false);
  const selectedRef = useRef(selected);

  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

  const toFeedItem = (item: {
    itemId: number;
    title: string | null;
    bookmarkedAt: string | null;
    pubDate: string | null;
    read: boolean;
  }) => ({
    itemId: item.itemId,
    title: item.title ?? "No title",
    pubDate: new Date(item.pubDate ?? new Date().toISOString()),
    bookmarkedAt: item.bookmarkedAt ? new Date(item.bookmarkedAt) : null,
    read: item.read,
  });

  const resetToFirstPage = (sel: Selection) => {
    setSelected(sel);
    scrollAreaRef.current?.scrollTo({ top: 0, behavior: "smooth" });

    let fetch;
    switch (sel.kind) {
      case "all":
        fetch = actions.getAllFeedItemsPaginated({});
        break;
      case "bookmarked":
        fetch = actions.getBookmarkedItemsPaginated({});
        break;
      case "category":
        fetch = actions.getFeedItemsByCategoryPaginated({ category: sel.key });
        break;
      case "feed":
        fetch = actions.getFeedItemsByFeedIdPaginated({ feedId: sel.id });
        break;
    }

    fetch!.then(({ data, error }) => {
      if (data && !error) {
        setFeedItems(data.items.map(toFeedItem));
        setCursor(data.nextCursor);
      }
    });
  };

  useEffect(() => {
    const handler = (event: CustomEvent<Selection>) => {
      resetToFirstPage(event.detail);
    };
    document.addEventListener("feed-selected", handler);
    return () => document.removeEventListener("feed-selected", handler);
  }, []);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && cursor && !loadingRef.current) {
          loadingRef.current = true;
          setLoading(true);
          const currentSel = selectedRef.current;

          let fetch;
          switch (currentSel.kind) {
            case "all":
              fetch = actions.getAllFeedItemsPaginated({ cursor });
              break;
            case "bookmarked":
              fetch = actions.getBookmarkedItemsPaginated({ cursor });
              break;
            case "category":
              fetch = actions.getFeedItemsByCategoryPaginated({
                category: currentSel.key,
                cursor,
              });
              break;
            case "feed":
              fetch = actions.getFeedItemsByFeedIdPaginated({
                feedId: currentSel.id,
                cursor,
              });
              break;
          }

          fetch!.then(({ data, error }) => {
            if (data && !error) {
              setFeedItems((prev) => [...prev, ...data.items.map(toFeedItem)]);
              setCursor(data.nextCursor);
            }
            loadingRef.current = false;
            setLoading(false);
          });
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [cursor]);

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
      case "bookmarked":
        actions.setAllBookmarkedAsRead().then(({ data, error }) => {
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
      : selected.kind === "bookmarked"
        ? "Bookmarked"
        : selected.kind === "category"
          ? mapCategoriesToVisuals[selected.key]
          : selected.feedTitle;

  return (
    <div className="p-3 flex flex-col h-full gap-3">
      <div className="flex flex-row justify-between px-2">
        <h2 className=" font-semibold truncate">{header}</h2>
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
        {feedItems.length === 0 ? (
          <li className="flex-1 flex items-center justify-center">
            <h1>No items found</h1>
          </li>
        ) : (
          feedItems.map((item) => (
            <li
              key={item.itemId}
              className={`${cls(selectedItemId === item.itemId, item.read)} rounded`}
            >
              <div className="flex flex-row">
                <div
                  className="flex-4 p-2 min-w-0"
                  onClick={() => {
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
                  <h4 className="font-medium truncate text-nowrap">
                    {item.title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {item.pubDate.toLocaleString()}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    !item.bookmarkedAt
                      ? actions
                          .setBookmark({ itemId: item.itemId })
                          .then(() => {
                            setFeedItems((prev) =>
                              prev.map((feedItem) =>
                                feedItem.itemId === item.itemId
                                  ? {
                                      ...feedItem,
                                      bookmarkedAt: new Date(),
                                    }
                                  : feedItem,
                              ),
                            );
                          })
                      : actions
                          .removeBookmark({ itemId: item.itemId })
                          .then(() => {
                            setFeedItems((prev) =>
                              prev.map((feedItem) =>
                                feedItem.itemId === item.itemId
                                  ? {
                                      ...feedItem,
                                      bookmarkedAt: null,
                                    }
                                  : feedItem,
                              ),
                            );
                          });
                  }}
                >
                  <Bookmark
                    size={32}
                    fill={item.bookmarkedAt ? "#FFD700" : "none"}
                    className="hover:bg-gray-400/30 hover:rounded-xl p-1"
                  />
                </button>
              </div>
            </li>
          ))
        )}
        {cursor && (
          <li ref={sentinelRef} className="flex justify-center py-4">
            {loading && (
              <span className="text-sm text-gray-500">Loading...</span>
            )}
          </li>
        )}
      </ul>
    </div>
  );
};
