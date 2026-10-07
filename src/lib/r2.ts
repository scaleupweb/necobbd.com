import { AwsClient } from "aws4fetch";

/**
 * Cloudflare R2 (S3-compatible) storage for uploaded images. Files live at
 * `media/<id>` and are served from the bucket's public URL, so they take no
 * space in MongoDB. Enabled when all R2_* variables are set.
 */
const env = () => ({
  accountId: process.env.R2_ACCOUNT_ID || "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  bucket: process.env.R2_BUCKET || "",
  publicUrl: (process.env.R2_PUBLIC_URL || "").replace(/\/+$/, ""),
});

export function r2Enabled() {
  const e = env();
  return !!(e.accountId && e.accessKeyId && e.secretAccessKey && e.bucket && e.publicUrl);
}

let client: AwsClient | null = null;
function r2() {
  const e = env();
  client ??= new AwsClient({ accessKeyId: e.accessKeyId, secretAccessKey: e.secretAccessKey, service: "s3", region: "auto" });
  return { client, url: (key: string) => `https://${e.accountId}.r2.cloudflarestorage.com/${e.bucket}/${key}` };
}

export const mediaKey = (id: string) => `media/${id}`;

/** Public URL of a stored file. */
export const r2PublicUrl = (key: string) => `${env().publicUrl}/${key}`;

export async function r2Put(key: string, body: Uint8Array, contentType: string) {
  const { client, url } = r2();
  const res = await client.fetch(url(key), {
    method: "PUT",
    body: body as unknown as BodyInit,
    headers: { "Content-Type": contentType, "Cache-Control": "public, max-age=31536000, immutable" },
  });
  if (!res.ok) throw new Error(`R2 upload failed (${res.status}): ${(await res.text()).slice(0, 200)}`);
}

/** Size in bytes of a stored file, or null when it doesn't exist. */
export async function r2Size(key: string): Promise<number | null> {
  const { client, url } = r2();
  const res = await client.fetch(url(key), { method: "HEAD" });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`R2 check failed (${res.status})`);
  return Number(res.headers.get("content-length") || 0);
}
