import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CSRF_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  HN_BASE,
  HN_HOST,
} from "../constant.js";
import { siteCookieRead } from "../siteCookieRead.js";
import { postDryRunPreview } from "../postDryRunPreview.js";
import { postsYmlRecord } from "../postsYmlRecord.js";
import { postMdRead } from "../postMdRead.js";
import {
  hacknewsCommentAdd,
  hacknewsSessionVerify,
  hacknewsStorySubmit,
  hacknewsSubmitTokenFetch,
  mdToHnText,
} from "./hacknewsPostPublish.js";

export const post = async (
  file_name = "md/fixrs.md",
  is_dry_run = false,
  custom_section = null,
  custom_tags = null,
  custom_link = null,
  custom_title = null,
  edit_id = null,
  extra_opt = {},
) => {
  const [cookie_code, cookie_str] = await siteCookieRead(
    HN_HOST,
    "Hacker News",
  );
  if (cookie_code !== CODE_OK) return [cookie_code, "", "读取 Cookie 失败"];

  console.log("\n=== 正在验证 Hacker News 登录状态 ===");
  const [auth_code, username] = await hacknewsSessionVerify(cookie_str);
  if (auth_code !== CODE_OK || !username) {
    console.error(
      "[错误] 登录验证失败，请在 Chrome 中重新登录 Hacker News。",
    );
    return [CODE_ERR_AUTH_FAIL, "", "登录验证失败"];
  }
  console.log("✓ 当前登录用户: " + username);

  console.log("\n=== 正在获取 Hacker News 发帖表单 Token ===");
  const [token_code, fnid, fnop] = await hacknewsSubmitTokenFetch(cookie_str);
  if (token_code !== CODE_OK) {
    console.error("[错误] 获取提交表单 Token 失败。");
    return [CODE_ERR_CSRF_FAIL, "", "获取提交 Token 失败"];
  }
  console.log("✓ 成功获取发帖 Token (fnid: " + fnid.slice(0, 8) + "...)");

  console.log("\n=== 正在读取 Markdown 文件内容 ===");
  const [orig_title, raw, md_file_path, extlink] = await postMdRead(file_name);
  console.log("源文件: " + md_file_path);

  let final_title = custom_title ?? orig_title;
  if (!custom_title && !final_title.toLowerCase().startsWith("show hn:")) {
    const show_hn_title = "Show HN: " + final_title;
    if (show_hn_title.length <= 80) {
      final_title = show_hn_title;
    } else if (
      final_title.startsWith(
        "fixrs: Automatic refactoring for long absolute paths and clippy::absolute_paths",
      )
    ) {
      final_title =
        "Show HN: fixrs – Refactoring for long absolute paths and clippy::absolute_paths";
    }
  }

  const as_text = extra_opt.asText ?? false,
    add_comment = extra_opt.comment ?? true,
    hn_formatted_text = mdToHnText(raw),
    target_url = as_text ? "" : (custom_link ?? extlink),
    target_text = as_text ? hn_formatted_text : "";

  console.log("最终标题: " + final_title + " (" + final_title.length + "/80 字符)");
  if (final_title.length > 80) {
    console.warn(
      "⚠️ 警告: 标题长度超过 80 个字符 (" +
        final_title.length +
        ")，Hacker News 可能会截断或提示过长。",
    );
  }

  if (target_url) {
    console.log("目标链接: " + target_url);
    console.log(
      "发帖类型: Show HN Link Post (链接帖" +
        (add_comment ? " + 自动首评详细介绍" : "") +
        ")",
    );
  } else {
    console.log("发帖类型: Show HN Text Discussion (纯文本讨论贴)");
    console.log("正文长度: " + target_text.length + " 字符");
  }

  if (is_dry_run) {
    return postDryRunPreview("news.ycombinator.com", final_title, target_text || hn_formatted_text, {
      用户: username,
      链接: target_url || "(纯文本讨论)",
      首评: add_comment ? "自动追加首评" : "不追加",
    });
  }

  console.log("\n=== 正在提交帖子至 Hacker News ===");
  const [post_code, story_url, story_id] = await hacknewsStorySubmit(
    cookie_str,
    fnid,
    fnop,
    final_title,
    target_url,
    target_text,
    username,
  );

  if (post_code !== CODE_OK) {
    console.error("[错误] 提交帖子失败: " + story_id);
    return [CODE_ERR_POST_FAIL, "", story_id];
  }

  console.log("🎉 帖子提交成功！");
  console.log("帖子链接: " + story_url);

  if (target_url && add_comment && story_id) {
    console.log("\n=== 正在为新帖子发布首条说明评论 ===");
    const [cmt_code, cmt_msg] = await hacknewsCommentAdd(
      cookie_str,
      story_id,
      hn_formatted_text,
    );
    if (cmt_code === CODE_OK) {
      console.log("✓ 首评发表成功！项目介绍与代码对比已展示在讨论区。");
    } else {
      console.warn("⚠️ 首评添加失败: " + cmt_msg);
    }
  }

  await postsYmlRecord({
    platform: "news.ycombinator.com",
    title: final_title,
    source_file: md_file_path,
    url: story_url,
  });

  return [CODE_OK, story_url, "success"];
};

export default post;
