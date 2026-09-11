#!/usr/bin/env -S bun
import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CATEGORY_FAIL,
  CODE_ERR_COOKIE_DB,
  CODE_ERR_COOKIE_EMPTY,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  RUSTCC_BASE,
  RUSTCC_HOST,
  RUSTCC_TARGET_CATEGORY,
} from "./src/constant.js";
import { keychainPwdRead } from "./src/keychainPwdRead.js";
import { aesKeyDerive, cookieValDecrypt } from "./src/cookieCrypto.js";
import { cookieDbPathFind, cookieRead } from "./src/cookieRead.js";
import {
  rustccCategoryFind,
  rustccCategoryList,
} from "./src/rustccCategoryFind.js";
import { postMdRead } from "./src/postMdRead.js";
import {
  rustccArticleCreate,
  rustccArticleEdit,
  rustccSessionVerify,
} from "./src/rustccPostPublish.js";

export {
  aesKeyDerive,
  cookieDbPathFind,
  cookieRead,
  cookieValDecrypt,
  keychainPwdRead,
  postMdRead,
  rustccArticleCreate,
  rustccArticleEdit,
  rustccCategoryFind,
  rustccCategoryList,
  rustccSessionVerify,
};

const run = async () => {
  const arg_li = process.argv.slice(2),
    is_help = arg_li.includes("--help") || arg_li.includes("-h"),
    is_dry_run = arg_li.includes("--dry-run");

  if (is_help) {
    console.log("用法: ./rustcc.js [选项] [markdown文件路径]");
    console.log("选项:");
    console.log(
      "  --dry-run            预览模式：读取并解密 Cookie、检查会话、查询板块并预览帖子，不执行实际发帖",
    );
    console.log(
      "  --section, -s <板块> 目标板块名称或ID (默认: 大家的项目)",
    );
    console.log("  --tags, -t <标签>    以英文逗号分隔的标签 (默认自动识别)");
    console.log(
      "  --link <外部链接>    项目外部链接 (默认从 Markdown 提取 GitHub/主页链接)",
    );
    console.log("  --edit <文章ID>      编辑更新已有帖子而非新建帖子");
    console.log("  --help, -h           显示帮助信息");
    return;
  }

  const section_arg_idx = arg_li.findIndex(
      (a) => a === "--section" || a === "-s",
    ),
    custom_section =
      section_arg_idx !== -1 ? arg_li[section_arg_idx + 1] : null,
    target_category = custom_section ?? RUSTCC_TARGET_CATEGORY,
    tags_arg_idx = arg_li.findIndex((a) => a === "--tags" || a === "-t"),
    custom_tags = tags_arg_idx !== -1 ? arg_li[tags_arg_idx + 1] : null,
    link_arg_idx = arg_li.findIndex((a) => a === "--link"),
    custom_link = link_arg_idx !== -1 ? arg_li[link_arg_idx + 1] : null,
    edit_arg_idx = arg_li.findIndex((a) => a === "--edit"),
    edit_article_id = edit_arg_idx !== -1 ? arg_li[edit_arg_idx + 1] : null;

  console.log("=== 正在读取本机 Chrome SQLite Cookies (rustcc.cn) ===");
  const [cookie_code, cookie_str, cookie_map] = await cookieRead(RUSTCC_HOST);
  if (cookie_code === CODE_ERR_COOKIE_DB) {
    console.error("[错误] 未找到 Chrome Cookies SQLite 数据库文件。");
    process.exit(CODE_ERR_COOKIE_DB);
  }
  if (cookie_code === CODE_ERR_COOKIE_EMPTY) {
    console.error(
      "[错误] 未在 Chrome 中找到 " +
        RUSTCC_HOST +
        " 的有效 Cookie，请在 Chrome 中登录该论坛。",
    );
    process.exit(CODE_ERR_COOKIE_EMPTY);
  }
  console.log("✓ 成功解密 Cookie 项数: " + Object.keys(cookie_map).length);

  console.log("\n=== 正在验证论坛登录状态 ===");
  const [auth_code, username] = await rustccSessionVerify(cookie_str);
  if (auth_code !== CODE_OK || !username) {
    console.error(
      "[错误] 登录验证失败，Cookie 可能已过期，请在 Chrome 中重新登录 " +
        RUSTCC_BASE +
        "。",
    );
    process.exit(CODE_ERR_AUTH_FAIL);
  }
  console.log("✓ 当前登录用户: " + username);

  console.log("\n=== 正在查询论坛板块 ===");
  const [cat_code, category_id, category_name] = await rustccCategoryFind(
    cookie_str,
    target_category,
  );
  if (cat_code !== CODE_OK) {
    console.error("[错误] 未能找到目标板块: " + target_category);
    process.exit(CODE_ERR_CATEGORY_FAIL);
  }
  console.log("✓ 目标板块: " + category_name + " (ID: " + category_id + ")");

  console.log("\n=== 正在从本地 md/ 目录读取帖子内容 ===");
  const arg_file = arg_li.find((a) => a.endsWith(".md")),
    [title, raw, md_file_path, auto_link, auto_tags] =
      await postMdRead(arg_file),
    final_tags = custom_tags ?? auto_tags ?? "rust",
    final_link = custom_link ?? auto_link ?? "";

  console.log("源文件: " + md_file_path);
  console.log("标题: " + title);
  console.log("标签: " + final_tags);
  if (final_link) {
    console.log("外部链接: " + final_link);
  }
  console.log("内容字数: " + raw.length + " 字符");

  if (is_dry_run) {
    console.log("\n[Dry-run 预览模式] 未执行实际发帖。以下为帖子正文预览:\n");
    console.log("----------------------------------------");
    console.log(raw);
    console.log("----------------------------------------");
    console.log("\n如需执行真实发布，请去掉 --dry-run 参数直接运行。");
    return;
  }

  if (edit_article_id) {
    console.log(
      "\n=== 正在更新帖子 (" +
        edit_article_id +
        ") 至 " +
        RUSTCC_BASE +
        " ===",
    );
    const [edit_code, topic_url, result] = await rustccArticleEdit(
      cookie_str,
      edit_article_id,
      category_id,
      title,
      raw,
      final_tags,
      final_link,
    );

    if (edit_code !== CODE_OK) {
      console.error("[错误] 更新帖子失败: " + result);
      process.exit(CODE_ERR_POST_FAIL);
    }

    console.log("🎉 更新成功！帖子链接: " + topic_url);
    return;
  }

  console.log("\n=== 正在发布帖子至 " + RUSTCC_BASE + " ===");
  const [post_code, topic_url, result] = await rustccArticleCreate(
    cookie_str,
    category_id,
    title,
    raw,
    final_tags,
    final_link,
  );

  if (post_code !== CODE_OK) {
    console.error("[错误] 发布帖子失败: " + result);
    process.exit(CODE_ERR_POST_FAIL);
  }

  console.log("🎉 发布成功！帖子链接: " + topic_url);
};

if (import.meta.main) {
  await run();
}
