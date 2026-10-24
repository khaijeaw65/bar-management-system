const LONG_SIDE = 1280;

export async function resizeSlipImage(source: HTMLVideoElement | Blob): Promise<string> {
  const bitmap = source instanceof Blob ? await createImageBitmap(source) : null;
  const width = bitmap?.width ?? (source instanceof HTMLVideoElement ? source.videoWidth : 0);
  const height = bitmap?.height ?? (source instanceof HTMLVideoElement ? source.videoHeight : 0);
  if (!width || !height) throw new Error("empty frame");
  const scale = Math.min(1, LONG_SIDE / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas");
  const frame = bitmap ?? source;
  if (!(frame instanceof HTMLVideoElement) && !(frame instanceof ImageBitmap)) throw new Error("empty frame");
  context.drawImage(frame, 0, 0, canvas.width, canvas.height);
  bitmap?.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.8));
  if (!blob) throw new Error("jpeg");
  const bytes = new Uint8Array(await blob.arrayBuffer());
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
