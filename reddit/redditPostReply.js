import {
  CODE_ERR_AUTH_FAIL,
  CODE_ERR_COOKIE_DB,
  CODE_ERR_COOKIE_EMPTY,
  CODE_ERR_POST_FAIL,
  CODE_ERR_RATELIMIT,
  CODE_ERR_SEARCH_FAIL,
  CODE_OK,
  REDDIT_HOST,
} from "./constant.js";
import { cookieRead } from "../src/cookieRead.js";
import { redditSessionVerify } from "./redditSessionVerify.js";
import { redditSearch } from "./redditSearch.js";
import { redditPostFetch } from "./redditPostFetch.js";
import { redditCommentAdd } from "./redditCommentAdd.js";
import { postsYmlRecord, redditRepliedCheck } from "./postsYmlRecord.js";
import { fixrsReplyGenerate } from "./fixrsReplyGenerate.js";

const DEFAULT_SUBS = ["rust", "learnrust"],
  DEFAULT_QUERIES = [
    "clippy restriction",
    "clippy absolute_paths",
    "pedantic",
    "cargo clippy",
    "clippy fix",
  ],
  KEYWORDS_WEIGHT = [
    ["absolute_paths", 20],
    ["restriction", 15],
    ["pedantic", 10],
    ["clippy", 6],
    ["bacon", 6],
    ["refactor", 5],
    ["cargo fix", 5],
    ["import", 4],
    ["paths", 4],
    ["lint", 3],
  ];

const postScoreCalculate = (post) => {
  const content = (post.title + " " + post.selftext).toLowerCase(),
    now_sec = Date.now() / 1000,
    age_days = Math.max(1, (now_sec - (post.created_utc ?? now_sec)) / 86400);

  let score = 0;
  for (let i = 0; i < KEYWORDS_WEIGHT.length; ++i) {
    const [word, weight] = KEYWORDS_WEIGHT[i];
    if (content.includes(word)) {
      score += weight * 10;
    }
  }

  // Recency bonus (prioritize posts from last 180 days)
  if (age_days <= 30) {
    score += 50;
  } else if (age_days <= 90) {
    score += 30;
  } else if (age_days <= 180) {
    score += 15;
  }

  return score;
};

export const redditPostReply = async (
  is_dry_run = false,
  target_post_id = null,
  custom_sub_li = null,
  custom_query_li = null,
  max_replies = 1,
  reply_generator = fixrsReplyGenerate,
) => {
  console.log("=== 正在读取本机 Chrome SQLite Cookies (Reddit) ===");
  const [cookie_code, cookie_str, cookie_map] = await cookieRead(REDDIT_HOST);

  if (cookie_code === CODE_ERR_COOKIE_DB) {
    console.error("[错误] 未找到 Chrome Cookies SQLite 数据库文件。");
    return [CODE_ERR_COOKIE_DB, [], "未找到 Chrome Cookie 数据库"];
  }

  if (cookie_code === CODE_ERR_COOKIE_EMPTY || !cookie_map.token_v2) {
    console.error(
      "[错误] 未在 Chrome 中找到 Reddit 的有效登录令牌，请在 Chrome 中登录 reddit.com。",
    );
    return [CODE_ERR_COOKIE_EMPTY, [], "未找到有效 Reddit Cookie 令牌"];
  }

  const bearer_token = cookie_map.token_v2;
  console.log("✓ 成功解密 Reddit Cookie，已提取 token_v2 认证凭证");

  console.log("\n=== 正在验证 Reddit 登录状态 ===");
  const [auth_code, username] = await redditSessionVerify(bearer_token);

  if (auth_code !== CODE_OK || !username) {
    console.error(
      "[错误] 登录验证失败，Cookie 可能已过期，请在 Chrome 中重新登录 Reddit。",
    );
    return [CODE_ERR_AUTH_FAIL, [], "登录验证失败"];
  }

  console.log("✓ 当前登录用户: u/" + username);

  let candidate_li = [];

  if (target_post_id) {
    console.log("\n=== 正在获取指定帖子详情: " + target_post_id + " ===");
    const [fetch_code, post_info, err_msg] = await redditPostFetch(
      target_post_id,
      bearer_token,
    );
    if (fetch_code !== CODE_OK || !post_info) {
      console.error("[错误] 获取帖子失败: " + err_msg);
      return [CODE_ERR_SEARCH_FAIL, [], err_msg];
    }
    candidate_li = [post_info];
  } else {
    const sub_li = custom_sub_li ?? DEFAULT_SUBS,
      query_li = custom_query_li ?? DEFAULT_QUERIES;

    console.log("\n=== 正在检索相关讨论帖子 ===");
    console.log("目标板块: " + sub_li.map((s) => "r/" + s).join(", "));
    console.log("搜索词组: " + query_li.join(" | "));

    const [search_code, found_li] = await redditSearch(
      sub_li,
      query_li,
      10,
      bearer_token,
    );

    if (search_code !== CODE_OK) {
      console.error("[错误] 搜索帖子失败。");
      return [CODE_ERR_SEARCH_FAIL, [], "搜索帖子失败"];
    }

    console.log("✓ 共检索到 " + found_li.length + " 条候选帖子");

    const filtered_li = [];
    for (let i = 0; i < found_li.length; ++i) {
      const p = found_li[i],
        is_replied = await redditRepliedCheck(p.id);
      if (!is_replied) {
        filtered_li.push(p);
      }
    }

    filtered_li.sort((a, b) => postScoreCalculate(b) - postScoreCalculate(a));
    candidate_li = filtered_li.slice(0, max_replies);
  }

  if (candidate_li.length === 0) {
    console.log("未找到可回复的新帖子（可能均已回复或被锁定）。");
    return [CODE_OK, [], "无匹配帖子"];
  }

  const success_li = [];

  for (let i = 0; i < candidate_li.length; ++i) {
    const post = candidate_li[i],
      reply_text = reply_generator(post);

    if (reply_text.includes("http://") || reply_text.includes("https://")) {
      console.warn("⚠️ 警告: 回复内容包含超链接，根据要求已过滤链接。");
    }

    console.log("\n----------------------------------------");
    console.log("目标帖子: [" + post.subreddit + "] " + post.title);
    console.log("帖子链接: " + post.url);
    console.log("发帖作者: u/" + post.author);
    console.log("\n--- 生成的回复内容 ---");
    console.log(reply_text);
    console.log("----------------------------------------");

    if (is_dry_run) {
      console.log(
        "[Dry-run 预览模式] 未执行实际评论。如需正式发布，请去掉 --dry-run 参数。",
      );
      success_li.push({
        post_id: post.id,
        post_url: post.url,
        comment_url: "",
        dry_run: true,
      });
      continue;
    }

    console.log("正在向帖子提交回复...");
    const [post_code, comment_url, comment_id] = await redditCommentAdd(
      bearer_token,
      post.name,
      reply_text,
    );

    if (post_code === CODE_OK) {
      console.log("🎉 回复发表成功！");
      console.log("评论链接: " + comment_url);

      await postsYmlRecord({
        subreddit: post.subreddit,
        post_id: post.id,
        post_title: post.title,
        post_url: post.url,
        comment_url,
        comment_id,
        comment_body: reply_text,
      });

      success_li.push({
        post_id: post.id,
        post_url: post.url,
        comment_url,
        comment_id,
      });
    } else {
      console.error("[错误] 回复发表失败: " + comment_id);
      if (post_code === CODE_ERR_RATELIMIT) {
        console.warn("触发频率限制，停止后续发帖。");
        break;
      }
    }
  }

  return [CODE_OK, success_li, "success"];
};

export default redditPostReply;
