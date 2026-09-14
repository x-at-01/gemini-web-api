import { join } from "node:path";
import { existsSync } from "node:fs";

const ymlPathGet = () => join(import.meta.dirname, "../posts.yml");

export const redditRepliedCheck = async (post_id) => {
  const yml_path = ymlPathGet();
  if (!existsSync(yml_path)) return false;

  const content = await Bun.file(yml_path).text();
  return (
    content.includes("post_id: " + post_id) ||
    content.includes("comments/" + post_id)
  );
};

export const postsYmlRecord = async (reply_info) => {
  const yml_path = ymlPathGet();
  if (!existsSync(yml_path)) return;

  const content = await Bun.file(yml_path).text(),
    escaped_title = reply_info.post_title.replaceAll('"', '\\"'),
    body_lines = reply_info.comment_body
      .split("\n")
      .map((line) => (line ? "      " + line : ""))
      .join("\n"),
    item_str = [
      "  - platform: reddit.com",
      "    subreddit: " + reply_info.subreddit,
      "    post_id: " + reply_info.post_id,
      '    post_title: "' + escaped_title + '"',
      "    post_url: " + reply_info.post_url,
      "    comment_id: " + reply_info.comment_id,
      "    comment_url: " + reply_info.comment_url,
      "    replied_at: " + new Date().toISOString(),
      "    comment_body: |",
      body_lines,
    ].join("\n");

  let new_content;
  if (content.includes("reddit_replies:")) {
    new_content = content.replace(
      /(reddit_replies:\s*\n)/,
      "$1" + item_str + "\n\n",
    );
  } else {
    new_content =
      content.trimEnd() + "\n\nreddit_replies:\n" + item_str + "\n";
  }

  await Bun.write(yml_path, new_content);
};

export default postsYmlRecord;
