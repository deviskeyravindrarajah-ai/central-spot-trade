import { supabase } from "@/integrations/supabase/client";
import { MAX_VIDEO_SECONDS } from "./constants";

export const MEDIA_BUCKET = "listing-media";

const signedUrlCache = new Map<string, { url: string; expiresAt: number }>();
const SIGN_TTL_SECONDS = 60 * 60;

/** Resolves storage paths to signed, displayable URLs (cached in-memory). */
export async function resolveMediaUrls(paths: string[]): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const now = Date.now();
  const missing: string[] = [];

  for (const path of paths) {
    if (!path) continue;
    if (path.startsWith("http")) {
      result[path] = path;
      continue;
    }
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > now) {
      result[path] = cached.url;
    } else {
      missing.push(path);
    }
  }

  if (missing.length > 0) {
    const { data, error } = await supabase.storage
      .from(MEDIA_BUCKET)
      .createSignedUrls(missing, SIGN_TTL_SECONDS);
    if (!error && data) {
      for (const entry of data) {
        if (entry.signedUrl && entry.path) {
          signedUrlCache.set(entry.path, {
            url: entry.signedUrl,
            expiresAt: now + (SIGN_TTL_SECONDS - 120) * 1000,
          });
          result[entry.path] = entry.signedUrl;
        }
      }
    }
  }

  return result;
}

/** Client-side image compression: resizes to max 1280px and re-encodes as JPEG. */
export async function compressImage(file: File, maxDimension = 1280, quality = 0.75): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/jpeg", quality),
  );
  return blob ?? file;
}

/** Reads a video file's duration in seconds without uploading it. */
export function getVideoDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.preload = "metadata";
    const objectUrl = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(video.duration);
    };
    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not read this video file."));
    };
    video.src = objectUrl;
  });
}

export function isVideoTooLong(durationSeconds: number): boolean {
  return durationSeconds > MAX_VIDEO_SECONDS + 0.5;
}

/** Uploads a blob into the signed-in user's folder and returns its storage path. */
export async function uploadMedia(userId: string, blob: Blob, extension: string): Promise<string> {
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from(MEDIA_BUCKET).upload(path, blob, {
    contentType: blob.type || undefined,
    upsert: false,
  });
  if (error) throw error;
  return path;
}
