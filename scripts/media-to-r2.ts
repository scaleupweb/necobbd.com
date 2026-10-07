/**
 * Moves uploaded images from MongoDB to Cloudflare R2 (key media/<id>), so they
 * stop using database space. Old /api/media/<id> links keep working: that route
 * redirects to R2 once the image is no longer in MongoDB.
 *
 *   npm run media:to-r2              dry run: what is where, nothing changes
 *   npm run media:to-r2 -- --upload  copy every image to R2 (skips ones already there)
 *   npm run media:to-r2 -- --delete  remove from MongoDB only images whose R2 copy is verified
 */
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });
config({ path: ".env" });

const mb = (n: number) => `${(n / 1e6).toFixed(1)} MB`;

/** Retries flaky network calls (slow or dropped connections) a few times before giving up. */
async function retry<T>(fn: () => Promise<T>, tries = 4): Promise<T> {
  for (let i = 1; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= tries) throw e;
      await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
}

async function main() {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_URL is not set");
  const { r2Enabled, r2Put, r2Size, r2PublicUrl, mediaKey } = await import("../src/lib/r2");
  if (!r2Enabled()) throw new Error("Set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET and R2_PUBLIC_URL in .env first");
  const upload = process.argv.includes("--upload");
  const remove = process.argv.includes("--delete");

  await mongoose.connect(uri);
  const media = mongoose.connection.db!.collection("media");
  const ids = (await retry(() => media.find({}, { projection: { _id: 1 } }).toArray())).map((m) => m._id);
  console.log(`${ids.length} images in MongoDB`);

  let inR2 = 0, uploaded = 0, deleted = 0, failed = 0, freed = 0;
  for (const [i, _id] of ids.entries()) {
    let m: any;
    try {
      m = await retry(() => media.findOne({ _id }));
    } catch (e: any) {
      failed++;
      console.error(`[${i + 1}/${ids.length}] ${String(_id)} could not be read: ${e.message}`);
      continue;
    }
    if (!m) continue;
    const id = String(_id);
    const key = mediaKey(id);
    const data: Buffer = Buffer.isBuffer(m.data) ? m.data : Buffer.from(m.data.buffer ?? m.data);
    const tag = `[${i + 1}/${ids.length}] ${id} (${Math.round(data.length / 1024)} KB)`;
    try {
      let size = await retry(() => r2Size(key));
      if (size !== data.length && upload) {
        await retry(() => r2Put(key, new Uint8Array(data), m.contentType || "image/jpeg"));
        size = await retry(() => r2Size(key));
        if (size === data.length) uploaded++;
      }
      const safe = size === data.length;
      if (safe) inR2++;
      if (remove) {
        if (!safe) {
          console.warn(`${tag} not in R2 yet — kept in MongoDB`);
          continue;
        }
        await retry(() => media.deleteOne({ _id }));
        deleted++;
        freed += data.length;
      }
      if (upload && !remove) console.log(`${tag} ${safe ? "in R2" : "UPLOAD FAILED (size mismatch)"}`);
    } catch (e: any) {
      failed++;
      console.error(`${tag} error: ${e.message}`);
    }
  }

  console.log(`\nVerified in R2: ${inR2}/${ids.length} · uploaded now: ${uploaded} · errors: ${failed}`);
  if (remove) console.log(`Removed from MongoDB: ${deleted} (${mb(freed)})`);
  if (!upload && !remove) console.log("Dry run — nothing changed. Use --upload, then --delete.");
  if (inR2) console.log(`Example: ${r2PublicUrl(mediaKey(String(ids[0])))}`);
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e.message || e);
  await mongoose.disconnect();
  process.exit(1);
});
