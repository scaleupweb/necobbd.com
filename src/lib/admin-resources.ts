import "server-only";
import { ZodTypeAny } from "zod";
import { Role } from "@/types";
import { AdminResource } from "@/lib/db";
import { ADMIN_ONLY, TOURNAMENT_STAFF } from "@/lib/auth";
import { ClubSchema, TournamentSchema, TournamentBaseSchema, EventSchema, NewsSchema, PartnerSchema, SponsorSchema, LeaderSchema, RefereeSchema } from "@/lib/validation";

export const ADMIN_RESOURCES: Record<AdminResource, { schema: ZodTypeAny; partial: ZodTypeAny; roles: Role[]; label: string }> = {
  clubs: { schema: ClubSchema, partial: ClubSchema.partial(), roles: ADMIN_ONLY, label: "club" },
  tournaments: { schema: TournamentSchema, partial: TournamentBaseSchema.partial(), roles: TOURNAMENT_STAFF, label: "tournament" },
  events: { schema: EventSchema, partial: EventSchema.partial(), roles: TOURNAMENT_STAFF, label: "event" },
  news: { schema: NewsSchema, partial: NewsSchema.partial(), roles: ADMIN_ONLY, label: "news article" },
  partners: { schema: PartnerSchema, partial: PartnerSchema.partial(), roles: ADMIN_ONLY, label: "partner" },
  sponsors: { schema: SponsorSchema, partial: SponsorSchema.partial(), roles: ADMIN_ONLY, label: "sponsor" },
  leaders: { schema: LeaderSchema, partial: LeaderSchema.partial(), roles: ADMIN_ONLY, label: "team member" },
  referees: { schema: RefereeSchema, partial: RefereeSchema.partial(), roles: ADMIN_ONLY, label: "match official" },
};

export function isAdminResource(r: string): r is AdminResource {
  return r in ADMIN_RESOURCES;
}

/** Drop keys the client didn't send so partial updates don't reset fields to their defaults. */
export function onlySent(parsed: Record<string, any>, raw: Record<string, any>) {
  const out: Record<string, any> = {};
  for (const k of Object.keys(parsed)) if (k in raw) out[k] = parsed[k];
  return out;
}
