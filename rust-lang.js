#!/usr/bin/env -S bun
import {
  aesKeyDerive,
  cookieValDecrypt,
} from "./src/cookieCrypto.js";
import { cookieDbPathFind, cookieRead } from "./src/cookieRead.js";
import { keychainPwdRead } from "./src/keychainPwdRead.js";
import { forumCategoryFind } from "./src/forumCategoryFind.js";
import { postMdRead } from "./src/postMdRead.js";
import {
  csrfTokenFetch,
  sessionVerify,
  topicCreate,
} from "./src/forumPostPublish.js";
import { forumPost } from "./src/forumPost.js";

export {
  aesKeyDerive,
  cookieDbPathFind,
  cookieRead,
  cookieValDecrypt,
  csrfTokenFetch,
  forumCategoryFind,
  forumPost,
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
    console.log("用法: ./rust-lang.js [选项] [markdown文件路径]");
    console.log("选项:");
    console.log(
      "  --dry-run            预览模式：读取并解密 Cookie、检查会话、查询板块并预览帖子，不执行实际发帖",
    );
    console.log(
      "  --section, -s <板块> 目标板块slug (默认: announcements)",
    );
    console.log("  --help, -h           显示帮助信息");
    return;
  }

  const section_arg_idx = arg_li.findIndex(
      (a) => a === "--section" || a === "-s",
    ),
    custom_section =
      section_arg_idx !== -1 ? arg_li[section_arg_idx + 1] : null,
    arg_file = arg_li.find((a) => a.endsWith(".md"));

  const [code] = await forumPost(arg_file, is_dry_run, custom_section);

  if (code !== 0) {
    process.exit(code);
  }
};

if (import.meta.main) {
  await run();
}
