#!/usr/bin/env -S bun
import { redditPostReply } from "./reddit/redditPostReply.js";
import { fixrsReplyGenerate } from "./reddit/fixrsReplyGenerate.js";

const run = async () => {
  const arg_li = process.argv.slice(2),
    is_help = arg_li.includes("--help") || arg_li.includes("-h"),
    is_dry_run = arg_li.includes("--dry-run");

  if (is_help) {
    console.log("用法: ./reddit.js [选项]");
    console.log("选项:");
    console.log(
      "  --dry-run                 预览模式：检索并展示将要回复的帖子和内容，不实际发帖",
    );
    console.log(
      "  --post, -p <ID或URL>      直接指定回复特定 Reddit 帖子 (例如 1m0r3s7)",
    );
    console.log(
      "  --subreddit, -s <板块列表> 目标板块，以逗号分隔 (默认: rust,learnrust)",
    );
    console.log(
      "  --query, -q <搜索词列表>   检索词列表，以逗号分隔 (默认: clippy restriction 等)",
    );
    console.log(
      "  --max, -m <数量>          单次最大回复帖子数量 (默认: 1)",
    );
    console.log("  --help, -h                显示帮助信息");
    return;
  }

  const post_idx = arg_li.findIndex((a) => a === "--post" || a === "-p"),
    custom_post = post_idx !== -1 ? arg_li[post_idx + 1] : null,
    sub_idx = arg_li.findIndex((a) => a === "--subreddit" || a === "-s"),
    custom_subs =
      sub_idx !== -1 ? arg_li[sub_idx + 1].split(",").map((s) => s.trim()) : null,
    query_idx = arg_li.findIndex((a) => a === "--query" || a === "-q"),
    custom_queries =
      query_idx !== -1
        ? arg_li[query_idx + 1].split(",").map((q) => q.trim())
        : null,
    max_idx = arg_li.findIndex((a) => a === "--max" || a === "-m"),
    max_replies = max_idx !== -1 ? parseInt(arg_li[max_idx + 1], 10) || 1 : 1;

  const [code] = await redditPostReply(
    is_dry_run,
    custom_post,
    custom_subs,
    custom_queries,
    max_replies,
    fixrsReplyGenerate,
  );

  if (code !== 0) {
    process.exit(code);
  }
};

if (import.meta.main) {
  await run();
}
