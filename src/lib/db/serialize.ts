import { isValidObjectId } from "mongoose";

/** Convert a lean Mongo document (or array) into plain JSON with `id` instead of `_id`. */
export function plain<T = any>(doc: any): T {
  if (doc === null || doc === undefined) return doc;
  const json = JSON.parse(JSON.stringify(doc));
  return renameIds(json);
}

function renameIds(v: any): any {
  if (Array.isArray(v)) return v.map(renameIds);
  if (v && typeof v === "object") {
    const out: Record<string, any> = {};
    for (const [k, val] of Object.entries(v)) {
      if (k === "_id") out.id = val;
      // `legacy` is old-site import data, read only from raw documents on the server.
      else if (k === "__v" || k === "passwordHash" || k === "passwordResetTokenHash" || k === "legacy") continue;
      else out[k] = renameIds(val);
    }
    return out;
  }
  return v;
}

export function isId(v: unknown): v is string {
  return typeof v === "string" && isValidObjectId(v) && /^[a-f0-9]{24}$/i.test(v);
}

export function slugify(text: string): string {
  return (
    text
      .toString()
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "item"
  );
}

export function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export const PLACEHOLDER = {
  avatar: "/images/placeholders/avatar.svg",
  club: "/images/placeholders/club.svg",
  banner: "/images/placeholders/banner.svg",
  news: "/images/placeholders/banner.svg",
  logo: "/images/placeholders/club.svg",
};
