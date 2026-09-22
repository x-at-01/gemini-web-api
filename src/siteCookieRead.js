import { cookieRead } from "./cookieRead.js";
import {
  CODE_ERR_COOKIE_DB,
  CODE_ERR_COOKIE_EMPTY,
  CODE_OK,
} from "./constant.js";

export const siteCookieRead = async (host, site_name) => {
  console.log("=== 正在读取本机 Chrome SQLite Cookies (" + site_name + ") ===");
  const [cookie_code, cookie_str, cookie_map] = await cookieRead(host);

  if (cookie_code === CODE_ERR_COOKIE_DB) {
    console.error("[错误] 未找到 Chrome Cookies SQLite 数据库文件。");
    return [CODE_ERR_COOKIE_DB, "", "未找到 Chrome Cookie 数据库"];
  }

  if (cookie_code === CODE_ERR_COOKIE_EMPTY) {
    console.error(
      "[错误] 未在 Chrome 中找到 " +
        host +
        " 的有效 Cookie，请在 Chrome 中登录该平台。",
    );
    return [CODE_ERR_COOKIE_EMPTY, "", "未找到有效 Cookie"];
  }

  console.log("✓ 成功解密 Cookie 项数: " + Object.keys(cookie_map).length);
  return [CODE_OK, cookie_str, cookie_map];
};

export default siteCookieRead;
