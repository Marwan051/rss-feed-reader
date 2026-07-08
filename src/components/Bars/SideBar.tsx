import { useState, useEffect, useCallback } from "react";
import { actions } from "astro:actions";
import { extractCategories } from "../../lib/categories";

interface Feed {
  id: number;
  url: string;
  title: string;
  category: string | null;
  addedAt: string;
}

export type Selection =
  | { kind: "all" }
  | { kind: "category"; key: string }
  | { kind: "feed"; id: number; feedTitle: string };

interface Props {
  initialFeeds: Feed[];
}

declare global {
  interface DocumentEventMap {
    "feed-selected": CustomEvent<Selection>;
  }
}

export const Sidebar = ({ initialFeeds }: Props) => {
  const [feeds, setFeeds] = useState(initialFeeds);
  const [selected, setSelected] = useState<Selection>({ kind: "all" });
  const categories = extractCategories(feeds);

  useEffect(() => {
    const handler = () => {
      actions.getFeeds().then(({ data, error }) => {
        if (data && !error) setFeeds(data);
      });
    };
    document.addEventListener("feed-added", handler);
    return () => document.removeEventListener("feed-added", handler);
  }, []);

  const handleSelect = useCallback((sel: Selection) => {
    setSelected(sel);
    document.dispatchEvent(new CustomEvent("feed-selected", { detail: sel }));
  }, []);

  const cls = (active: boolean) =>
    `hover:bg-gray-400/60 hover:cursor-pointer ${active ? "bg-gray-400/45" : ""}`;

  return (
    <ul className="p-3">
      <li
        onClick={() => {
          handleSelect({ kind: "all" });
        }}
        className={cls(selected.kind === "all")}
      >
        <h2>All feeds</h2>
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
