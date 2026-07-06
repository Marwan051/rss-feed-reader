import { mapCategoriesToVisuals } from "./constants";

export type Category = {
  key: string;
  label: string;
};

export function extractCategories(
  feeds: { category: string | null }[],
): Category[] {
  const dbCategories = [
    ...new Set(
      feeds
        .map((feed) => feed.category)
        .filter((category): category is string => category !== null),
    ),
  ];
  return dbCategories.map((cat) => ({
    key: cat,
    label: mapCategoriesToVisuals[cat] ?? cat,
  }));
}
