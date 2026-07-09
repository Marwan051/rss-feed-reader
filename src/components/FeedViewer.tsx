import { actions } from "astro:actions";
import { useEffect, useState } from "react";

export type ViewerFeedItem = {
  itemId: number;
  title: string;
  link: string;
  content: string;
  contentSnippet: string;
  pubDate: Date;
};

export const FeedViewer = () => {
  const [feedItem, setFeedItem] = useState<ViewerFeedItem | null>(null);
  useEffect(() => {

    const handler = async (event: CustomEvent<{ itemId: number; title: string }>) => {
      const { data, error } = await actions.getFeedItemById({ itemId: event.detail.itemId })

      if (data && !error) {
        console.log(data)
      }
    }

    document.addEventListener("feed-item-selected", handler);
    return () => document.removeEventListener("feed-item-selected", handler);

  }  , []);


return (
    <>
      {feedItem ? (
        <></>
      ) : (
        <div className="w-full h-full flex justify-center text-center items-center">
          <h1>Choose an item to display</h1>
        </div>
      )}
    </>
  );
};
