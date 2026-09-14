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
} from "./constant.js";
import { cookieRead } from "./cookieRead.js";
import { rustccCategoryFind } from "./rustccCategoryFind.js";
import { postMdRead } from "./postMdRead.js";
import {
  rustccArticleCreate,
  rustccArticleEdit,
  rustccSessionVerify,
} from "./rustccPostPublish.js";

export const rustccPost = async (
  file_name,
  is_dry_run = false,
  custom_section = null,
  custom_tags = null,
  custom_link = null,
  edit_article_id = null,
) => {
  const target_category = custom_section ?? RUSTCC_TARGET_CATEGORY;

  console.log("=== 正在读取本机 Chrome SQLite Cookies (rustcc.cn) ===");
  const [cookie_code, cookie_str, cookie_map] = await cookieRead(RUSTCC_HOST);
  if (cookie_code === CODE_ERR_COOKIE_DB) {
    console.error("[错误] 未找到 Chrome Cookies SQLite 数据库文件。");
    return [CODE_ERR_COOKIE_DB, "", "未找到 Chrome Cookie 数据库"];
  }
  if (cookie_code === CODE_ERR_COOKIE_EMPTY) {
    console.error(
      "[错误] 未在 Chrome 中找到 " +
        RUSTCC_HOST +
        " 的有效 Cookie，请在 Chrome 中登录该论坛。",
    );
    return [CODE_ERR_COOKIE_EMPTY, "", "未找到有效 Cookie"];
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
    return [CODE_ERR_AUTH_FAIL, "", "登录验证失败"];
  }
  console.log("✓ 当前登录用户: " + username);

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
  const [title, raw, md_file_path, auto_link, auto_tags] =
      await postMdRead(file_name),
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
    return [CODE_OK, "", "dry-run"];
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
      return [CODE_ERR_POST_FAIL, "", result];
    }

    console.log("🎉 更新成功！帖子链接: " + topic_url);
    return [CODE_OK, topic_url, "updated"];
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
    return [CODE_ERR_POST_FAIL, "", result];
  }

  console.log("🎉 发布成功！帖子链接: " + topic_url);
  return [CODE_OK, topic_url, result];
};

export default rustccPost;
