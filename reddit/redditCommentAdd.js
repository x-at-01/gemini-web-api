import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_ERR_RATELIMIT,
  CODE_OK,
  REDDIT_BASE,
  REDDIT_OAUTH_BASE,
  USER_AGENT,
} from "./constant.js";

export const redditCommentAdd = async (
  bearer_token,
  parent_fullname,
  comment_text,
) => {
  if (!bearer_token) {
    return [CODE_ERR_AUTH_FAIL, "", "未提供有效的登录令牌"];
  }

  const parent_id = parent_fullname.startsWith("t")
      ? parent_fullname
      : "t3_" + parent_fullname,
    params = new URLSearchParams();

  params.append("api_type", "json");
  params.append("parent", parent_id);
  params.append("text", comment_text);

  const res = await fetch(REDDIT_OAUTH_BASE + "/api/comment", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Authorization: "Bearer " + bearer_token,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    return [
      CODE_ERR_POST_FAIL,
      "",
      "提交评论网络错误，HTTP 状态码: " + res.status,
    ];
  }

  const data = await res.json(),
    error_li = data?.json?.errors ?? [];

  if (error_li.length > 0) {
    const [err_type, err_msg] = error_li[0];
    if (err_type === "RATELIMIT") {
      return [CODE_ERR_RATELIMIT, "", "触发频率限制: " + err_msg];
    }
    return [CODE_ERR_POST_FAIL, "", err_type + ": " + err_msg];
  }

  const thing = data?.json?.data?.things?.[0]?.data,
    comment_id = thing?.id ?? "",
    permalink = thing?.permalink ?? "",
    comment_url = permalink
      ? REDDIT_BASE + permalink
      : REDDIT_BASE + "/comments/" + parent_id.replace(/^t3_/, "") + "/_/" + comment_id;

  return [CODE_OK, comment_url, comment_id];
};

export default redditCommentAdd;
