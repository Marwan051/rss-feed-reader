import { useState, useEffect, useCallback } from "react";
import { actions } from "astro:actions";
import { extractCategories } from "../../lib/categories";
import type { FeedAdded } from "../FeedButtons/AddFeedButton.astro";
import { Bookmark } from "lucide-react";

interface Feed {
  id: number;
  url: string;
  title: string;
  category: string | null;
  addedAt: string;
}

export type Selection =
  | { kind: "all" }
  | { kind: "bookmarked" }
  | { kind: "category"; key: string }
  | { kind: "feed"; id: number; feedTitle: string };

interface Props {
  initialFeeds: Feed[];
}

declare global {
  interface DocumentEventMap {
    "feed-selected": CustomEvent<Selection>;
    "feed-added": CustomEvent<FeedAdded>;
  }
}

export const Sidebar = ({ initialFeeds }: Props) => {
  const [feeds, setFeeds] = useState(initialFeeds);
  const [selected, setSelected] = useState<Selection>({ kind: "all" });

  const handleSelect = useCallback((sel: Selection) => {
    setSelected(sel);
    document.dispatchEvent(new CustomEvent("feed-selected", { detail: sel }));
  }, []);

  const categories = extractCategories(feeds);

  useEffect(() => {
    const handler = (event: CustomEvent<FeedAdded>) => {
      actions.getFeeds().then(({ data, error }) => {
        if (data && !error) {
          setFeeds(data);
          handleSelect({
            kind: "feed",
            id: event.detail.feedId,
            feedTitle: event.detail.feedTitle,
          });
        }
      });
    };
    document.addEventListener("feed-added", handler);
    return () => document.removeEventListener("feed-added", handler);
  }, [handleSelect]);

  const cls = (active: boolean) =>
    `hover:bg-primary-hover/60 hover:cursor-pointer ${active ? "bg-primary-active" : ""}`;

  return (
    <ul className="p-3">
      <li
        onClick={() => {
          handleSelect({ kind: "all" });
        }}
        className={cls(selected.kind === "all")}
      >
        <h2>All Feeds</h2>
      </li>
      <li
        onClick={() => {
          handleSelect({ kind: "bookmarked" });
        }}
        className={cls(selected.kind === "bookmarked")}
      >
        <h2>
          <Bookmark fill="" className="inline-block" />
          Bookmarked
        </h2>
      </li>
      {categories.map((cat) => {
        const catFeeds = feeds.filter((f) => f.category === cat.key);
        if (!catFeeds.length) return null;
        return (
          <li key={cat.key}>
            <h3
              className={cls(
                selected.kind === "category" && selected.key === cat.key,
              )}
              onClick={() => handleSelect({ kind: "category", key: cat.key })}
              data-category-key={cat.key}
            >
              {cat.label}
            </h3>
            <ul className="pl-6">
              {catFeeds.map((feed) => (
                <li
                  key={feed.id}
                  className={cls(
                    selected.kind === "feed" && selected.id === feed.id,
                  )}
                  onClick={() =>
                    handleSelect({
                      kind: "feed",
                      id: feed.id,
                      feedTitle: feed.title,
                    })
                  }
                  data-feed-id={feed.id}
                >
                  {feed.title}
                </li>
              ))}
            </ul>
          </li>
        );
      })}
    </ul>
  );
};
