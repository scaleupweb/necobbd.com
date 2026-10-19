import "server-only";
import { cache } from "react";
import { db } from "@/lib/db";

/** Site settings, loaded once per request. */
export const getSiteSettings = cache(() => db.getSiteSettings());
