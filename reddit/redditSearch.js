import {
  CODE_ERR_SEARCH_FAIL,
  CODE_OK,
  REDDIT_BASE,
  REDDIT_OAUTH_BASE,
  USER_AGENT,
} from "./constant.js";

export const redditSearch = async (
  sub_li = ["rust", "learnrust"],
  query_li = ["clippy restriction", "clippy absolute_paths", "pedantic"],
  limit = 10,
  bearer_token = "",
) => {
  const result_map = new Map(),
    headers = {
      "User-Agent": USER_AGENT,
    };

  if (bearer_token) {
    headers.Authorization = "Bearer " + bearer_token;
  }

  for (let s_idx = 0; s_idx < sub_li.length; ++s_idx) {
    const sub = sub_li[s_idx];
    for (let q_idx = 0; q_idx < query_li.length; ++q_idx) {
      const q = query_li[q_idx],
        base_url = bearer_token ? REDDIT_OAUTH_BASE : REDDIT_BASE,
        url =
          base_url +
          "/r/" +
          sub +
          "/search.json?q=" +
          encodeURIComponent(q) +
          "&restrict_sr=1&sort=relevance&t=year&limit=" +
          limit;

      const res = await fetch(url, { headers });
      if (!res.ok) continue;

      const data = await res.json(),
        children = data?.data?.children ?? [];

      for (let c_idx = 0; c_idx < children.length; ++c_idx) {
        const item = children[c_idx]?.data;
        if (!item || item.locked || item.archived) continue;

        if (!result_map.has(item.id)) {
          result_map.set(item.id, {
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
            matched_query: q,
          });
        }
      }
    }
  }

  const post_li = Array.from(result_map.values());
  return [CODE_OK, post_li];
};

export default redditSearch;
