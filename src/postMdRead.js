import { join } from "node:path";
import { existsSync, readdirSync } from "node:fs";

export const postMdRead = async (file_name) => {
  const md_dir = join(import.meta.dirname, "../md");
  let target_path;

  if (file_name) {
    target_path = existsSync(file_name)
      ? file_name
      : join(md_dir, file_name);
  } else {
    const file_li = existsSync(md_dir)
      ? readdirSync(md_dir).filter((f) => f.endsWith(".md"))
      : [];
    target_path = join(md_dir, file_li[0] ?? "fastalp.md");
  }

  const content = await Bun.file(target_path).text(),
    line_li = content.split("\n");

  let title = "",
    start_index = 0;

  for (let i = 0; i < line_li.length; ++i) {
    const line = line_li[i].trim();
    if (line.startsWith("# ")) {
      title = line.slice(2).trim();
      start_index = i + 1;
      break;
    }
  }

  const raw = line_li.slice(start_index).join("\n").trim(),
    github_match = raw.match(/\[GitHub\]\((https?:\/\/[^)]+)\)/i),
    any_link_match = raw.match(/\[.*?\]\((https?:\/\/[^)]+)\)/),
    extlink = github_match?.[1] ?? any_link_match?.[1] ?? "",
    tag_li = ["rust"];

  if (/compress/i.test(title + raw)) tag_li.push("compression");
  if (/alp/i.test(title + raw)) tag_li.push("alp");
  if (/benchmark/i.test(title + raw)) tag_li.push("benchmark");

  return [title, raw, target_path, extlink, tag_li.join(",")];
};

export default postMdRead;

