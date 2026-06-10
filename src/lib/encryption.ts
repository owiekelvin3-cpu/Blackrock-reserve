import crypto from "crypto";

const ALGO = "aes-256-gcm";

function getEncryptionKey(): Buffer {
  const secret =
    process.env.ENCRYPTION_KEY?.trim() ||
    process.env.NEXTAUTH_SECRET?.trim() ||
    "blackrock-reserve-dev-encryption-key";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSensitive(value: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString("base64");
}

export function decryptSensitive(payload: string): string {
  const buf = Buffer.from(payload, "base64");
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = crypto.createDecipheriv(ALGO, getEncryptionKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString("utf8");
}

export function hashSensitive(value: string): string {
  return crypto.createHmac("sha256", getEncryptionKey()).update(value).digest("hex");
}

export function maskSensitive(value: string, visibleTail = 4): string {
  if (value.length <= visibleTail) return "•".repeat(value.length);
  return "•".repeat(value.length - visibleTail) + value.slice(-visibleTail);
}
