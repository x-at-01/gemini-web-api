import { copyFileSync, existsSync, readdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { Database } from "bun:sqlite";
import {
  CHROME_COOKIE_DIR,
  CODE_ERR_COOKIE_DB,
  CODE_ERR_COOKIE_EMPTY,
  CODE_OK,
  FORUM_HOST,
} from "./constant.js";
import { keychainPwdRead } from "./keychainPwdRead.js";
import { aesKeyDerive, cookieValDecrypt } from "./cookieCrypto.js";

export const cookieDbPathFind = () => {
  const default_path = join(CHROME_COOKIE_DIR, "Default", "Cookies");
  if (existsSync(default_path)) return default_path;
  if (!existsSync(CHROME_COOKIE_DIR)) return null;

  const dir_li = readdirSync(CHROME_COOKIE_DIR);
  for (let i = 0; i < dir_li.length; ++i) {
    const candidate_path = join(CHROME_COOKIE_DIR, dir_li[i], "Cookies");
    if (existsSync(candidate_path)) return candidate_path;
  }
  return null;
};

export const cookieRead = async (host_filter = FORUM_HOST) => {
  const db_path = cookieDbPathFind();
  if (!db_path) return [CODE_ERR_COOKIE_DB, "", {}];

  const tmp_db =
      "/tmp/chrome_cookies_" +
      Date.now() +
      "_" +
      Math.random().toString(36).slice(2) +
      ".db",
    pwd = keychainPwdRead(),
    aes_key = await aesKeyDerive(pwd);

  copyFileSync(db_path, tmp_db);

  const db = new Database(tmp_db, { readonly: true }),
    query = db.query(
      "SELECT name, value, encrypted_value FROM cookies WHERE host_key LIKE ?",
    ),
    row_li = query.all("%" + host_filter + "%"),
    cookie_li = [],
    cookie_map = {};

  for (let i = 0; i < row_li.length; ++i) {
    const row = row_li[i];
    let val = row.value;
    if (!val && row.encrypted_value) {
      val = await cookieValDecrypt(aes_key, row.encrypted_value);
    }
    if (val) {
      cookie_map[row.name] = val;
      cookie_li.push(row.name + "=" + val);
    }
  }

  db.close();
  unlinkSync(tmp_db);

  if (cookie_li.length === 0) {
    return [CODE_ERR_COOKIE_EMPTY, "", {}];
  }

  return [CODE_OK, cookie_li.join("; "), cookie_map];
};

export default cookieRead;
