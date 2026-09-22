import {
  CODE_ERR_CATEGORY_FAIL,
  CODE_OK,
  JUEJIN_API_BASE,
  JUEJIN_HEADERS,
  JUEJIN_TARGET_CATEGORY,
} from "../constant.js";

export const juejinCategoryList = async (cookie_str) => {
  try {
    const res = await fetch(
      JUEJIN_API_BASE + "/tag_api/v1/query_category_briefs",
      {
        headers: {
          ...JUEJIN_HEADERS,
          Cookie: cookie_str,
        },
      },
    );

    if (!res.ok) {
      return [CODE_ERR_CATEGORY_FAIL, []];
    }

    const data = await res.json();
    if (data.err_no !== 0 || !Array.isArray(data.data)) {
      return [CODE_ERR_CATEGORY_FAIL, []];
    }

    const category_li = data.data.map((item) => ({
      id: String(item.category_id),
      name: item.category_name,
      url: item.category_url,
    }));

    return [CODE_OK, category_li];
  } catch {
    return [CODE_ERR_CATEGORY_FAIL, []];
  }
};

export const juejinCategoryFind = async (
  cookie_str,
  target_name = JUEJIN_TARGET_CATEGORY,
) => {
  const [cat_code, category_li] = await juejinCategoryList(cookie_str);
  if (cat_code !== CODE_OK) {
    return [CODE_ERR_CATEGORY_FAIL, "", ""];
  }

  const query = String(target_name).trim().toLowerCase(),
    matched = category_li.find(
      (cat) =>
        cat.name.toLowerCase() === query ||
        cat.id === target_name ||
        cat.url.toLowerCase() === query,
    );

  if (!matched) {
    return [CODE_ERR_CATEGORY_FAIL, "", ""];
  }

  return [CODE_OK, matched.id, matched.name];
};

export const juejinTagFind = async (cookie_str, tag_name) => {
  try {
    const res = await fetch(
      JUEJIN_API_BASE + "/tag_api/v1/query_tag_list",
      {
        method: "POST",
        headers: {
          ...JUEJIN_HEADERS,
          Cookie: cookie_str,
        },
        body: JSON.stringify({
          key_word: tag_name,
          page_no: 1,
          page_size: 10,
        }),
      },
    );

    if (!res.ok) return null;
    const json = await res.json();
    if (json.err_no !== 0 || !Array.isArray(json.data) || json.data.length === 0) {
      return null;
    }

    const clean = tag_name.trim().toLowerCase(),
      exact = json.data.find(
        (t) => t.tag?.tag_name?.toLowerCase() === clean,
      ),
      target = exact ?? json.data[0];

    if (!target) return null;

    return {
      id: String(target.tag_id ?? target.tag?.tag_id),
      name: target.tag?.tag_name ?? tag_name,
    };
  } catch {
    return null;
  }
};

export const juejinTagsResolve = async (cookie_str, tags_input) => {
  const raw_tag_li = Array.isArray(tags_input)
    ? tags_input
    : typeof tags_input === "string"
      ? tags_input.split(",").map((s) => s.trim()).filter(Boolean)
      : [];

  const candidate_tag_li = raw_tag_li.length > 0 ? raw_tag_li : ["Rust", "后端"],
    tag_id_li = [],
    tag_name_li = [],
    seen_id_set = new Set();

  for (let i = 0; i < candidate_tag_li.length; ++i) {
    if (tag_id_li.length >= 2) break;
    const found = await juejinTagFind(cookie_str, candidate_tag_li[i]);
    if (found && !seen_id_set.has(found.id)) {
      seen_id_set.add(found.id);
      tag_id_li.push(found.id);
      tag_name_li.push(found.name);
    }
  }

  // Fallback if none matched
  if (tag_id_li.length === 0) {
    const default_tag = await juejinTagFind(cookie_str, "Rust");
    if (default_tag) {
      tag_id_li.push(default_tag.id);
      tag_name_li.push(default_tag.name);
    }
  }

  return [tag_id_li, tag_name_li];
};

export default juejinCategoryFind;
