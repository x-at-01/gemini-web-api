import {
  BROWSER_HEADERS,
  CODE_ERR_CATEGORY_FAIL,
  CODE_OK,
  FORUM_BASE,
  TARGET_CATEGORY_SLUG,
} from "./constant.js";

export const forumCategoryFind = async (
  target_slug = TARGET_CATEGORY_SLUG,
) => {
  const res = await fetch(FORUM_BASE + "/categories.json", {
    headers: BROWSER_HEADERS,
  });

  if (!res.ok) {
    return [CODE_ERR_CATEGORY_FAIL, 0, ""];
  }

  const data = await res.json(),
    category_li = data?.category_list?.categories ?? [],
    matched = category_li.find(
      (cat) => cat.slug === target_slug || cat.name === target_slug,
    );

  if (!matched) {
    return [CODE_ERR_CATEGORY_FAIL, 0, ""];
  }

  return [CODE_OK, matched.id, matched.name];
};

export default forumCategoryFind;
