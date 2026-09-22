import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CATEGORY_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  JUEJIN_BASE,
  JUEJIN_HOST,
  JUEJIN_TARGET_CATEGORY,
} from "../constant.js";
import { siteCookieRead } from "../siteCookieRead.js";
import { postDryRunPreview } from "../postDryRunPreview.js";
import { postsYmlRecord } from "../postsYmlRecord.js";
import { postMdRead } from "../postMdRead.js";
import { juejinCategoryFind, juejinTagsResolve } from "./juejinCategoryFind.js";
import {
  juejinArticleEdit,
  juejinArticlePublish,
  juejinDraftCreate,
  juejinSessionVerify,
} from "./juejinPostPublish.js";

const briefContentExtract = (raw, max_len = 100) => {
  const line_li = raw.split("\n"),
    filtered_li = [];
  for (let i = 0; i < line_li.length; ++i) {
    const trimmed = line_li[i].trim();
    if (!trimmed) continue;
    if (/^(\[[^\]]+\]\([^)]+\)[\s·|]*)+$/.test(trimmed)) continue;
    filtered_li.push(trimmed);
  }

  const clean = filtered_li
    .join(" ")
    .replace(/```[\s\S]*?```/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\(.*?\)/g, "$1")
    .replace(/^#+\s+/gm, "")
    .replace(/\|.*?\|/g, "")
    .replace(/[-*]\s+/g, "")
    .replace(/\s+/g, " ")
    .trim();

  if (clean.length <= max_len) return clean;
  return clean.slice(0, max_len) + "...";
};

const coverImageExtract = (raw) => {
  const match = raw.match(/!\[.*?\]\((https?:\/\/[^)]+)\)/);
  if (match) {
    const url = match[1].split("|")[0].trim();
    if (/\.(png|jpe?g|webp|gif|svg)$/i.test(url) || url.includes("jsdelivr")) {
      return url;
    }
  }
  return "";
};

export const post = async (
  file_name,
  is_dry_run = false,
  custom_section = null,
  custom_tags = null,
  custom_link = null,
  custom_title = null,
  edit_id = null,
  extra_opt = {},
) => {
  const [cookie_code, cookie_str] = await siteCookieRead(
    JUEJIN_HOST,
    "juejin.cn",
  );
  if (cookie_code !== CODE_OK) return [cookie_code, "", "读取 Cookie 失败"];

  console.log("\n=== 正在验证掘金登录状态 ===");
  const [auth_code, username, user_id] = await juejinSessionVerify(cookie_str);
  if (auth_code !== CODE_OK || !user_id) {
    console.error(
      "[错误] 掘金登录验证失败，请在 Chrome 中重新登录 " + JUEJIN_BASE + "。",
    );
    return [CODE_ERR_AUTH_FAIL, "", "登录验证失败"];
  }
  console.log("✓ 当前登录用户: " + username + " (UID: " + user_id + ")");

  const target_category = custom_section ?? JUEJIN_TARGET_CATEGORY;
  console.log("\n=== 正在查询掘金分类 ===");
  const [cat_code, category_id, category_name] = await juejinCategoryFind(
    cookie_str,
    target_category,
  );
  if (cat_code !== CODE_OK) {
    console.error("[错误] 未能找到目标分类: " + target_category);
    return [CODE_ERR_CATEGORY_FAIL, "", "未找到目标分类"];
  }
  console.log("✓ 目标分类: " + category_name + " (ID: " + category_id + ")");

  console.log("\n=== 正在从本地 md/ 目录读取文章内容 ===");
  const [md_title, raw, md_file_path, auto_link, auto_tags] =
      await postMdRead(file_name),
    final_title = custom_title ?? md_title,
    brief_content = briefContentExtract(raw, 95),
    cover_image = coverImageExtract(raw),
    detected_tag_li = [];

  if (/rust/i.test(final_title + raw)) detected_tag_li.push("Rust");
  if (/时序|数据库|database|tsdb/i.test(final_title + raw))
    detected_tag_li.push("数据库");
  if (/算法|compress|压缩|alp/i.test(final_title + raw))
    detected_tag_li.push("算法");
  if (/性能|吞吐|benchmark|gb\/s|极速|加速|优化/i.test(final_title + raw))
    detected_tag_li.push("性能优化");
  if (/开源|github|crates/i.test(final_title + raw))
    detected_tag_li.push("开源");
  if (/后端|backend/i.test(final_title + raw))
    detected_tag_li.push("后端");
  if (/架构|architecture/i.test(final_title + raw))
    detected_tag_li.push("架构");

  const tags_to_resolve =
    custom_tags ??
    (detected_tag_li.length > 0
      ? detected_tag_li
      : auto_tags ?? "Rust,后端,算法");

  console.log("\n=== 正在匹配掘金标签 ===");
  const [tag_id_li, tag_name_li] = await juejinTagsResolve(
    cookie_str,
    tags_to_resolve,
  );
  console.log(
    "✓ 匹配标签: " +
      tag_name_li.join(", ") +
      " (IDs: " +
      tag_id_li.join(", ") +
      ")",
  );

  console.log("源文件: " + md_file_path);
  console.log("标题: " + final_title);
  console.log("摘要: " + brief_content);
  if (cover_image) console.log("封面图: " + cover_image);
  console.log("内容字数: " + raw.length + " 字符");

  if (is_dry_run) {
    return postDryRunPreview("juejin.cn", final_title, raw, {
      分类: category_name + " (ID: " + category_id + ")",
      标签: tag_name_li.join(", "),
      摘要: brief_content,
    });
  }

  if (edit_id) {
    console.log(
      "\n=== 正在更新文章 (" + edit_id + ") 至 " + JUEJIN_BASE + " ===",
    );
    const [edit_code, article_url, result] = await juejinArticleEdit(
      cookie_str,
      edit_id,
      category_id,
      tag_id_li,
      final_title,
      raw,
      brief_content,
      cover_image,
    );
    if (edit_code !== CODE_OK) {
      console.error("[错误] 更新文章失败: " + result);
      return [CODE_ERR_POST_FAIL, "", result];
    }
    console.log("🎉 更新成功！文章链接: " + article_url);
    return [CODE_OK, article_url, "updated"];
  }

  console.log("\n=== 正在创建草稿并发布至掘金 ===");
  const [draft_code, draft_id, draft_err] = await juejinDraftCreate(
    cookie_str,
    category_id,
    tag_id_li,
    final_title,
    raw,
    brief_content,
    cover_image,
  );
  if (draft_code !== CODE_OK) {
    console.error("[错误] 保存草稿失败: " + draft_err);
    return [CODE_ERR_POST_FAIL, "", draft_err];
  }
  console.log("✓ 草稿保存成功 (Draft ID: " + draft_id + ")");

  console.log("正在执行发布...");
  const [post_code, article_url, article_id] = await juejinArticlePublish(
    cookie_str,
    draft_id,
  );
  if (post_code !== CODE_OK) {
    console.error("[错误] 发布文章失败: " + article_id);
    return [CODE_ERR_POST_FAIL, "", article_id];
  }

  await postsYmlRecord({
    platform: "juejin.cn",
    section: category_name,
    title: final_title,
    source_file: md_file_path,
    url: article_url,
  });

  console.log("🎉 发布成功！文章链接: " + article_url);
  return [CODE_OK, article_url, article_id];
};

export default post;
