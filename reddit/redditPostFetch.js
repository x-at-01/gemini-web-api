import {
  CODE_ERR_SEARCH_FAIL,
  CODE_OK,
  REDDIT_BASE,
  REDDIT_OAUTH_BASE,
  USER_AGENT,
} from "./constant.js";

const postIdExtract = (input_str) => {
  if (!input_str) return "";
  const cleaned = input_str.trim();
  if (!cleaned.includes("/")) {
    return cleaned.replace(/^t3_/, "");
  }
  const match = cleaned.match(/comments\/([a-z0-9]+)/i);
  return match?.[1] ?? "";
};

export const redditPostFetch = async (post_id_or_url, bearer_token = "") => {
  const post_id = postIdExtract(post_id_or_url);
  if (!post_id) {
    return [CODE_ERR_SEARCH_FAIL, null, "无效的帖子 ID 或链接"];
  }

  const endpoint = bearer_token
      ? REDDIT_OAUTH_BASE + "/comments/" + post_id
      : REDDIT_BASE + "/comments/" + post_id + ".json",
    headers = {
      "User-Agent": USER_AGENT,
    };

  if (bearer_token) {
    headers.Authorization = "Bearer " + bearer_token;
  }

  const res = await fetch(endpoint, { headers });
  if (!res.ok) {
    return [CODE_ERR_SEARCH_FAIL, null, "获取帖子失败，状态码: " + res.status];
  }

  const data = await res.json(),
    item = data?.[0]?.data?.children?.[0]?.data;

  if (!item) {
    return [CODE_ERR_SEARCH_FAIL, null, "未解析到帖子数据"];
  }

  const post_info = {
    id: item.id,
    name: item.name ?? "t3_" + item.id,
    subreddit: item.subreddit,
    title: item.title,
    author: item.author,
    selftext: item.selftext ?? "",
    permalink: item.permalink,
    url: REDDIT_BASE + item.permalink,
    score: item.score ?? 0,
    num_comments: item.num_comments ?? 0,
    locked: !!item.locked,
    archived: !!item.archived,
    created_utc: item.created_utc,
  };

  return [CODE_OK, post_info, "success"];
};

export default redditPostFetch;
