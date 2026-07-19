import express from "express";
import { handler as ssrHandler } from "./dist/server/entry.mjs";

const app = express();
const PORT = process.env.PORT || 4321;

app.use(express.static("dist/client/"));
app.use(ssrHandler);

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  const updateFeeds = () =>
    fetch(`http://localhost:${PORT}/_actions/updateAllFeedItems`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch((err) => console.error("Feed update failed:", err));

  await updateFeeds();
  setInterval(updateFeeds, 15 * 60 * 1000);
});
