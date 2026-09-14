import {
  CODE_ERR_AUTH_FAIL,
  CODE_OK,
  REDDIT_OAUTH_BASE,
  USER_AGENT,
} from "./constant.js";

export const redditSessionVerify = async (bearer_token) => {
  if (!bearer_token) {
    return [CODE_ERR_AUTH_FAIL, ""];
  }

  const res = await fetch(REDDIT_OAUTH_BASE + "/api/v1/me", {
    headers: {
      "User-Agent": USER_AGENT,
      Authorization: "Bearer " + bearer_token,
    },
  });

  if (!res.ok) {
    return [CODE_ERR_AUTH_FAIL, ""];
  }

  const data = await res.json(),
    username = data?.name ?? data?.data?.name ?? "";

  if (!username) {
    return [CODE_ERR_AUTH_FAIL, ""];
  }

  return [CODE_OK, username];
};

export default redditSessionVerify;
