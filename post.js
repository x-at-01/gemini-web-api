#!/usr/bin/env -S bun
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { site_map, sitePost } from "./src/site/index.js";

export { site_map, sitePost };

const run = async () => {
  const argv = await yargs(hideBin(process.argv))
    .scriptName("post")
    .usage("用法: $0 [选项] [markdown文件路径]")
    .option("to", {
      alias: "t",
      type: "string",
      describe:
        "目标平台: juejin | rustcc | rust-lang | hacknews | reddit | all | auto",
      default: "auto",
    })
    .option("dry-run", {
      type: "boolean",
      describe: "预览模式：读取 Cookie、检查会话并预览，不执行实际发布",
      default: false,
    })
    .option("section", {
      alias: "s",
      type: "string",
      describe: "目标分类 / 板块名称或 slug (如: 后端, 大家的项目, announcements)",
    })
    .option("tags", {
      type: "string",
      describe: "以英文逗号分隔的标签列表 (juejin, rustcc 可用)",
    })
    .option("link", {
      alias: "l",
      type: "string",
      describe: "外部项目链接 (默认从 Markdown 提取)",
    })
    .option("title", {
      type: "string",
      describe: "自定义文章或帖子标题",
    })
    .option("edit", {
      alias: "e",
      type: "string",
      describe: "编辑更新已有文章或帖子 ID (juejin, rustcc 可用)",
    })
    .option("as-text", {
      type: "boolean",
      describe: "以纯文本讨论帖形式发布 (Hacker News 可用)",
      default: false,
    })
    .option("comment", {
      type: "boolean",
      describe:
        "发布链接帖时是否自动追加首评 (Hacker News 可用，可用 --no-comment 关闭)",
      default: true,
    })
    .option("post", {
      alias: "p",
      type: "string",
      describe: "指定回复特定 Reddit 帖子 ID 或 URL",
    })
    .option("subreddit", {
      type: "string",
      describe: "目标 Reddit 子版块列表，以逗号分隔",
    })
    .option("query", {
      alias: "q",
      type: "string",
      describe: "检索词列表，以逗号分隔 (Reddit 可用)",
    })
    .option("max", {
      alias: "m",
      type: "number",
      describe: "单次最大回复帖子数量 (Reddit 可用)",
      default: 1,
    })
    .help("help")
    .alias("h", "help")
    .parse();

  const positional_li = argv._.map((a) => String(a));
  let target = argv.to,
    file_name = positional_li.find((a) => a.endsWith(".md"));

  // Allow first positional argument to specify target platform (e.g. ./post.js juejin file.md)
  if (positional_li.length > 0 && site_map[positional_li[0].toLowerCase()]) {
    target = positional_li[0].toLowerCase();
    file_name = positional_li.slice(1).find((a) => a.endsWith(".md")) ?? file_name;
  }

  const [code] = await sitePost(
    target,
    file_name,
    argv.dryRun,
    argv.section,
    argv.tags,
    argv.link,
    argv.title,
    argv.edit,
    {
      asText: argv.asText,
      comment: argv.comment,
      post: argv.post,
      subreddit: argv.subreddit,
      query: argv.query,
      max: argv.max,
    },
  );

  if (code !== 0) {
    process.exit(code);
  }
};

if (import.meta.main) {
  await run();
}
