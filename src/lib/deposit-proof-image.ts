const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX_BYTES = 3 * 1024 * 1024;

export function validateDepositProofImageDataUrl(
  dataUrl: string
): { ok: true } | { ok: false; error: string } {
  if (!dataUrl.startsWith("data:image/")) {
    return { ok: false, error: "Invalid image format" };
  }

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    return { ok: false, error: "Malformed image data" };
  }

  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "Only JPG, PNG, WEBP, and GIF images are allowed" };
  }

  const b64 = match[2];
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((b64.length * 3) / 4) - padding;

  if (bytes > MAX_BYTES) {
    return { ok: false, error: "Image must be under 3 MB" };
  }

  if (bytes < 100) {
    return { ok: false, error: "Image file is too small or corrupt" };
  }

  return { ok: true };
}
