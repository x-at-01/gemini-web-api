import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_POST_FAIL,
  CODE_OK,
  JUEJIN_API_BASE,
  JUEJIN_BASE,
  JUEJIN_CLIENT_TYPE,
  JUEJIN_HEADERS,
} from "../constant.js";

export const juejinSessionVerify = async (cookie_str) => {
  try {
    const res = await fetch(JUEJIN_API_BASE + "/user_api/v1/user/get", {
      headers: {
        ...JUEJIN_HEADERS,
        Cookie: cookie_str,
      },
    });

    if (!res.ok) {
      return [CODE_ERR_AUTH_FAIL, "", ""];
    }

    const data = await res.json();
    if (data.err_no !== 0 || !data.data?.user_id) {
      return [CODE_ERR_AUTH_FAIL, "", ""];
    }

    const username = data.data.user_name || data.data.user_id,
      user_id = String(data.data.user_id);

    return [CODE_OK, username, user_id];
  } catch {
    return [CODE_ERR_AUTH_FAIL, "", ""];
  }
};

export const juejinArticleDetail = async (cookie_str, article_id) => {
  try {
    const res = await fetch(
      JUEJIN_API_BASE + "/content_api/v1/article/detail",
      {
        method: "POST",
        headers: {
          ...JUEJIN_HEADERS,
          Cookie: cookie_str,
        },
        body: JSON.stringify({
          article_id: String(article_id),
          client_type: JUEJIN_CLIENT_TYPE,
        }),
      },
    );

    if (!res.ok) {
      return [CODE_ERR_POST_FAIL, null];
    }

    const data = await res.json();
    if (data.err_no !== 0 || !data.data?.article_info) {
      return [CODE_ERR_POST_FAIL, null, data.err_msg || "获取文章详情失败"];
    }

    return [CODE_OK, data.data.article_info];
  } catch (e) {
    return [CODE_ERR_POST_FAIL, null, e.message];
  }
};

export const juejinDraftCreate = async (
  cookie_str,
  category_id,
  tag_id_li = [],
  title,
  mark_content,
  brief_content = "",
  cover_image = "",
) => {
  try {
    const body = {
      category_id: String(category_id),
      tag_ids: tag_id_li,
      link_url: "",
      cover_image: cover_image || "",
      title,
      brief_content: brief_content || title,
      edit_type: 10,
      html_content: "deprecated",
      mark_content,
    };

    const res = await fetch(
      JUEJIN_API_BASE + "/content_api/v1/article_draft/create",
      {
        method: "POST",
        headers: {
          ...JUEJIN_HEADERS,
          Cookie: cookie_str,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      return [CODE_ERR_POST_FAIL, "", "HTTP " + res.status];
    }

    const data = await res.json();
    if (data.err_no !== 0 || !data.data?.id) {
      return [
        CODE_ERR_POST_FAIL,
        "",
        data.err_msg || "创建草稿失败 (err_no: " + data.err_no + ")",
      ];
    }

    return [CODE_OK, String(data.data.id)];
  } catch (e) {
    return [CODE_ERR_POST_FAIL, "", e.message];
  }
};

export const juejinDraftUpdate = async (
  cookie_str,
  draft_id,
  category_id,
  tag_id_li = [],
  title,
  mark_content,
  brief_content = "",
  cover_image = "",
) => {
  try {
    const body = {
      id: String(draft_id),
      category_id: String(category_id),
      tag_ids: tag_id_li,
      link_url: "",
      cover_image: cover_image || "",
      title,
      brief_content: brief_content || title,
      edit_type: 10,
      html_content: "deprecated",
      mark_content,
    };

    const res = await fetch(
      JUEJIN_API_BASE + "/content_api/v1/article_draft/update",
      {
        method: "POST",
        headers: {
          ...JUEJIN_HEADERS,
          Cookie: cookie_str,
        },
        body: JSON.stringify(body),
      },
    );

    if (!res.ok) {
      return [CODE_ERR_POST_FAIL, "", "HTTP " + res.status];
    }

    const data = await res.json();
    if (data.err_no !== 0) {
      return [
        CODE_ERR_POST_FAIL,
        "",
        data.err_msg || "更新草稿失败 (err_no: " + data.err_no + ")",
      ];
    }

    return [CODE_OK, String(draft_id)];
  } catch (e) {
    return [CODE_ERR_POST_FAIL, "", e.message];
  }
};

export const juejinDraftDelete = async (cookie_str, draft_id) => {
  try {
    const res = await fetch(
      JUEJIN_API_BASE + "/content_api/v1/article_draft/delete",
      {
        method: "POST",
        headers: {
          ...JUEJIN_HEADERS,
          Cookie: cookie_str,
        },
        body: JSON.stringify({ draft_id: String(draft_id) }),
      },
    );

    if (!res.ok) return [CODE_ERR_POST_FAIL, "HTTP " + res.status];
    const data = await res.json();
    if (data.err_no !== 0) {
      return [CODE_ERR_POST_FAIL, data.err_msg || "删除草稿失败"];
    }

    return [CODE_OK, "deleted"];
  } catch (e) {
    return [CODE_ERR_POST_FAIL, e.message];
  }
};

export const juejinArticlePublish = async (cookie_str, draft_id) => {
  try {
    const res = await fetch(
      JUEJIN_API_BASE + "/content_api/v1/article/publish",
      {
        method: "POST",
        headers: {
          ...JUEJIN_HEADERS,
          Cookie: cookie_str,
        },
        body: JSON.stringify({
          draft_id: String(draft_id),
          sync_to_org: false,
          column_ids: [],
        }),
      },
    );

    if (!res.ok) {
      return [CODE_ERR_POST_FAIL, "", "HTTP " + res.status];
    }

    const data = await res.json();
    if (data.err_no !== 0 || !data.data?.article_id) {
      return [
        CODE_ERR_POST_FAIL,
        "",
        data.err_msg || "发布文章失败 (err_no: " + data.err_no + ")",
      ];
    }

    const article_id = String(data.data.article_id),
      article_url = JUEJIN_BASE + "/post/" + article_id;

    return [CODE_OK, article_url, article_id];
  } catch (e) {
    return [CODE_ERR_POST_FAIL, "", e.message];
  }
};

export const juejinArticleEdit = async (
  cookie_str,
  article_id,
  category_id,
  tag_id_li = [],
  title,
  mark_content,
  brief_content = "",
  cover_image = "",
) => {
  let draft_id = String(article_id);

  const [detail_code, article_info] = await juejinArticleDetail(
    cookie_str,
    article_id,
  );

  if (detail_code === CODE_OK && article_info?.draft_id) {
    draft_id = String(article_info.draft_id);
  }

  const [upd_code, _, upd_err] = await juejinDraftUpdate(
    cookie_str,
    draft_id,
    category_id,
    tag_id_li,
    title,
    mark_content,
    brief_content,
    cover_image,
  );

  if (upd_code !== CODE_OK) {
    return [CODE_ERR_POST_FAIL, "", upd_err || "更新草稿失败"];
  }

  const [pub_code, article_url, pub_result] = await juejinArticlePublish(
    cookie_str,
    draft_id,
  );

  if (pub_code !== CODE_OK) {
    return [CODE_ERR_POST_FAIL, "", pub_result || "重新发布失败"];
  }

  return [CODE_OK, article_url, pub_result];
};

export default juejinArticlePublish;
