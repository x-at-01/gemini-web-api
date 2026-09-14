#!/usr/bin/env -S bun
import {
  aesKeyDerive,
  cookieValDecrypt,
} from "./src/cookieCrypto.js";
import { cookieDbPathFind, cookieRead } from "./src/cookieRead.js";
import { keychainPwdRead } from "./src/keychainPwdRead.js";
import {
  rustccCategoryFind,
  rustccCategoryList,
} from "./src/rustccCategoryFind.js";
import { forumCategoryFind } from "./src/forumCategoryFind.js";
import { postMdRead } from "./src/postMdRead.js";
import {
  rustccArticleCreate,
  rustccArticleEdit,
  rustccSessionVerify,
} from "./src/rustccPostPublish.js";
import {
  csrfTokenFetch,
  sessionVerify,
  topicCreate,
} from "./src/forumPostPublish.js";
import { rustccPost } from "./src/rustccPost.js";
import { forumPost } from "./src/forumPost.js";
import { hacknewsPost } from "./src/hacknewsPost.js";
import { postPublish } from "./src/postPublish.js";

export {
  aesKeyDerive,
  cookieDbPathFind,
  cookieRead,
  cookieValDecrypt,
  csrfTokenFetch,
  forumCategoryFind,
  forumPost,
  hacknewsPost,
  keychainPwdRead,
  postMdRead,
  postPublish,
  rustccArticleCreate,
  rustccArticleEdit,
  rustccCategoryFind,
  rustccCategoryList,
  rustccPost,
  rustccSessionVerify,
  sessionVerify,
  topicCreate,
};

const run = async () => {
  const arg_li = process.argv.slice(2),
    is_help = arg_li.includes("--help") || arg_li.includes("-h"),
    is_dry_run = arg_li.includes("--dry-run");

  if (is_help) {
    console.log("用法: ./post.js [选项] [markdown文件路径]");
    console.log("选项:");
    console.log(
      "  --to <平台>          目标平台: rustcc | rust-lang | hacknews | all (默认根据文档语言自动判断)",
    );
    console.log(
      "  --dry-run            预览模式：读取 Cookie、检查会话、查询板块并预览帖子，不执行实际发帖",
    );
    console.log(
      "  --section, -s <板块> 目标板块名称或 slug",
    );
    console.log("  --tags, -t <标签>    以英文逗号分隔的标签 (rustcc 可用)");
    console.log(
      "  --link <外部链接>    项目外部链接 (rustcc 可用，默认从 Markdown 提取)",
    );
    console.log("  --edit <文章ID>      编辑更新已有帖子 (rustcc 可用)");
    console.log("  --help, -h           显示帮助信息");
    return;
  }

  const to_arg_idx = arg_li.findIndex((a) => a === "--to"),
    target_platform = to_arg_idx !== -1 ? arg_li[to_arg_idx + 1] : "auto",
    section_arg_idx = arg_li.findIndex(
      (a) => a === "--section" || a === "-s",
    ),
    custom_section =
      section_arg_idx !== -1 ? arg_li[section_arg_idx + 1] : null,
    tags_arg_idx = arg_li.findIndex((a) => a === "--tags" || a === "-t"),
    custom_tags = tags_arg_idx !== -1 ? arg_li[tags_arg_idx + 1] : null,
    link_arg_idx = arg_li.findIndex((a) => a === "--link"),
    custom_link = link_arg_idx !== -1 ? arg_li[link_arg_idx + 1] : null,
    edit_arg_idx = arg_li.findIndex((a) => a === "--edit"),
    edit_article_id = edit_arg_idx !== -1 ? arg_li[edit_arg_idx + 1] : null,
    arg_file = arg_li.find((a) => a.endsWith(".md"));

  const [code] = await postPublish(
    target_platform,
    arg_file,
    is_dry_run,
    custom_section,
    custom_tags,
    custom_link,
    edit_article_id,
  );

  if (code !== 0) {
    process.exit(code);
  }
};

if (import.meta.main) {
  await run();
}
