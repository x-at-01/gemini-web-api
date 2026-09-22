import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_CSRF_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  HN_BASE,
  HN_HEADERS,
} from "../constant.js";

process.env.NODE_TLS_REJECT_UNAUTHORIZED ??= "0";

export const mdToHnText = (md_content) => {
  const line_li = md_content.split("\n"),
    res_li = [];
  let in_code = false;

  for (let i = 0; i < line_li.length; ++i) {
    const line = line_li[i];
    if (line.trim().startsWith("```")) {
      in_code = !in_code;
      continue;
    }

    if (in_code) {
      res_li.push("  " + line);
      continue;
    }

    let converted = line;
    converted = converted.replace(/###?\s+(.+)/, "$1:");
    converted = converted.replace(
      /\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,
      "$1: <$2>",
    );
    converted = converted.replaceAll("**", "");
    res_li.push(converted);
  }

  return res_li.join("\n").trim();
};

export const hacknewsSessionVerify = async (cookie_str) => {
  const res = await fetch(HN_BASE, {
    headers: {
      ...HN_HEADERS,
      Cookie: cookie_str,
    },
  });

  if (!res.ok) {
    return [CODE_ERR_AUTH_FAIL, ""];
  }

  const html = await res.text(),
    user_match = html.match(/<a id="me" href="user\?id=([^"]+)">/);

  if (user_match?.[1]) {
    return [CODE_OK, user_match[1]];
  }

  const cookie_user_match = cookie_str.match(/(?:^|;\s*)user=([^&;]+)/);
  if (cookie_user_match?.[1]) {
    return [CODE_OK, decodeURIComponent(cookie_user_match[1])];
  }

  return [CODE_ERR_AUTH_FAIL, ""];
};

export const hacknewsSubmitTokenFetch = async (cookie_str) => {
  const res = await fetch(HN_BASE + "/submit", {
    headers: {
      ...HN_HEADERS,
      Cookie: cookie_str,
    },
  });

  if (!res.ok) {
    return [CODE_ERR_CSRF_FAIL, "", ""];
  }

  const html = await res.text();
  if (html.includes("You have to be logged in to submit")) {
    return [CODE_ERR_AUTH_FAIL, "", ""];
  }

  const fnid_match = html.match(/name="fnid" value="([^"]+)"/),
    fnop_match = html.match(/name="fnop" value="([^"]+)"/);

  if (!fnid_match?.[1]) {
    return [CODE_ERR_CSRF_FAIL, "", ""];
  }

  return [CODE_OK, fnid_match[1], fnop_match?.[1] ?? "submit-page"];
};

export const hacknewsStorySubmit = async (
  cookie_str,
  fnid,
  fnop,
  title,
  url = "",
  text = "",
  username = "",
) => {
  const form_data = new URLSearchParams();
  form_data.append("fnid", fnid);
  form_data.append("fnop", fnop ?? "submit-page");
  form_data.append("title", title);
  if (url) {
    form_data.append("url", url);
  }
  if (text) {
    form_data.append("text", text);
  }

  const res = await fetch(HN_BASE + "/r", {
    method: "POST",
    redirect: "manual",
    headers: {
      ...HN_HEADERS,
      Cookie: cookie_str,
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: HN_BASE,
      Referer: HN_BASE + "/submit",
    },
    body: form_data.toString(),
  });

  const location = res.headers.get("location") ?? "";

  if (res.status >= 300 && res.status < 400) {
    const item_match = location.match(/item\?id=(\d+)/);
    if (item_match?.[1]) {
      const story_id = item_match[1],
        story_url = HN_BASE + "/item?id=" + story_id;
      return [CODE_OK, story_url, story_id];
    }

    if (username) {
      const user_res = await fetch(HN_BASE + "/submitted?id=" + username, {
        headers: {
          ...HN_HEADERS,
          Cookie: cookie_str,
        },
      });
      if (user_res.ok) {
        const user_html = await user_res.text(),
          first_item_match = user_html.match(/class="athing[^"]*" id="(\d+)"/);
        if (first_item_match?.[1]) {
          const story_id = first_item_match[1],
            story_url = HN_BASE + "/item?id=" + story_id;
          return [CODE_OK, story_url, story_id];
        }
      }
    }

    const fallback_url = location.startsWith("http")
      ? location
      : HN_BASE + "/" + location.replace(/^\//, "");
    return [CODE_OK, fallback_url, ""];
  }

  const html = await res.text();
  if (html.includes("That link has already been submitted")) {
    const prev_match = html.match(/href="item\?id=(\d+)"/);
    if (prev_match?.[1]) {
      return [
        CODE_ERR_POST_FAIL,
        HN_BASE + "/item?id=" + prev_match[1],
        "链接已在 Hacker News 提交过",
      ];
    }
    return [CODE_ERR_POST_FAIL, "", "该链接此前已被提交过"];
  }

  if (html.includes("too fast") || html.includes("slow down")) {
    return [CODE_ERR_POST_FAIL, "", "提交频率过快，请稍后重试"];
  }

  const err_match =
    html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)?.[1]?.trim() ?? "";
  return [
    CODE_ERR_POST_FAIL,
    "",
    err_match.replace(/<[^>]+>/g, " ").trim() || "发帖提交失败",
  ];
};

export const hacknewsCommentAdd = async (cookie_str, item_id, comment_text) => {
  const item_res = await fetch(HN_BASE + "/item?id=" + item_id, {
    headers: {
      ...HN_HEADERS,
      Cookie: cookie_str,
    },
  });

  if (!item_res.ok) {
    return [CODE_ERR_POST_FAIL, "无法访问帖子详情页"];
  }

  const html = await item_res.text(),
    hmac_match = html.match(/name="hmac" value="([^"]+)"/);

  if (!hmac_match?.[1]) {
    return [CODE_ERR_CSRF_FAIL, "未找到评论 HMAC 令牌"];
  }

  const hmac = hmac_match[1],
    form_data = new URLSearchParams();
  form_data.append("parent", item_id);
  form_data.append("goto", "item?id=" + item_id);
  form_data.append("hmac", hmac);
  form_data.append("text", comment_text);

  const res = await fetch(HN_BASE + "/comment", {
    method: "POST",
    redirect: "manual",
    headers: {
      ...HN_HEADERS,
      Cookie: cookie_str,
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: HN_BASE,
      Referer: HN_BASE + "/item?id=" + item_id,
    },
    body: form_data.toString(),
  });

  if (res.status >= 200 && res.status < 400) {
    return [CODE_OK, "评论添加成功"];
  }

  return [CODE_ERR_POST_FAIL, "评论提交失败"];
};
