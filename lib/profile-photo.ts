/** Soft Launch: compress a picked image into a small data URL for local/profile storage. */

const MAX_EDGE = 480;
const MAX_BYTES = 380_000;

export async function fileToProfilePhotoDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error("not-image");
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("canvas");
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.85;
  let dataUrl = canvas.toDataURL("image/jpeg", quality);
  while (dataUrl.length > MAX_BYTES && quality > 0.45) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL("image/jpeg", quality);
  }
  if (dataUrl.length > MAX_BYTES) {
    throw new Error("too-large");
  }
  return dataUrl;
}
