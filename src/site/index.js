import juejin from "./juejin.js";
import rustcc from "./rustcc.js";
import rustLang from "./rustLang.js";
import hacknews from "./hacknews.js";
import reddit from "./reddit.js";
import { postMdRead } from "../postMdRead.js";
import { CODE_ERR_TARGET_UNKNOWN, CODE_OK } from "../constant.js";

export const site_map = {
  juejin,
  jj: juejin,
  rustcc,
  cc: rustcc,
  "rust-lang": rustLang,
  rustlang: rustLang,
  forum: rustLang,
  hacknews,
  hn: hacknews,
  reddit,
};

export const sitePost = async (
  target = "auto",
  file_name = null,
  is_dry_run = false,
  section = null,
  tags = null,
  link = null,
  title = null,
  edit = null,
  extra_opt = {},
) => {
  let resolved_target = target.toLowerCase();

  if (resolved_target === "auto") {
    const [md_title, raw] = await postMdRead(file_name),
      is_zh = /[\u4e00-\u9fa5]/.test(md_title + raw);
    resolved_target = is_zh ? "juejin" : "rust-lang";
  }

  if (resolved_target === "all") {
    console.log("=== 发布至多平台 (juejin, rustcc, rust-lang, hacknews) ===");
    const [jj_code, jj_url] = await juejin(
        file_name,
        is_dry_run,
        section,
        tags,
        link,
        title,
        edit,
        extra_opt,
      ),
      [cc_code, cc_url] = await rustcc(
        file_name,
        is_dry_run,
        section,
        tags,
        link,
        title,
        edit,
        extra_opt,
      ),
      [forum_code, forum_url] = await rustLang(
        file_name,
        is_dry_run,
        section,
        tags,
        link,
        title,
        edit,
        extra_opt,
      ),
      [hn_code, hn_url] = await hacknews(
        file_name,
        is_dry_run,
        section,
        tags,
        link,
        title,
        edit,
        extra_opt,
      );

    const is_all_ok =
      jj_code === CODE_OK &&
      cc_code === CODE_OK &&
      forum_code === CODE_OK &&
      hn_code === CODE_OK;

    return [
      is_all_ok ? CODE_OK : 1,
      {
        juejin: jj_url,
        rustcc: cc_url,
        "rust-lang": forum_url,
        hacknews: hn_url,
      },
      "all finished",
    ];
  }

  const handler = site_map[resolved_target];
  if (!handler) {
    console.error("[错误] 未知目标平台: " + resolved_target);
    console.log(
      "可用平台: juejin, rustcc, rust-lang, hacknews, reddit, all, auto",
    );
    return [CODE_ERR_TARGET_UNKNOWN, "", "未知平台"];
  }

  return handler(
    file_name,
    is_dry_run,
    section,
    tags,
    link,
    title,
    edit,
    extra_opt,
  );
};

export default sitePost;
