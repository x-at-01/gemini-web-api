import { redditPostReply } from "../../reddit/redditPostReply.js";
import { fixrsReplyGenerate } from "../../reddit/fixrsReplyGenerate.js";

export const post = async (
  file_name,
  is_dry_run = false,
  custom_section = null,
  custom_tags = null,
  custom_link = null,
  custom_title = null,
  edit_id = null,
  extra_opt = {},
) => {
  const custom_post = extra_opt.post ?? null,
    custom_subs = extra_opt.subreddit
      ? extra_opt.subreddit.split(",").map((s) => s.trim())
      : null,
    custom_queries = extra_opt.query
      ? extra_opt.query.split(",").map((q) => q.trim())
      : null,
    max_replies = extra_opt.max ? parseInt(extra_opt.max, 10) || 1 : 1;

  return redditPostReply(
    is_dry_run,
    custom_post,
    custom_subs,
    custom_queries,
    max_replies,
    fixrsReplyGenerate,
  );
};

export default post;
