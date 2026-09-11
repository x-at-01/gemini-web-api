import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  RUSTCC_BASE,
  USER_AGENT,
} from "./constant.js";

export const rustccSessionVerify = async (cookie_str) => {
  const res = await fetch(RUSTCC_BASE + "/account", {
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: cookie_str,
    },
  });

  if (!res.ok) {
    return [CODE_ERR_AUTH_FAIL, ""];
  }

  const html = await res.text(),
    match = html.match(/你现在以此帐户登录：\s*<a[^>]*>([^<]+)<\/a>/);

  if (!match) {
    return [CODE_ERR_AUTH_FAIL, ""];
  }

  return [CODE_OK, match[1].trim()];
};

export const rustccArticleCreate = async (
  cookie_str,
  section_id,
  title,
  raw_content,
  tags = "",
  extlink = "",
) => {
  const form = new URLSearchParams();
  form.append("section_id", section_id);
  form.append("stype", "0");
  form.append("from", "form");
  form.append("title", title);
  form.append("tags", tags);
  form.append("raw_content", raw_content);
  form.append("extlink", extlink);

  const res = await fetch(RUSTCC_BASE + "/s/article/create", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: cookie_str,
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: RUSTCC_BASE,
      Referer: RUSTCC_BASE + "/p/article/create",
    },
    body: form.toString(),
    redirect: "manual",
  });

  const location = res.headers.get("location");
  if (res.status === 302 && location) {
    const article_url = location.startsWith("http")
      ? location
      : RUSTCC_BASE + location;
    return [CODE_OK, article_url, location];
  }

  const text = await res.text();
  return [CODE_ERR_POST_FAIL, "", text || "HTTP " + res.status];
};

export const rustccArticleEdit = async (
  cookie_str,
  article_id,
  section_id,
  title,
  raw_content,
  tags = "",
  extlink = "",
) => {
  const form = new URLSearchParams();
  form.append("id", article_id);
  form.append("section_id", section_id);
  form.append("title", title);
  form.append("tags", tags);
  form.append("raw_content", raw_content);
  form.append("extlink", extlink);

  const res = await fetch(RUSTCC_BASE + "/s/article/edit", {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      Cookie: cookie_str,
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: RUSTCC_BASE,
      Referer: RUSTCC_BASE + "/p/article/edit?id=" + article_id,
    },
    body: form.toString(),
    redirect: "manual",
  });

  const location = res.headers.get("location");
  if (res.status === 302 && location) {
    const article_url = location.startsWith("http")
      ? location
      : RUSTCC_BASE + location;
    return [CODE_OK, article_url, location];
  }

  const text = await res.text();
  return [CODE_ERR_POST_FAIL, "", text || "HTTP " + res.status];
};

export default rustccArticleCreate;
