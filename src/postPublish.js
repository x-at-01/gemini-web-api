import { CODE_OK } from "./constant.js";
import { rustccPost } from "./rustccPost.js";
import { forumPost } from "./forumPost.js";
import { hacknewsPost } from "./hacknewsPost.js";
import { postMdRead } from "./postMdRead.js";

export const postPublish = async (
  target = "auto",
  file_name = null,
  is_dry_run = false,
  custom_section = null,
  custom_tags = null,
  custom_link = null,
  edit_article_id = null,
) => {
  let resolved_target = target;

  if (resolved_target === "auto") {
    const [title, raw] = await postMdRead(file_name),
      is_zh = /[\u4e00-\u9fa5]/.test(title + raw);
    resolved_target = is_zh ? "rustcc" : "rust-lang";
  }

  if (resolved_target === "rustcc") {
    return rustccPost(
      file_name,
      is_dry_run,
      custom_section,
      custom_tags,
      custom_link,
      edit_article_id,
    );
  }

  if (resolved_target === "rust-lang" || resolved_target === "forum") {
    return forumPost(file_name, is_dry_run, custom_section);
  }

  if (resolved_target === "hacknews" || resolved_target === "hn") {
    return hacknewsPost(
      file_name,
      is_dry_run,
      null,
      custom_link,
      false,
      true,
    );
  }

  if (resolved_target === "all") {
    console.log("=== 发布至全平台 (rustcc, users.rust-lang.org, hacknews) ===");
    const [cc_code, cc_url] = await rustccPost(
        file_name,
        is_dry_run,
        custom_section,
        custom_tags,
        custom_link,
        edit_article_id,
      ),
      [forum_code, forum_url] = await forumPost(
        file_name,
        is_dry_run,
        custom_section,
      ),
      [hn_code, hn_url] = await hacknewsPost(
        file_name,
        is_dry_run,
        null,
        custom_link,
        false,
        true,
      );

    const is_all_ok =
      cc_code === CODE_OK && forum_code === CODE_OK && hn_code === CODE_OK;
    return [
      is_all_ok ? CODE_OK : 1,
      { rustcc: cc_url, "rust-lang": forum_url, hacknews: hn_url },
      "all finished",
    ];
  }

  console.error("[错误] 未知目标平台: " + resolved_target);
  return [1, "", "未知平台"];
};

export default postPublish;
