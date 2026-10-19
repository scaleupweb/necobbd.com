import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { z } from "zod";
import { ok, handle, limit, parseBody } from "@/lib/api";
import { facebookPostLink } from "@/lib/validation";

const JoinSchema = z.object({ postLink: facebookPostLink });

/** POST { postLink } = apply to join the tournament, DELETE = withdraw (while registration is open). */
export const POST = handle(async (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const session = await requireAuth();
  limit(req, `join:${session.id}`, 30, 60 * 60 * 1000);
  const { slug } = await params;
  // Clubs prove the registration with their Facebook post; admins check it before approving.
  const { postLink } = await parseBody(req, JoinSchema);
  const t = await db.joinTournament(slug, session.id, postLink);
  return ok({ currentParticipants: t?.currentParticipants, joined: true });
});

export const DELETE = handle(async (req: NextRequest, { params }: { params: Promise<{ slug: string }> }) => {
  const session = await requireAuth();
  limit(req, `join:${session.id}`, 30, 60 * 60 * 1000);
  const { slug } = await params;
  const t = await db.leaveTournament(slug, session.id);
  return ok({ currentParticipants: t?.currentParticipants, joined: false });
});
