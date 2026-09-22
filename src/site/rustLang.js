import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CATEGORY_FAIL,
  CODE_ERR_CSRF_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  FORUM_BASE,
  FORUM_HOST,
  TARGET_CATEGORY_SLUG,
} from "../constant.js";
import { siteCookieRead } from "../siteCookieRead.js";
import { postDryRunPreview } from "../postDryRunPreview.js";
import { postsYmlRecord } from "../postsYmlRecord.js";
import { postMdRead } from "../postMdRead.js";
import { forumCategoryFind } from "./forumCategoryFind.js";
import {
  csrfTokenFetch,
  sessionVerify,
  topicCreate,
} from "./forumPostPublish.js";

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
  const [cookie_code, cookie_str] = await siteCookieRead(
    FORUM_HOST,
    "Discourse",
  );
  if (cookie_code !== CODE_OK) return [cookie_code, "", "读取 Cookie 失败"];

  console.log("\n=== 正在验证论坛登录状态 ===");
  const [auth_code, username, can_post] = await sessionVerify(cookie_str);
  if (auth_code !== CODE_OK || !username) {
    console.error(
      "[错误] 登录验证失败，Cookie 可能已过期，请在 Chrome 中重新登录。",
    );
    return [CODE_ERR_AUTH_FAIL, "", "登录验证失败"];
  }
  console.log(
    "✓ 当前登录用户: " +
      username +
      " (发帖权限: " +
      (can_post ? "允许" : "受限") +
      ")",
  );

  console.log("\n=== 正在获取 CSRF Token ===");
  const [csrf_code, csrf_token] = await csrfTokenFetch(cookie_str);
  if (csrf_code !== CODE_OK) {
    console.error("[错误] 获取 CSRF Token 失败。");
    return [CODE_ERR_CSRF_FAIL, "", "获取 CSRF Token 失败"];
  }
  console.log("✓ 获取 CSRF Token 成功");

  const target_category = custom_section ?? TARGET_CATEGORY_SLUG;
  console.log("\n=== 正在查询论坛板块 ===");
  const [cat_code, category_id, category_name] =
    await forumCategoryFind(target_category);
  if (cat_code !== CODE_OK) {
    console.error("[错误] 未能找到目标板块: " + target_category);
    return [CODE_ERR_CATEGORY_FAIL, "", "未找到目标板块"];
  }
  console.log("✓ 目标板块: " + category_name + " (ID: " + category_id + ")");

  console.log("\n=== 正在从本地 md/ 目录读取帖子内容 ===");
  const [md_title, raw, md_file_path] = await postMdRead(file_name),
    final_title = custom_title ?? md_title;

  console.log("源文件: " + md_file_path);
  console.log("标题: " + final_title);
  console.log("内容字数: " + raw.length + " 字符");

  if (is_dry_run) {
    return postDryRunPreview("users.rust-lang.org", final_title, raw, {
      板块: category_name + " (ID: " + category_id + ")",
    });
  }

  console.log("\n=== 正在发布帖子至 " + FORUM_BASE + " ===");
  const [post_code, topic_url, result] = await topicCreate(
    cookie_str,
    csrf_token,
    category_id,
    final_title,
    raw,
  );

  if (post_code !== CODE_OK) {
    console.error("[错误] 发布帖子失败: " + result);
    return [CODE_ERR_POST_FAIL, "", result];
  }

  await postsYmlRecord({
    platform: "users.rust-lang.org",
    section: category_name,
    title: final_title,
    source_file: md_file_path,
    url: topic_url,
  });

  if (result === "enqueued") {
    console.log(
      "✓ 帖子已成功提交至论坛审核队列（Discourse 新账号自动风控机制）",
    );
    console.log("审核通过后将自动发布至 announcements 板块。个人主页: " + topic_url);
    return [CODE_OK, topic_url, "enqueued"];
  }

  console.log("🎉 发布成功！帖子链接: " + topic_url);
  return [CODE_OK, topic_url, result];
};

export default post;
