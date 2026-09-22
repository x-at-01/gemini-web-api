import { CODE_OK } from "./constant.js";

export const postDryRunPreview = (site_name, title, raw, meta_map = {}) => {
  console.log("\n[Dry-run 预览模式] 未执行实际发帖。以下为帖子正文预览:\n");
  console.log("----------------------------------------");
  console.log("平台: " + site_name);
  console.log("标题: " + title);
  for (const [k, v] of Object.entries(meta_map)) {
    if (v) console.log(k + ": " + v);
  }
  console.log("----------------------------------------");
  console.log(raw);
  console.log("----------------------------------------");
  console.log("\n如需执行真实发布，请去掉 --dry-run 参数直接运行。");
  return [CODE_OK, "", "dry-run"];
};

export default postDryRunPreview;
