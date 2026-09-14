import {
  CODE_ERR_CATEGORY_FAIL,
  CODE_OK,
  RUSTCC_BASE,
  RUSTCC_HEADERS,
  RUSTCC_TARGET_CATEGORY,
} from "./constant.js";

export const rustccCategoryList = async (cookie_str) => {
  const res = await fetch(RUSTCC_BASE + "/p/article/create", {
    headers: {
      ...RUSTCC_HEADERS,
      Cookie: cookie_str,
    },
  });

  if (!res.ok) {
    return [CODE_ERR_CATEGORY_FAIL, []];
  }

  const html = await res.text(),
    select_match = html.match(/<select name="section_id">([\s\S]*?)<\/select>/);

  if (!select_match) {
    return [CODE_ERR_CATEGORY_FAIL, []];
  }

  const category_li = Array.from(
    select_match[1].matchAll(
      /<option value\s*=\s*"([^"]+)"[^>]*>([^<]+)<\/option>/g,
    ),
    (m) => ({
      id: m[1].trim(),
      name: m[2].replaceAll("&#x2F;", "/").replaceAll("&amp;", "&").trim(),
    }),
  );

  return [CODE_OK, category_li];
};

export const rustccCategoryFind = async (
  cookie_str,
  target_name = RUSTCC_TARGET_CATEGORY,
) => {
  const [cat_code, category_li] = await rustccCategoryList(cookie_str);
  if (cat_code !== CODE_OK) {
    return [CODE_ERR_CATEGORY_FAIL, "", ""];
  }

  const matched = category_li.find(
    (cat) => cat.name === target_name || cat.id === target_name,
  );

  if (!matched) {
    return [CODE_ERR_CATEGORY_FAIL, "", ""];
  }

  return [CODE_OK, matched.id, matched.name];
};

export default rustccCategoryFind;
