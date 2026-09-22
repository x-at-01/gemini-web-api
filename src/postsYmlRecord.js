import { join } from "node:path";
import { existsSync } from "node:fs";

export const postsYmlRecord = async (
  platform,
  title,
  source_file,
  url,
  section = "",
  published_at = null,
) => {
  const yml_path = join(import.meta.dirname, "../posts.yml");
  if (!existsSync(yml_path)) return;

  const content = await Bun.file(yml_path).text(),
    entry_line_li = [""];

  if (platform) {
    entry_line_li.push("  - platform: " + platform);
  }
  if (section) {
    entry_line_li.push("    section: " + section);
  }
  if (title) {
    entry_line_li.push('    title: "' + title.replaceAll('"', '\\"') + '"');
  }
  if (source_file) {
    const rel_path = source_file.replace(process.cwd() + "/", "");
    entry_line_li.push("    source_file: " + rel_path);
  }
  if (url) {
    entry_line_li.push("    url: " + url);
  }
  entry_line_li.push(
    "    published_at: " + (published_at ?? new Date().toISOString()),
  );

  const entry = entry_line_li.join("\n"),
    new_content = content.includes("posts:")
      ? content.replace(/(posts:)/, "$1" + entry)
      : content + "\nposts:" + entry;

  await Bun.write(yml_path, new_content);
};

export default postsYmlRecord;
