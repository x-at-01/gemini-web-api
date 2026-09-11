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
  CRATE_NAME = "fastalp",
  CRATE_URL = "https://crates.io/crates/fastalp",
  GITHUB_URL = "https://github.com/webc-site/fastalp",
  DOCS_URL = "https://docs.rs/fastalp",
  USER_AGENT =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36";
