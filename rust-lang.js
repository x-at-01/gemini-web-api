#!/usr/bin/env -S bun
import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CATEGORY_FAIL,
  CODE_ERR_COOKIE_DB,
  CODE_ERR_COOKIE_EMPTY,
  CODE_ERR_CSRF_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  FORUM_BASE,
  TARGET_CATEGORY_SLUG,
} from "./src/constant.js";
import { keychainPwdRead } from "./src/keychainPwdRead.js";
import { aesKeyDerive, cookieValDecrypt } from "./src/cookieCrypto.js";
import { cookieDbPathFind, cookieRead } from "./src/cookieRead.js";
import { forumCategoryFind } from "./src/forumCategoryFind.js";
import { postMdRead } from "./src/postMdRead.js";
import {
  csrfTokenFetch,
  sessionVerify,
  topicCreate,
} from "./src/forumPostPublish.js";

export {
  aesKeyDerive,
  cookieDbPathFind,
  cookieRead,
  cookieValDecrypt,
  csrfTokenFetch,
  forumCategoryFind,
  keychainPwdRead,
  postMdRead,
  sessionVerify,
  topicCreate,
};

const run = async () => {
  const arg_li = process.argv.slice(2),
    is_help = arg_li.includes("--help") || arg_li.includes("-h"),
    is_dry_run = arg_li.includes("--dry-run");

  if (is_help) {
    console.log("用法: ./index.js [选项]");
    console.log("选项:");
    console.log(
      "  --dry-run   预览模式：读取并解密 Cookie、检查会话、查询板块并预览帖子，不执行实际发帖",
    );
    console.log("  --help, -h  显示帮助信息");
    return;
  }

  console.log("=== 正在读取本机 Chrome SQLite Cookies (Discourse) ===");
  const [cookie_code, cookie_str, cookie_map] = await cookieRead();
  if (cookie_code === CODE_ERR_COOKIE_DB) {
    console.error("[错误] 未找到 Chrome Cookies SQLite 数据库文件。");
    process.exit(CODE_ERR_COOKIE_DB);
  }
  if (cookie_code === CODE_ERR_COOKIE_EMPTY) {
    console.error(
      "[错误] 未在 Chrome 中找到 users.rust-lang.org 的有效 Cookie，请在 Chrome 中登录该论坛。",
    );
    process.exit(CODE_ERR_COOKIE_EMPTY);
  }
  console.log("✓ 成功解密 Cookie 项数: " + Object.keys(cookie_map).length);

  console.log("\n=== 正在验证论坛登录状态 ===");
  const [auth_code, username, can_post] = await sessionVerify(cookie_str);
  if (auth_code !== CODE_OK || !username) {
    console.error(
      "[错误] 登录验证失败，Cookie 可能已过期，请在 Chrome 中重新登录。",
    );
    process.exit(CODE_ERR_AUTH_FAIL);
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
    process.exit(CODE_ERR_CSRF_FAIL);
  }
  console.log("✓ 获取 CSRF Token 成功");

  console.log("\n=== 正在查询论坛板块 ===");
  const [cat_code, category_id, category_name] =
    await forumCategoryFind(TARGET_CATEGORY_SLUG);
  if (cat_code !== CODE_OK) {
    console.error("[错误] 未能找到目标板块: " + TARGET_CATEGORY_SLUG);
    process.exit(CODE_ERR_CATEGORY_FAIL);
  }
  console.log("✓ 目标板块: " + category_name + " (ID: " + category_id + ")");

  console.log("\n=== 正在从本地 md/ 目录读取帖子内容 ===");
  const arg_file = arg_li.find((a) => a.endsWith(".md")),
    [title, raw, md_file_path] = await postMdRead(arg_file);
  console.log("源文件: " + md_file_path);
  console.log("标题: " + title);
  console.log("内容字数: " + raw.length + " 字符");

  if (is_dry_run) {
    console.log("\n[Dry-run 预览模式] 未执行实际发帖。以下为帖子正文预览:\n");
    console.log("----------------------------------------");
    console.log(raw);
    console.log("----------------------------------------");
    console.log("\n如需执行真实发布，请去掉 --dry-run 参数直接运行。");
    return;
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
    process.exit(CODE_ERR_POST_FAIL);
  }

  if (result === "enqueued") {
    console.log(
      "✓ 帖子已成功提交至论坛审核队列（Discourse 新账号自动风控机制）",
    );
    console.log("审核通过后将自动发布至 announcements 板块。个人主页: " + topic_url);
    return;
  }

  console.log("🎉 发布成功！帖子链接: " + topic_url);
};

if (import.meta.main) {
  await run();
}
