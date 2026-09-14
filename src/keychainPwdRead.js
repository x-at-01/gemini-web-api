import { KEYCHAIN_ACCOUNT, KEYCHAIN_SERVICE } from "./constant.js";

export const keychainPwdRead = () => {
  const proc = Bun.spawnSync([
    "security",
    "find-generic-password",
    "-w",
    "-s",
    KEYCHAIN_SERVICE,
    "-a",
    KEYCHAIN_ACCOUNT,
  ]);
  return proc.stdout.toString().trim();
};

export default keychainPwdRead;
