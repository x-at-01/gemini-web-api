#!/usr/bin/env -S bun
import { join } from "node:path";

try {
  process.loadEnvFile(join(import.meta.dirname, ".env"));
} catch (err) {
  if (err.code !== "ENOENT") throw err;
}

import { sessionInit } from "./src/sessionState.js";
import { serverStart } from "./src/serverStart.js";

export {
  API_KEY,
  BROWSER_PATH_LI,
  CORS_HEADERS,
  DEFAULT_MODEL_LI,
  ENABLE_THINKING,
  ERR_MISSING_URL,
  ERR_NOT_FOUND,
  ERR_UNAUTHORIZED,
  HOST,
  INIT_URL,
  PORT,
  ROLE_ASSISTANT,
  ROLE_SYSTEM,
  ROLE_TOOL,
  ROLE_USER,
  STATUS_BAD_REQUEST,
  STATUS_NO_CONTENT,
  STATUS_NOT_FOUND,
  STATUS_OK,
  STATUS_SERVER_ERR,
  STOP_REASON_STOP,
  STOP_REASON_TOOL_CALLS,
  TOOL_FENCE_CLOSE,
  TOOL_FENCE_OPEN,
  USER_AGENT,
} from "./src/constant.js";

export { cookieRead, keychainPwdRead, valDecrypt } from "./src/cookieRead.js";
export { sessionInit, session_state } from "./src/sessionState.js";
export {
  modelFetch,
  modelListFormat,
  modelListPrint,
  modelMap,
  stringPadEnd,
  stringVisualWidth,
  versionCompare,
} from "./src/modelDiscover.js";
export {
  jsonFormat,
  toolCallExtract,
  toolFenceGateCreate,
  toolPromptBuild,
  toolResultFormat,
} from "./src/toolHandle.js";
export { conversationFormat, payloadBuild } from "./src/payloadBuild.js";
export { fullResponseCollect, streamChunkExtract } from "./src/streamExtract.js";
export { sseStreamCreate } from "./src/sseResponse.js";
export {
  authVerify,
  chatCompletionsHandle,
  healthHandle,
  imageProxyHandle,
  modelDetailHandle,
  modelListHandle,
  reqHandle,
} from "./src/router.js";
export { serverStart } from "./src/serverStart.js";

await sessionInit();

const server = serverStart();

export default server;
