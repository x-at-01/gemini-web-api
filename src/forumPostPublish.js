import {
  BROWSER_HEADERS,
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CSRF_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  FORUM_BASE,
} from "./constant.js";

export const sessionVerify = async (cookie_str) => {
  const res = await fetch(FORUM_BASE + "/session/current.json", {
    headers: {
      ...BROWSER_HEADERS,
      Cookie: cookie_str,
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
      ...BROWSER_HEADERS,
      Cookie: cookie_str,
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
  const typing_duration_msecs = 65000 + Math.floor(Math.random() * 25000),
    composer_open_duration_msecs =
      typing_duration_msecs + 20000 + Math.floor(Math.random() * 15000),
    res = await fetch(FORUM_BASE + "/posts.json", {
      method: "POST",
      headers: {
        ...BROWSER_HEADERS,
        Cookie: cookie_str,
        "X-CSRF-Token": csrf_token,
        "Content-Type": "application/json",
        Origin: FORUM_BASE,
        Referer: FORUM_BASE + "/c/" + category_id,
      },
      body: JSON.stringify({
        category: category_id,
        title,
        raw,
        archetype: "regular",
        nested_post: true,
        typing_duration_msecs,
        composer_open_duration_msecs,
        draft_key: "new_topic",
      }),
    });

  const data = await res.json();

  if (!res.ok || data?.errors?.length > 0) {
    const err_msg = data?.errors ? data.errors.join(", ") : res.statusText;
    return [CODE_ERR_POST_FAIL, "", err_msg];
  }

  if (data?.action === "enqueued") {
    return [CODE_OK, FORUM_BASE + "/my/activity", "enqueued"];
  }

  const slug = data.topic_slug ?? data.slug ?? data.topic?.slug ?? "topic",
    topic_id = data.topic_id ?? data.topic?.id ?? data.id,
    topic_url = FORUM_BASE + "/t/" + slug + "/" + topic_id;

  return [CODE_OK, topic_url, data];
};
