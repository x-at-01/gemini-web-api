export const CODE_OK = 0,
  CODE_ERR_COOKIE_DB = 1,
  CODE_ERR_COOKIE_EMPTY = 2,
  CODE_ERR_AUTH_FAIL = 3,
  CODE_ERR_CATEGORY_FAIL = 4,
  CODE_ERR_CSRF_FAIL = 5,
  CODE_ERR_POST_FAIL = 6;

export const CHROME_COOKIE_DIR =
    (process.env.HOME ?? "") + "/Library/Application Support/Google/Chrome",
  KEYCHAIN_SERVICE = "Chrome Safe Storage",
  KEYCHAIN_ACCOUNT = "Chrome",
  PBKDF2_SALT = "saltysalt",
  PBKDF2_ITERATIONS = 1003,
  AES_KEY_LEN = 16,
  AES_IV_LEN = 16,
  HEADER_PAD_LEN = 32;

export const FORUM_HOST = "users.rust-lang.org",
  FORUM_BASE = "https://users.rust-lang.org",
  TARGET_CATEGORY_SLUG = "announcements",
  USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
  BROWSER_HEADERS = {
    "User-Agent": USER_AGENT,
    "sec-ch-ua":
      '"Not_A Brand";v="8", "Chromium";v="152", "Google Chrome";v="152"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-origin",
    "Accept-Language": "zh-CN,zh;q=0.9,en-US;q=0.8,en;q=0.7",
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
  };
