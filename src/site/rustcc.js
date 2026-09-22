import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CATEGORY_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  RUSTCC_BASE,
  RUSTCC_HOST,
  RUSTCC_TARGET_CATEGORY,
} from "../constant.js";
import { siteCookieRead } from "../siteCookieRead.js";
import { postDryRunPreview } from "../postDryRunPreview.js";
import { postsYmlRecord } from "../postsYmlRecord.js";
import { postMdRead } from "../postMdRead.js";
import { rustccCategoryFind } from "./rustccCategoryFind.js";
import {
  rustccArticleCreate,
  rustccArticleEdit,
  rustccSessionVerify,
} from "./rustccPostPublish.js";

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
    RUSTCC_HOST,
    "rustcc.cn",
  );
  if (cookie_code !== CODE_OK) return [cookie_code, "", "读取 Cookie 失败"];

  console.log("\n=== 正在验证论坛登录状态 ===");
  const [auth_code, username] = await rustccSessionVerify(cookie_str);
  if (auth_code !== CODE_OK || !username) {
    console.error(
      "[错误] 登录验证失败，请在 Chrome 中重新登录 " + RUSTCC_BASE + "。",
    );
    return [CODE_ERR_AUTH_FAIL, "", "登录验证失败"];
  }
  console.log("✓ 当前登录用户: " + username);

  const target_category = custom_section ?? RUSTCC_TARGET_CATEGORY;
  console.log("\n=== 正在查询论坛板块 ===");
  const [cat_code, category_id, category_name] = await rustccCategoryFind(
    cookie_str,
    target_category,
  );
  if (cat_code !== CODE_OK) {
    console.error("[错误] 未能找到目标板块: " + target_category);
    return [CODE_ERR_CATEGORY_FAIL, "", "未找到目标板块"];
  }
  console.log("✓ 目标板块: " + category_name + " (ID: " + category_id + ")");

  console.log("\n=== 正在从本地 md/ 目录读取帖子内容 ===");
  const [md_title, raw, md_file_path, auto_link, auto_tags] =
      await postMdRead(file_name),
    final_title = custom_title ?? md_title,
    final_tags = custom_tags ?? auto_tags ?? "rust",
    final_link = custom_link ?? auto_link ?? "";

  console.log("源文件: " + md_file_path);
  console.log("标题: " + final_title);
  console.log("标签: " + final_tags);
  if (final_link) {
    console.log("外部链接: " + final_link);
  }
  console.log("内容字数: " + raw.length + " 字符");

  if (is_dry_run) {
    return postDryRunPreview("rustcc.cn", final_title, raw, {
      板块: category_name + " (ID: " + category_id + ")",
      标签: final_tags,
      外部链接: final_link,
    });
  }

  if (edit_id) {
    console.log(
      "\n=== 正在更新帖子 (" + edit_id + ") 至 " + RUSTCC_BASE + " ===",
    );
    const [edit_code, topic_url, result] = await rustccArticleEdit(
      cookie_str,
      edit_id,
      category_id,
      final_title,
      raw,
      final_tags,
      final_link,
    );

    if (edit_code !== CODE_OK) {
      console.error("[错误] 更新帖子失败: " + result);
      return [CODE_ERR_POST_FAIL, "", result];
    }

    console.log("🎉 更新成功！帖子链接: " + topic_url);
    return [CODE_OK, topic_url, "updated"];
  }

  console.log("\n=== 正在发布帖子至 " + RUSTCC_BASE + " ===");
  const [post_code, topic_url, result] = await rustccArticleCreate(
    cookie_str,
    category_id,
    final_title,
    raw,
    final_tags,
    final_link,
  );

  if (post_code !== CODE_OK) {
    console.error("[错误] 发布帖子失败: " + result);
    return [CODE_ERR_POST_FAIL, "", result];
  }

  await postsYmlRecord({
    platform: "rustcc.cn",
    section: category_name,
    title: final_title,
    source_file: md_file_path,
    url: topic_url,
  });

  console.log("🎉 发布成功！帖子链接: " + topic_url);
  return [CODE_OK, topic_url, result];
};

export default post;
