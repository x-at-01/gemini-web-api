import { join } from "node:path";
import { existsSync } from "node:fs";

export const postsYmlRecord = async (entry_map) => {
  const yml_path = join(import.meta.dirname, "../posts.yml");
  if (!existsSync(yml_path)) return;

  const content = await Bun.file(yml_path).text(),
    entry_line_li = [""];

  if (entry_map.platform) {
    entry_line_li.push("  - platform: " + entry_map.platform);
  }
  if (entry_map.section) {
    entry_line_li.push("    section: " + entry_map.section);
  }
  if (entry_map.title) {
    entry_line_li.push(
      '    title: "' + entry_map.title.replaceAll('"', '\\"') + '"',
    );
  }
  if (entry_map.source_file) {
    const rel_path = entry_map.source_file.replace(process.cwd() + "/", "");
    entry_line_li.push("    source_file: " + rel_path);
  }
  if (entry_map.url) {
    entry_line_li.push("    url: " + entry_map.url);
  }
  entry_line_li.push(
    "    published_at: " +
      (entry_map.published_at ?? new Date().toISOString()),
  );

  const entry = entry_line_li.join("\n"),
    new_content = content.includes("posts:")
      ? content.replace(/(posts:)/, "$1" + entry)
      : content + "\nposts:" + entry;

  await Bun.write(yml_path, new_content);
};

export default postsYmlRecord;
