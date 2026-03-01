import { SALT } from "../types";

export async function deriveKey(roomKey: string): Promise<CryptoKey> {
  const raw = new TextEncoder().encode(rawKey(roomKey));
  const base = await crypto.subtle.importKey("raw", raw, "HKDF", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    {
      name: "HKDF",
      hash: "SHA-256",
      salt: new TextEncoder().encode(SALT),
      info: new TextEncoder().encode("file-encryption"),
    },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptChunk(
  key: CryptoKey,
  buffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    buffer,
  );
  const out = new Uint8Array(12 + encrypted.byteLength);
  out.set(iv, 0);
  out.set(new Uint8Array(encrypted), 12);
  return out.buffer;
}

export async function decryptChunk(
  key: CryptoKey,
  buffer: ArrayBuffer,
): Promise<ArrayBuffer> {
  const iv = buffer.slice(0, 12);
  const ciphertext = buffer.slice(12);
  return crypto.subtle.decrypt(
    { name: "AES-GCM", iv: new Uint8Array(iv) },
    key,
    ciphertext,
  );
}

export function rawKey(key: string): string {
  return key.replace(/-/g, "").toUpperCase();
}
