#!/usr/bin/env -S bun
import {
  aesKeyDerive,
  cookieValDecrypt,
} from "./src/cookieCrypto.js";
import { cookieDbPathFind, cookieRead } from "./src/cookieRead.js";
import { keychainPwdRead } from "./src/keychainPwdRead.js";
import { postMdRead } from "./src/postMdRead.js";
import {
  hacknewsCommentAdd,
  hacknewsSessionVerify,
  hacknewsStorySubmit,
  hacknewsSubmitTokenFetch,
  mdToHnText,
} from "./src/hacknewsPostPublish.js";
import { hacknewsPost } from "./src/hacknewsPost.js";

export {
  aesKeyDerive,
  cookieDbPathFind,
  cookieRead,
  cookieValDecrypt,
  hacknewsCommentAdd,
  hacknewsPost,
  hacknewsSessionVerify,
  hacknewsStorySubmit,
  hacknewsSubmitTokenFetch,
  keychainPwdRead,
  mdToHnText,
  postMdRead,
};

const run = async () => {
  const arg_li = process.argv.slice(2),
    is_help = arg_li.includes("--help") || arg_li.includes("-h"),
    is_dry_run = arg_li.includes("--dry-run");

  if (is_help) {
    console.log("用法: ./hacknews.js [选项] [markdown文件路径]");
    console.log("选项:");
    console.log(
      "  --dry-run            预览模式：读取并解密 Cookie、检查会话、查询预览帖子，不执行实际发帖",
    );
    console.log(
      "  --title, -t <标题>   自定义帖子标题 (默认从 Markdown 提取，并智能添加 Show HN 前缀)",
    );
    console.log(
      "  --url, -u <外部链接> 自定义项目链接 (默认从 Markdown 提取 GitHub 链接)",
    );
    console.log(
      "  --as-text            以纯文本讨论贴 (Show HN Text) 形式发布，正文直接作为帖子内容",
    );
    console.log(
      "  --no-comment         发布链接贴时，不自动在评论区追加 Markdown 详细说明首评",
    );
    console.log("  --help, -h           显示帮助信息");
    return;
  }

  const title_arg_idx = arg_li.findIndex((a) => a === "--title" || a === "-t"),
    custom_title = title_arg_idx !== -1 ? arg_li[title_arg_idx + 1] : null,
    url_arg_idx = arg_li.findIndex((a) => a === "--url" || a === "-u"),
    custom_url = url_arg_idx !== -1 ? arg_li[url_arg_idx + 1] : null,
    as_text = arg_li.includes("--as-text"),
    add_comment = !arg_li.includes("--no-comment"),
    arg_file = arg_li.find((a) => a.endsWith(".md")) ?? "md/fixrs.md";

  const [code] = await hacknewsPost(
    arg_file,
    is_dry_run,
    custom_title,
    custom_url,
    as_text,
    add_comment,
  );

  if (code !== 0) {
    process.exit(code);
  }
};

if (import.meta.main) {
  await run();
}
