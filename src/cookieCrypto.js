import {
  AES_IV_LEN,
  AES_KEY_LEN,
  HEADER_PAD_LEN,
  PBKDF2_ITERATIONS,
  PBKDF2_SALT,
} from "./constant.js";

const PREFIX_V10 = [118, 49, 48];

export const aesKeyDerive = async (pwd) => {
  const encoder = new TextEncoder(),
    base_key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(pwd),
      "PBKDF2",
      false,
      ["deriveKey"],
    );
  return await crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: encoder.encode(PBKDF2_SALT),
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-1",
    },
    base_key,
    { name: "AES-CBC", length: AES_KEY_LEN * 8 },
    false,
    ["decrypt"],
  );
};

export const cookieValDecrypt = async (aes_key, enc_buf) => {
  if (!enc_buf || enc_buf.length === 0) return "";
  const raw = new Uint8Array(enc_buf);
  if (raw.length < 3) return "";

  if (
    raw[0] !== PREFIX_V10[0] ||
    raw[1] !== PREFIX_V10[1] ||
    raw[2] !== PREFIX_V10[2]
  ) {
    return new TextDecoder().decode(raw);
  }

  const cipher_bytes = raw.subarray(3),
    iv = new Uint8Array(AES_IV_LEN).fill(0x20),
    dec_buf = await crypto.subtle.decrypt(
      { name: "AES-CBC", iv },
      aes_key,
      cipher_bytes,
    ),
    dec_bytes = new Uint8Array(dec_buf),
    content_bytes =
      dec_bytes.length > HEADER_PAD_LEN
        ? dec_bytes.subarray(HEADER_PAD_LEN)
        : dec_bytes;

  return new TextDecoder().decode(content_bytes);
};
