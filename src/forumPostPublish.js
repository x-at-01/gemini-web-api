import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CSRF_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  FORUM_BASE,
  USER_AGENT,
} from "./constant.js";

export const sessionVerify = async (cookie_str) => {
  const res = await fetch(FORUM_BASE + "/session/current.json", {
    headers: {
      Cookie: cookie_str,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    return [CODE_ERR_AUTH_FAIL, "", false];
  }

  const data = await res.json(),
    user = data?.current_user;

  if (!user?.username) {
    return [CODE_ERR_AUTH_FAIL, "", false];
  }

  return [CODE_OK, user.username, user.can_create_topic ?? true];
};

export const csrfTokenFetch = async (cookie_str) => {
  const res = await fetch(FORUM_BASE + "/session/csrf", {
    headers: {
      Cookie: cookie_str,
      Accept: "application/json",
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    return [CODE_ERR_CSRF_FAIL, ""];
  }

  const data = await res.json(),
    csrf = data?.csrf ?? "";

  if (!csrf) {
    return [CODE_ERR_CSRF_FAIL, ""];
  }

  return [CODE_OK, csrf];
};

export const topicCreate = async (
  cookie_str,
  csrf_token,
  category_id,
  title,
  raw,
) => {
  const res = await fetch(FORUM_BASE + "/posts.json", {
    method: "POST",
    headers: {
      Cookie: cookie_str,
      "X-CSRF-Token": csrf_token,
      "Content-Type": "application/json",
      Accept: "application/json",
      "X-Requested-With": "XMLHttpRequest",
      "User-Agent": USER_AGENT,
      Origin: FORUM_BASE,
      Referer: FORUM_BASE + "/c/" + category_id,
    },
    body: JSON.stringify({
      category: category_id,
      title,
      raw,
    }),
  });

  const data = await res.json();

  if (!res.ok || data?.errors?.length > 0) {
    const err_msg = data?.errors ? data.errors.join(", ") : res.statusText;
    return [CODE_ERR_POST_FAIL, "", err_msg];
  }

  if (data?.action === "enqueued") {
    return [
      CODE_OK,
      FORUM_BASE + "/u/x-at-01/activity",
      "enqueued",
    ];
  }

  const topic_url =
    FORUM_BASE + "/t/" + (data.topic_slug ?? "topic") + "/" + data.topic_id;

  return [CODE_OK, topic_url, data];
};
