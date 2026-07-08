import { actions } from "astro:actions";
import { useEffect, useRef, useState } from "react";
import type { Selection } from "./SideBar";
import { mapCategoriesToVisuals } from "../../lib/constants";

export type FeedItem = {
  guid: string;
  title: string;
  pubDate: Date;
};

interface Props {
  initialItems: FeedItem[];
}

declare global {
  interface DocumentEventMap {
    "feed-item-selected": CustomEvent<{ guid: string; title: string }>;
  }
}

export const MiddleBar = ({ initialItems }: Props) => {
  const [feedItems, setFeedItems] = useState<FeedItem[]>(initialItems);
  const [selected, setSelected] = useState<Selection>({ kind: "all" });
  const [selectedGuid, setSelectedGuid] = useState<string | null>(null);
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
                  guid: item.guid,
                  title: item.title ?? "No title",
                  pubDate: new Date(item.pubDate!),
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
                    guid: item.guid,
                    title: item.title ?? "No title",
                    pubDate: new Date(item.pubDate!),
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
                    guid: item.guid,
                    title: item.title ?? "No title",
                    pubDate: new Date(item.pubDate!),
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

  const cls = (active: boolean) =>
    `hover:bg-gray-400/60 hover:cursor-pointer ${active ? "bg-gray-400/45" : ""}`;

  const header =
    selected.kind === "all"
      ? "All items"
      : selected.kind === "category"
        ? mapCategoriesToVisuals[selected.key]
        : selected.feedTitle;

  return (
    <div className="p-3 flex flex-col h-full gap-3">
      <h2 className=" font-semibold">{header}</h2>
      <ul
        className="flex-1 min-h-0 overflow-y-auto scrollbar-none flex flex-col gap-1.5"
        style={{ overflowAnchor: "none" }}
        ref={scrollAreaRef}
      >
        {feedItems.map((item) => (
          <li
            key={item.guid}
            className={`${cls(selectedGuid === item.guid)} rounded p-2 bg-gray-400`}
            onClick={() => {
              setSelectedGuid(item.guid);
              document.dispatchEvent(
                new CustomEvent("feed-item-selected", {
                  detail: { guid: item.guid, title: item.title },
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
