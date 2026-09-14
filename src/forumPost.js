import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CATEGORY_FAIL,
  CODE_ERR_COOKIE_DB,
  CODE_ERR_COOKIE_EMPTY,
  CODE_ERR_CSRF_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  FORUM_BASE,
  FORUM_HOST,
  TARGET_CATEGORY_SLUG,
} from "./constant.js";
import { cookieRead } from "./cookieRead.js";
import { forumCategoryFind } from "./forumCategoryFind.js";
import { postMdRead } from "./postMdRead.js";
import {
  csrfTokenFetch,
  sessionVerify,
  topicCreate,
} from "./forumPostPublish.js";

export const forumPost = async (
  file_name,
  is_dry_run = false,
  custom_section = null,
) => {
  const target_category = custom_section ?? TARGET_CATEGORY_SLUG;

  console.log("=== 正在读取本机 Chrome SQLite Cookies (Discourse) ===");
  const [cookie_code, cookie_str, cookie_map] = await cookieRead(FORUM_HOST);
  if (cookie_code === CODE_ERR_COOKIE_DB) {
    console.error("[错误] 未找到 Chrome Cookies SQLite 数据库文件。");
    return [CODE_ERR_COOKIE_DB, "", "未找到 Chrome Cookie 数据库"];
  }
  if (cookie_code === CODE_ERR_COOKIE_EMPTY) {
    console.error(
      "[错误] 未在 Chrome 中找到 " +
        FORUM_HOST +
        " 的有效 Cookie，请在 Chrome 中登录该论坛。",
    );
    return [CODE_ERR_COOKIE_EMPTY, "", "未找到有效 Cookie"];
  }
  console.log("✓ 成功解密 Cookie 项数: " + Object.keys(cookie_map).length);

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

  console.log("\n=== 正在查询论坛板块 ===");
  const [cat_code, category_id, category_name] =
    await forumCategoryFind(target_category);
  if (cat_code !== CODE_OK) {
    console.error("[错误] 未能找到目标板块: " + target_category);
    return [CODE_ERR_CATEGORY_FAIL, "", "未找到目标板块"];
  }
  console.log("✓ 目标板块: " + category_name + " (ID: " + category_id + ")");

  console.log("\n=== 正在从本地 md/ 目录读取帖子内容 ===");
  const [title, raw, md_file_path] = await postMdRead(file_name);
  console.log("源文件: " + md_file_path);
  console.log("标题: " + title);
  console.log("内容字数: " + raw.length + " 字符");

  if (is_dry_run) {
    console.log("\n[Dry-run 预览模式] 未执行实际发帖。以下为帖子正文预览:\n");
    console.log("----------------------------------------");
    console.log(raw);
    console.log("----------------------------------------");
    console.log("\n如需执行真实发布，请去掉 --dry-run 参数直接运行。");
    return [CODE_OK, "", "dry-run"];
  }

  console.log("\n=== 正在发布帖子至 " + FORUM_BASE + " ===");
  const [post_code, topic_url, result] = await topicCreate(
    cookie_str,
    csrf_token,
    category_id,
    title,
    raw,
  );

  if (post_code !== CODE_OK) {
    console.error("[错误] 发布帖子失败: " + result);
    return [CODE_ERR_POST_FAIL, "", result];
  }

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

export default forumPost;
