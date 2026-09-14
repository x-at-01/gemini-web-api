export const CODE_OK = 0,
  CODE_ERR_COOKIE_DB = 1,
  CODE_ERR_COOKIE_EMPTY = 2,
  CODE_ERR_AUTH_FAIL = 3,
  CODE_ERR_SEARCH_FAIL = 4,
  CODE_ERR_POST_FAIL = 5,
  CODE_ERR_RATELIMIT = 6,
  CODE_ERR_DUPLICATE = 7;

export const REDDIT_HOST = "reddit.com",
  REDDIT_BASE = "https://www.reddit.com",
  REDDIT_OAUTH_BASE = "https://oauth.reddit.com",
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
    "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
    Accept: "application/json, text/javascript, */*; q=0.01",
  };
