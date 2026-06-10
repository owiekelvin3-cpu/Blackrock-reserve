const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_BYTES = 350_000;

export function validateProfileImageDataUrl(dataUrl: string): { ok: true } | { ok: false; error: string } {
  if (!dataUrl.startsWith("data:image/")) {
    return { ok: false, error: "Invalid image format" };
  }

  const match = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(dataUrl);
  if (!match) {
    return { ok: false, error: "Malformed image data" };
  }

  const mime = match[1].toLowerCase();
  if (!ALLOWED_MIME.has(mime)) {
    return { ok: false, error: "Only JPG, PNG, and WEBP images are allowed" };
  }

  const b64 = match[2];
  const padding = b64.endsWith("==") ? 2 : b64.endsWith("=") ? 1 : 0;
  const bytes = Math.floor((b64.length * 3) / 4) - padding;

  if (bytes > MAX_BYTES) {
    return { ok: false, error: "Image must be under 350 KB after compression" };
  }

  if (bytes < 100) {
    return { ok: false, error: "Image file is too small or corrupt" };
  }

  return { ok: true };
}

/** Client-side: load file, center-crop square, compress to WebP */
export async function processProfileImageFile(
  file: File,
  zoom = 1,
  offsetX = 0,
  offsetY = 0
): Promise<string> {
  if (!ALLOWED_MIME.has(file.type)) {
    throw new Error("Only JPG, PNG, and WEBP images are allowed");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("File must be under 5 MB");
  }

  const bitmap = await createImageBitmap(file);
  const size = 400;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");

  const minDim = Math.min(bitmap.width, bitmap.height);
  const cropSize = minDim / zoom;
  const sx = (bitmap.width - cropSize) / 2 + offsetX;
  const sy = (bitmap.height - cropSize) / 2 + offsetY;

  ctx.drawImage(bitmap, sx, sy, cropSize, cropSize, 0, 0, size, size);
  bitmap.close();

  let quality = 0.88;
  let dataUrl = canvas.toDataURL("image/webp", quality);

  while (dataUrl.length > MAX_BYTES * 1.37 && quality > 0.4) {
    quality -= 0.08;
    dataUrl = canvas.toDataURL("image/webp", quality);
  }

  const check = validateProfileImageDataUrl(dataUrl);
  if (!check.ok) throw new Error(check.error);

  return dataUrl;
}

export function getInitials(name?: string | null): string {
  if (!name?.trim()) return "?";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
