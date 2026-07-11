import { actions } from "astro:actions";
import { useEffect, useState } from "react";
import DOMPurify from "dompurify";

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
  const [showHtml, setShowHtml] = useState(true);

  useEffect(() => {
    const handler = async (
      event: CustomEvent<{ itemId: number; title: string }>,
    ) => {
      const { data, error } = await actions.getFeedItemById({
        itemId: event.detail.itemId,
      });

      if (data && !error) {
        const item = Array.isArray(data) ? data[0] : data;
        setFeedItem({
          itemId: item.id,
          title: item.title ?? "",
          link: item.link ?? "",
          content: item.content ?? "",
          contentSnippet: item.contentSnippet ?? "",
          pubDate: new Date(item.pubDate ?? ""),
        });
      }
    };

    document.addEventListener("feed-item-selected", handler);
    return () => document.removeEventListener("feed-item-selected", handler);
  }, []);

  return (
    <>
      {feedItem ? (
        <div className="w-full h-full flex flex-col p-4 overflow-y-auto ">
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-col">
              <h2 className="text-xl font-semibold">{feedItem.title}</h2>
              <a href={feedItem.link} target="_blank">
                <h4 className="text-primary">Open in page</h4>
              </a>
            </div>
            {feedItem.content && (
              <div className="flex items-center gap-2">
                <span>{showHtml ? "HTML" : "Plain"}</span>
                <button
                  onClick={() => setShowHtml(!showHtml)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showHtml ? "bg-blue-600" : "bg-gray-400"
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showHtml ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                  <span className="sr-only">
                    {showHtml ? "HTML" : "Plain text"}
                  </span>
                </button>
              </div>
            )}
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto scrollbar-thumb-primary">
            {showHtml && feedItem.content ? (
              <div
                dangerouslySetInnerHTML={{
                  __html: DOMPurify.sanitize(feedItem.content),
                }}
              />
            ) : (
              <p className="whitespace-pre-wrap">{feedItem.contentSnippet}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="w-full h-full flex justify-center text-center items-center">
          <h1>Choose an item to display</h1>
        </div>
      )}
    </>
  );
};
