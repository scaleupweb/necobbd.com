import "server-only";
import { Types } from "mongoose";
import { connectDB } from "./mongo";
import {
  User,
  Player,
  Club,
  Tournament,
  Fixture,
  Referee,
  TransferListing,
  TransferRequest,
  TransferHistory,
  Disciplinary,
  Activity,
  AuditLog,
  Notification,
  News,
  Event,
  Partner,
  Sponsor,
  Leader,
  Setting,
  Media,
} from "./models";
import { plain, isId, slugify, escapeRegex, PLACEHOLDER } from "./serialize";
import { calculateNewRating, updateFormHistory } from "../ranking/engine";
import { calculatePlayerMarketValue } from "../valuation/engine";
import { DEFAULT_SITE_SETTINGS, mergeSettings, SiteSettings } from "../site-settings";

export { isId, slugify };

export class ServiceError extends Error {
  status: number;
  code: string;
  constructor(message: string, status = 400, code = "BAD_REQUEST") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const oid = (id: string) => new Types.ObjectId(id);

async function uniqueSlug(model: any, base: string, excludeId?: string): Promise<string> {
  const root = slugify(base);
  let slug = root;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const q: any = { slug };
    if (excludeId) q._id = { $ne: excludeId };
    const exists = await model.exists(q);
    if (!exists) return slug;
    n += 1;
    slug = `${root}-${n}`;
  }
}

function formArray(s?: string): string[] {
  return s ? s.split(",").filter(Boolean) : [];
}

function winRate(wins: number, played: number) {
  return played > 0 ? Math.round((wins / played) * 1000) / 10 : 0;
}

// ---------------------------------------------------------------------------
// Shapers
// ---------------------------------------------------------------------------

type ClubMini = { id: string; name: string; shortName: string; slug: string; logo: string };

function clubMini(c: any): ClubMini | undefined {
  if (!c) return undefined;
  return { id: String(c._id), name: c.name, shortName: c.shortName, slug: c.slug, logo: c.logo || PLACEHOLDER.club };
}

async function clubMap(ids?: any[]): Promise<Map<string, any>> {
  const q = ids ? { _id: { $in: ids.filter(Boolean) } } : {};
  const clubs = await Club.find(q).lean();
  return new Map(clubs.map((c: any) => [String(c._id), c]));
}

function shapePlayer(p: any, clubs: Map<string, any>) {
  const s = p.stats || {};
  const club = p.clubId ? clubs.get(String(p.clubId)) : undefined;
  const endDate = p.contract?.endDate ? new Date(p.contract.endDate) : undefined;
  const out = plain<any>(p);
  return {
    ...out,
    avatar: p.avatar || PLACEHOLDER.avatar,
    clubId: p.clubId ? String(p.clubId) : undefined,
    form: formArray(p.formHistory),
    club: clubMini(club),
    stats: {
      matchesPlayed: s.matchesPlayed || 0,
      wins: s.wins || 0,
      draws: s.draws || 0,
      losses: s.losses || 0,
      winRate: winRate(s.wins || 0, s.matchesPlayed || 0),
      goalsScored: s.goalsScored || 0,
      goalsConceded: s.goalsConceded || 0,
      assists: s.assists || 0,
      cleanSheets: s.cleanSheets || 0,
      points: s.points || 0,
    },
    contract: {
      status: p.contract?.status || "FREE_AGENT",
      durationMonths: p.contract?.durationMonths || 0,
      endDate: endDate?.toISOString(),
      daysRemaining: endDate ? Math.max(0, Math.ceil((endDate.getTime() - Date.now()) / 86400000)) : 0,
    },
  };
}

function shapeClub(c: any, extra: { squadCount?: number; managerName?: string; squadValue?: number } = {}) {
  const s = c.stats || {};
  const out = plain<any>(c);
  return {
    ...out,
    logo: c.logo || PLACEHOLDER.club,
    banner: c.banner || PLACEHOLDER.banner,
    managerId: c.managerId ? String(c.managerId) : undefined,
    managerName: extra.managerName || "",
    form: formArray(c.formHistory),
    squadCount: extra.squadCount ?? 0,
    marketValue: Math.round(((extra.squadValue ?? 0) + (c.marketValue || 0)) * 10) / 10,
    stats: {
      matches: s.matches || 0,
      wins: s.wins || 0,
      draws: s.draws || 0,
      losses: s.losses || 0,
      winRate: winRate(s.wins || 0, s.matches || 0),
      goalsScored: s.goalsScored || 0,
      goalsConceded: s.goalsConceded || 0,
    },
  };
}

function liveMinute(f: any): string {
  if (f.status === "FINISHED") return "FT";
  if (f.status !== "LIVE" || !f.startedAt) return "";
  const mins = Math.floor((Date.now() - new Date(f.startedAt).getTime()) / 60000);
  return `${Math.min(Math.max(mins, 1), 120)}'`;
}

async function shapeFixtures(list: any[]) {
  if (!list.length) return [];
  const playerIds = new Set<string>();
  const clubIds = new Set<string>();
  const refIds = new Set<string>();
  const tournIds = new Set<string>();
  for (const f of list) {
    if (f.homePlayerId) playerIds.add(String(f.homePlayerId));
    if (f.awayPlayerId) playerIds.add(String(f.awayPlayerId));
    if (f.result?.motmPlayerId) playerIds.add(String(f.result.motmPlayerId));
    if (f.homeClubId) clubIds.add(String(f.homeClubId));
    if (f.awayClubId) clubIds.add(String(f.awayClubId));
    if (f.refereeId) refIds.add(String(f.refereeId));
    if (f.tournamentId) tournIds.add(String(f.tournamentId));
  }
  const [players, clubs, refs, tourns] = await Promise.all([
    Player.find({ _id: { $in: [...playerIds] } }).lean(),
    Club.find({ _id: { $in: [...clubIds] } }).lean(),
    Referee.find({ _id: { $in: [...refIds] } }).lean(),
    Tournament.find({ _id: { $in: [...tournIds] } }, { name: 1, slug: 1 }).lean(),
  ]);
  const pm = new Map(players.map((p: any) => [String(p._id), p]));
  const cm = new Map(clubs.map((c: any) => [String(c._id), c]));
  const rm = new Map(refs.map((r: any) => [String(r._id), r]));
  const tm = new Map(tourns.map((t: any) => [String(t._id), t]));

  const pMini = (id: any) => {
    const p = id ? pm.get(String(id)) : undefined;
    return p
      ? { id: String(p._id), username: p.username, fullName: p.fullName, avatar: p.avatar || PLACEHOLDER.avatar, rating: p.rating }
      : undefined;
  };
  const cMini = (id: any) => {
    const c = id ? cm.get(String(id)) : undefined;
    return c ? { id: String(c._id), name: c.name, shortName: c.shortName, slug: c.slug, logo: c.logo || PLACEHOLDER.club } : undefined;
  };

  return list.map((f: any) => {
    const t = f.tournamentId ? tm.get(String(f.tournamentId)) : undefined;
    const ref = f.refereeId ? rm.get(String(f.refereeId)) : undefined;
    const motm = f.result?.motmPlayerId ? pm.get(String(f.result.motmPlayerId)) : undefined;
    return {
      id: String(f._id),
      tournamentId: f.tournamentId ? String(f.tournamentId) : undefined,
      tournamentName: t?.name,
      tournamentSlug: t?.slug,
      round: f.round,
      scheduledDate: new Date(f.scheduledDate).toISOString(),
      venue: f.venue,
      status: f.status,
      startedAt: f.startedAt ? new Date(f.startedAt).toISOString() : undefined,
      minute: liveMinute(f),
      isOnStream: !!f.isOnStream,
      streamUrl: f.streamUrl || "",
      streamPlatform: f.streamPlatform || "",
      homeClub: cMini(f.homeClubId),
      awayClub: cMini(f.awayClubId),
      homePlayer: pMini(f.homePlayerId),
      awayPlayer: pMini(f.awayPlayerId),
      liveScore: { home: f.liveScore?.home || 0, away: f.liveScore?.away || 0 },
      result:
        f.result && f.result.status
          ? {
              homeScore: f.result.homeScore ?? 0,
              awayScore: f.result.awayScore ?? 0,
              homePenalties: f.result.homePenalties,
              awayPenalties: f.result.awayPenalties,
              motmPlayerId: f.result.motmPlayerId ? String(f.result.motmPlayerId) : undefined,
              motmPlayerName: motm?.fullName,
              motmPlayerAvatar: motm?.avatar,
              motmReason: f.result.motmReason,
              status: f.result.status,
              notes: f.result.notes,
              proofScreenshot: f.result.proofScreenshot,
            }
          : undefined,
      referee: ref ? { id: String(ref._id), name: ref.name, tier: ref.tier, rating: ref.rating } : undefined,
    };
  });
}

async function tournamentProgress(ids: string[]) {
  const agg = await Fixture.aggregate([
    { $match: { tournamentId: { $in: ids.map(oid) } } },
    {
      $group: {
        _id: "$tournamentId",
        total: { $sum: 1 },
        completed: { $sum: { $cond: [{ $eq: ["$status", "FINISHED"] }, 1, 0] } },
      },
    },
  ]);
  return new Map(agg.map((a: any) => [String(a._id), a]));
}

function shapeTournament(t: any, prog?: { total: number; completed: number }) {
  const isClub = t.participantType === "CLUB";
  const participants = (t.participants || []).filter((p: any) => p.status !== "REMOVED");
  const clubEntries = (t.clubParticipants || []).filter((c: any) => c.status !== "REMOVED");
  const count = isClub ? clubEntries.length : participants.length;
  const total = prog?.total || Math.max((t.maxParticipants || 2) - 1, 0);
  const completed = prog?.completed || 0;
  const deadline = t.registrationDeadline ? new Date(t.registrationDeadline) : undefined;
  const out = plain<any>({ ...t, participants: undefined, clubParticipants: undefined });
  return {
    ...out,
    participantType: isClub ? "CLUB" : "PLAYER",
    banner: t.banner || PLACEHOLDER.banner,
    logo: t.logo || PLACEHOLDER.logo,
    startDate: t.startDate ? new Date(t.startDate).toISOString() : "",
    endDate: t.endDate ? new Date(t.endDate).toISOString() : "",
    registrationDeadline: deadline ? deadline.toISOString() : "",
    currentParticipants: count,
    participantUserIds: participants.map((p: any) => String(p.userId)),
    participantClubIds: clubEntries.map((c: any) => String(c.clubId)),
    completedMatches: completed,
    totalMatches: total,
    progressPercent: total > 0 ? Math.round((completed / total) * 100) : 0,
    isRegistrationOpen:
      t.status === "REGISTRATION_OPEN" && (!deadline || deadline.getTime() > Date.now()) && count < (t.maxParticipants || 0),
  };
}

// ---------------------------------------------------------------------------
// Service
// ---------------------------------------------------------------------------

export const db = {
  // ----- Users -----
  async getUserByEmailOrUsername(emailOrUsername: string, withSecrets = false) {
    await connectDB();
    const v = emailOrUsername.toLowerCase().trim();
    const q = User.findOne({ $or: [{ email: v }, { username: v }] });
    if (withSecrets) q.select("+passwordHash");
    return q.lean<any>();
  },

  async getUserById(id: string) {
    if (!isId(id)) return null;
    await connectDB();
    return User.findById(id).lean<any>();
  },

  async createUser(data: { email: string; username: string; fullName: string; passwordHash: string; role?: string }) {
    await connectDB();
    const user = await User.create({ ...data, role: data.role || "PLAYER", status: "ACTIVE" });
    return user.toObject();
  },

  async recordLoginFailure(userId: any) {
    const u = await User.findById(userId);
    if (!u) return;
    u.failedLoginAttempts = (u.failedLoginAttempts || 0) + 1;
    if (u.failedLoginAttempts >= 5) {
      u.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
      u.failedLoginAttempts = 0;
    }
    await u.save();
  },

  async recordLoginSuccess(userId: any) {
    await User.updateOne({ _id: userId }, { $set: { failedLoginAttempts: 0, lastLoginAt: new Date() }, $unset: { lockUntil: 1 } });
  },

  async setPassword(userId: string, passwordHash: string) {
    await connectDB();
    await User.updateOne(
      { _id: userId },
      { $set: { passwordHash, failedLoginAttempts: 0 }, $inc: { tokenVersion: 1 }, $unset: { lockUntil: 1, passwordResetTokenHash: 1, passwordResetExpires: 1 } }
    );
  },

  async setPasswordResetToken(userId: any, tokenHash: string, expires: Date) {
    await User.updateOne({ _id: userId }, { $set: { passwordResetTokenHash: tokenHash, passwordResetExpires: expires } });
  },

  async getUserByResetToken(tokenHash: string) {
    await connectDB();
    return User.findOne({ passwordResetTokenHash: tokenHash, passwordResetExpires: { $gt: new Date() } }).lean<any>();
  },

  async listUsers(filter: { search?: string; role?: string; status?: string } = {}) {
    await connectDB();
    const q: any = {};
    if (filter.role && filter.role !== "ALL") q.role = filter.role;
    if (filter.status && filter.status !== "ALL") q.status = filter.status;
    if (filter.search) {
      const r = new RegExp(escapeRegex(filter.search), "i");
      q.$or = [{ email: r }, { username: r }, { fullName: r }];
    }
    const users = await User.find(q).sort({ createdAt: -1 }).limit(5000).lean();
    const clubs = await clubMap(users.map((u: any) => u.clubId));
    return users.map((u: any) => ({ ...plain<any>(u), club: clubMini(clubs.get(String(u.clubId))) }));
  },

  async updateUser(id: string, updates: Record<string, any>) {
    if (!isId(id)) throw new ServiceError("Invalid user id", 400);
    await connectDB();
    const set: any = { ...updates };
    const inc: any = {};
    // Any change to role/status forces the user to sign in again.
    if ("role" in updates || "status" in updates) inc.tokenVersion = 1;
    if (updates.clubId === "" || updates.clubId === null) {
      delete set.clubId;
      await User.updateOne({ _id: id }, { $unset: { clubId: 1 } });
    }
    const user = await User.findByIdAndUpdate(id, { $set: set, ...(Object.keys(inc).length ? { $inc: inc } : {}) }, { new: true }).lean();
    if (!user) throw new ServiceError("User not found", 404);
    if (updates.fullName || updates.avatar) {
      const pset: any = {};
      if (updates.fullName) pset.fullName = updates.fullName;
      if (updates.avatar) pset.avatar = updates.avatar;
      await Player.updateOne({ userId: id }, { $set: pset });
    }
    if ("status" in updates) {
      const map: Record<string, string> = { ACTIVE: "ACTIVE", SUSPENDED: "SUSPENDED", BANNED: "BANNED", INACTIVE: "INACTIVE", PENDING: "PENDING_VERIFICATION" };
      await Player.updateOne({ userId: id }, { $set: { status: map[updates.status] || "ACTIVE" } });
    }
    return plain(user);
  },

  async deleteUser(id: string) {
    if (!isId(id)) throw new ServiceError("Invalid user id", 400);
    await connectDB();
    const player = await Player.findOne({ userId: id }).lean<any>();
    if (player) {
      await Promise.all([
        Tournament.updateMany({}, { $pull: { participants: { userId: oid(id) } } }),
        Event.updateMany({}, { $pull: { registrations: { userId: oid(id) } } }),
        TransferListing.deleteMany({ playerId: player._id }),
        TransferRequest.deleteMany({ playerId: player._id }),
        Player.deleteOne({ _id: player._id }),
      ]);
    }
    await Club.updateMany({ managerId: id }, { $unset: { managerId: 1 } });
    await Notification.deleteMany({ userId: id });
    await User.deleteOne({ _id: id });
    return true;
  },

  // ----- Players -----
  async getPlayers(filter: { position?: string; clubId?: string; search?: string; status?: string; limit?: number } = {}) {
    await connectDB();
    const q: any = {};
    if (filter.position && filter.position !== "ALL") q.preferredPosition = filter.position;
    if (filter.clubId && filter.clubId !== "ALL" && isId(filter.clubId)) q.clubId = filter.clubId;
    if (filter.status && filter.status !== "ALL") q.status = filter.status;
    if (filter.search) {
      const r = new RegExp(escapeRegex(filter.search), "i");
      q.$or = [{ fullName: r }, { username: r }, { konamiId: r }];
    }
    const list = await Player.find(q).sort({ rating: -1 }).limit(filter.limit || 1000).lean();
    const clubs = await clubMap(list.map((p: any) => p.clubId));
    return list.map((p: any) => shapePlayer(p, clubs));
  },

  async getPlayerByUsername(username: string) {
    await connectDB();
    const p = await Player.findOne({ username: username.toLowerCase() }).lean<any>();
    if (!p) return null;
    return shapePlayer(p, await clubMap([p.clubId]));
  },

  async getPlayerById(id: string) {
    if (!isId(id)) return null;
    await connectDB();
    const p = await Player.findById(id).lean<any>();
    if (!p) return null;
    return shapePlayer(p, await clubMap([p.clubId]));
  },

  async getPlayerByUserId(userId: string) {
    if (!isId(userId)) return null;
    await connectDB();
    const p = await Player.findOne({ userId }).lean<any>();
    if (!p) return null;
    return shapePlayer(p, await clubMap([p.clubId]));
  },

  async createPlayer(data: any) {
    await connectDB();
    const player = await Player.create({
      userId: data.userId,
      username: data.username,
      fullName: data.fullName,
      avatar: data.avatar || undefined,
      konamiId: data.konamiId || "",
      deviceModel: data.deviceModel || "",
      facebookProfile: data.facebookProfile || "",
      preferredPosition: data.preferredPosition || "CF",
      playStyle: data.playStyle || "Possession Game",
      bio: data.bio || "",
      phone: data.phone || "",
      location: data.location || "",
      clubId: data.clubId && isId(data.clubId) ? data.clubId : undefined,
      rating: 750,
      marketValue: calculatePlayerMarketValue({ rating: 750, matchesPlayed: 0, winRate: 0, goalsScored: 0, motmCount: 0, cleanSheets: 0, recentForm: "" }),
    });
    await db.addActivityEvent({
      type: "PLAYER_REGISTER",
      category: "Players",
      title: `${player.fullName} joined the community`,
      description: `@${player.username} registered as a player.`,
      avatar: player.avatar,
      targetUrl: `/players/${player.username}`,
      userId: data.userId ? String(data.userId) : undefined,
      playerId: String(player._id),
    });
    return shapePlayer(player.toObject(), await clubMap([player.clubId]));
  },

  async updatePlayer(id: string, updates: Record<string, any>) {
    if (!isId(id)) throw new ServiceError("Invalid player id", 400);
    await connectDB();
    const set: any = {};
    const unset: any = {};
    for (const [k, v] of Object.entries(updates)) {
      if (v === undefined) continue;
      if (k === "clubId" && (v === "" || v === null)) unset.clubId = 1;
      else set[k] = v;
    }
    const p = await Player.findByIdAndUpdate(id, { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { new: true }).lean<any>();
    if (!p) throw new ServiceError("Player not found", 404);
    if (set.fullName || set.avatar) {
      const uset: any = {};
      if (set.fullName) uset.fullName = set.fullName;
      if (set.avatar) uset.avatar = set.avatar;
      await User.updateOne({ _id: p.userId }, { $set: uset });
    }
    return shapePlayer(p, await clubMap([p.clubId]));
  },

  // ----- Clubs -----
  async getClubs(filter: { status?: string; search?: string } = {}) {
    await connectDB();
    const q: any = {};
    if (filter.status && filter.status !== "ALL") q.status = filter.status;
    if (filter.search) q.name = new RegExp(escapeRegex(filter.search), "i");
    const clubs = await Club.find(q).sort({ points: -1, name: 1 }).lean();
    const squad = await Player.aggregate([
      { $match: { clubId: { $ne: null } } },
      { $group: { _id: "$clubId", count: { $sum: 1 }, value: { $sum: "$marketValue" } } },
    ]);
    const sm = new Map(squad.map((s: any) => [String(s._id), s]));
    const managers = await User.find({ _id: { $in: clubs.map((c: any) => c.managerId).filter(Boolean) } }, { fullName: 1 }).lean();
    const mm = new Map(managers.map((m: any) => [String(m._id), m.fullName]));
    return clubs.map((c: any) =>
      shapeClub(c, {
        squadCount: sm.get(String(c._id))?.count || 0,
        squadValue: sm.get(String(c._id))?.value || 0,
        managerName: c.managerId ? mm.get(String(c.managerId)) : "",
      })
    );
  },

  async getClubBySlug(slug: string) {
    await connectDB();
    const c = await Club.findOne({ slug }).lean<any>();
    return c ? db._clubDetail(c) : null;
  },

  async getClubById(id: string) {
    if (!isId(id)) return null;
    await connectDB();
    const c = await Club.findById(id).lean<any>();
    return c ? db._clubDetail(c) : null;
  },

  async _clubDetail(c: any) {
    const players = await Player.find({ clubId: c._id }).sort({ rating: -1 }).lean();
    const clubs = new Map([[String(c._id), c]]);
    const squad = players.map((p: any) => shapePlayer(p, clubs));
    const manager = c.managerId ? await User.findById(c.managerId, { fullName: 1, username: 1 }).lean<any>() : null;
    return {
      ...shapeClub(c, {
        squadCount: squad.length,
        squadValue: squad.reduce((a: number, p: any) => a + (p.marketValue || 0), 0),
        managerName: manager?.fullName,
      }),
      squad,
    };
  },

  async createClub(data: any) {
    await connectDB();
    const slug = await uniqueSlug(Club, data.name);
    const doc = { ...data, slug };
    if (!doc.managerId) delete doc.managerId;
    const club = await Club.create(doc);
    if (data.managerId && isId(String(data.managerId))) {
      await User.updateOne({ _id: data.managerId }, { $set: { clubId: club._id } });
    }
    if (club.status === "ACTIVE") await db._announceClub(club);
    return shapeClub(club.toObject());
  },

  async _announceClub(club: any) {
    await db.addActivityEvent({
      type: "CLUB_CREATED",
      category: "Clubs",
      title: `New club registered: ${club.name}`,
      description: club.location || "",
      avatar: club.logo,
      targetUrl: `/clubs/${club.slug}`,
    });
  },

  async updateClub(id: string, updates: any) {
    if (!isId(id)) throw new ServiceError("Invalid club id", 400);
    await connectDB();
    const set = { ...updates };
    if (updates.name) {
      const existing = await Club.findById(id).lean<any>();
      if (existing && existing.name !== updates.name) set.slug = await uniqueSlug(Club, updates.name, id);
    }
    const unset: any = {};
    if (set.managerId === "" || set.managerId === null) {
      delete set.managerId;
      unset.managerId = 1;
    }
    const before = await Club.findById(id, { status: 1 }).lean<any>();
    const c = await Club.findByIdAndUpdate(id, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { new: true }).lean<any>();
    if (!c) throw new ServiceError("Club not found", 404);
    if (set.managerId && isId(String(set.managerId))) {
      await User.updateOne({ _id: set.managerId }, { $set: { clubId: c._id } });
    }
    if (before?.status === "PENDING" && c.status === "ACTIVE") {
      await db._announceClub(c);
      if (c.managerId) await db.notify(String(c.managerId), "Club approved", `${c.name} is now active. You can enter tournaments and sign players.`, "/dashboard/my-club");
    }
    return shapeClub(c);
  },

  async deleteClub(id: string) {
    if (!isId(id)) throw new ServiceError("Invalid club id", 400);
    await connectDB();
    await Player.updateMany({ clubId: id }, { $unset: { clubId: 1 }, $set: { "contract.status": "FREE_AGENT" } });
    await User.updateMany({ clubId: id }, { $unset: { clubId: 1 } });
    await Club.deleteOne({ _id: id });
    return true;
  },

  // ----- Fixtures -----
  async getFixtures(filter: { status?: string; tournamentId?: string; clubId?: string; playerId?: string; onStream?: boolean; limit?: number } = {}) {
    await connectDB();
    const q: any = {};
    if (filter.status && filter.status !== "ALL") q.status = filter.status;
    if (filter.tournamentId && isId(filter.tournamentId)) q.tournamentId = filter.tournamentId;
    if (filter.clubId && isId(filter.clubId)) q.$or = [{ homeClubId: filter.clubId }, { awayClubId: filter.clubId }];
    if (filter.playerId && isId(filter.playerId)) q.$or = [{ homePlayerId: filter.playerId }, { awayPlayerId: filter.playerId }];
    if (filter.onStream) q.isOnStream = true;
    const list = await Fixture.find(q).sort({ scheduledDate: -1 }).limit(filter.limit || 500).lean();
    return shapeFixtures(list);
  },

  async getFixtureById(id: string) {
    if (!isId(id)) return null;
    await connectDB();
    const f = await Fixture.findById(id).lean();
    if (!f) return null;
    const [shaped] = await shapeFixtures([f]);
    return shaped;
  },

  async createFixture(data: any) {
    await connectDB();
    const clean: any = { ...data };
    for (const k of ["tournamentId", "homeClubId", "awayClubId", "homePlayerId", "awayPlayerId", "refereeId"]) {
      if (!clean[k] || !isId(clean[k])) delete clean[k];
    }
    if (!clean.homePlayerId && !clean.homeClubId) throw new ServiceError("Select a home player or club");
    if (!clean.awayPlayerId && !clean.awayClubId) throw new ServiceError("Select an away player or club");
    if (clean.homePlayerId && clean.homePlayerId === clean.awayPlayerId) throw new ServiceError("A player cannot play against themselves");
    if (clean.homeClubId && clean.homeClubId === clean.awayClubId) throw new ServiceError("A club cannot play against itself");
    const f = await Fixture.create(clean);
    const [shaped] = await shapeFixtures([f.toObject()]);
    return shaped;
  },

  async updateFixture(id: string, data: any) {
    if (!isId(id)) throw new ServiceError("Invalid fixture id", 400);
    await connectDB();
    const set: any = {};
    const unset: any = {};
    for (const [k, v] of Object.entries(data)) {
      if (v === undefined) continue;
      if (["tournamentId", "homeClubId", "awayClubId", "homePlayerId", "awayPlayerId", "refereeId"].includes(k) && (!v || !isId(String(v)))) unset[k] = 1;
      else set[k] = v;
    }
    const f = await Fixture.findByIdAndUpdate(id, { ...(Object.keys(set).length ? { $set: set } : {}), ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { new: true }).lean();
    if (!f) throw new ServiceError("Fixture not found", 404);
    const [shaped] = await shapeFixtures([f]);
    return shaped;
  },

  async deleteFixture(id: string) {
    if (!isId(id)) throw new ServiceError("Invalid fixture id", 400);
    await connectDB();
    const f = await Fixture.findById(id).lean<any>();
    if (!f) throw new ServiceError("Fixture not found", 404);
    if (f.status === "FINISHED" && f.result?.status === "APPROVED") {
      throw new ServiceError("Finished matches with approved results cannot be deleted (stats are already applied).", 409);
    }
    await Fixture.deleteOne({ _id: id });
    return true;
  },

  async setFixtureStatus(id: string, status: "SCHEDULED" | "LIVE" | "POSTPONED" | "CANCELLED") {
    if (!isId(id)) throw new ServiceError("Invalid fixture id", 400);
    await connectDB();
    const f = await Fixture.findById(id);
    if (!f) throw new ServiceError("Fixture not found", 404);
    if (f.status === "FINISHED") throw new ServiceError("Match already finished", 409);
    f.status = status;
    if (status === "LIVE" && !f.startedAt) {
      f.startedAt = new Date();
      f.liveScore = { home: 0, away: 0 } as any;
    }
    if (status !== "LIVE") f.startedAt = undefined;
    await f.save();
    const [shaped] = await shapeFixtures([f.toObject()]);
    if (status === "LIVE") {
      const home = shaped.homePlayer?.fullName || shaped.homeClub?.name;
      const away = shaped.awayPlayer?.fullName || shaped.awayClub?.name;
      await db.addActivityEvent({
        type: "MATCH_LIVE",
        category: "Matches",
        title: `LIVE: ${home} vs ${away}`,
        description: shaped.tournamentName || shaped.round,
        targetUrl: `/matches/${shaped.id}`,
      });
    }
    return shaped;
  },

  async updateLiveScore(id: string, home: number, away: number) {
    if (!isId(id)) throw new ServiceError("Invalid fixture id", 400);
    await connectDB();
    const f = await Fixture.findOneAndUpdate({ _id: id, status: "LIVE" }, { $set: { "liveScore.home": home, "liveScore.away": away } }, { new: true }).lean();
    if (!f) throw new ServiceError("Match is not live", 409);
    const [shaped] = await shapeFixtures([f]);
    return shaped;
  },

  /** A participant reports a score; it waits for an official to approve it. */
  async submitResultClaim(id: string, data: any, userId: string) {
    await connectDB();
    const f = await Fixture.findById(id);
    if (!f) throw new ServiceError("Fixture not found", 404);
    if (f.result?.status === "APPROVED") throw new ServiceError("Result already approved", 409);
    f.result = {
      homeScore: data.homeScore,
      awayScore: data.awayScore,
      homePenalties: data.homePenalties,
      awayPenalties: data.awayPenalties,
      motmPlayerId: data.motmPlayerId && isId(data.motmPlayerId) ? data.motmPlayerId : undefined,
      motmReason: data.motmReason,
      proofScreenshot: data.proofScreenshot,
      notes: data.notes,
      status: "PENDING",
      submittedBy: userId,
    } as any;
    await f.save();
    const [shaped] = await shapeFixtures([f.toObject()]);
    return shaped;
  },

  async clearResultClaim(id: string) {
    await connectDB();
    await Fixture.updateOne({ _id: id, "result.status": "PENDING" }, { $unset: { result: 1 } });
    return db.getFixtureById(id);
  },

  async getPendingResultClaims() {
    await connectDB();
    return shapeFixtures(await Fixture.find({ "result.status": "PENDING" }).sort({ scheduledDate: -1 }).lean());
  },

  /** Official approval: finalises the match and applies ratings, stats and form. */
  async approveMatchResult(id: string, data: any, approverId: string) {
    if (!isId(id)) throw new ServiceError("Invalid fixture id", 400);
    await connectDB();
    const f = await Fixture.findById(id);
    if (!f) throw new ServiceError("Fixture not found", 404);
    if (f.status === "FINISHED" && f.result?.status === "APPROVED") throw new ServiceError("Result already approved for this match", 409);

    const hs = Number(data.homeScore) || 0;
    const as = Number(data.awayScore) || 0;
    const motmId = data.motmPlayerId && isId(data.motmPlayerId) ? String(data.motmPlayerId) : undefined;

    f.result = {
      homeScore: hs,
      awayScore: as,
      homePenalties: data.homePenalties,
      awayPenalties: data.awayPenalties,
      motmPlayerId: motmId,
      motmReason: data.motmReason || "",
      proofScreenshot: data.proofScreenshot || f.result?.proofScreenshot,
      notes: data.notes || f.result?.notes,
      status: "APPROVED",
      submittedBy: f.result?.submittedBy || approverId,
      approvedBy: approverId,
    } as any;
    f.status = "FINISHED";
    f.liveScore = { home: hs, away: as } as any;
    await f.save();

    // Decide winner; penalties break a draw.
    let homeWon = hs > as;
    let awayWon = as > hs;
    if (hs === as && data.homePenalties != null && data.awayPenalties != null && data.homePenalties !== data.awayPenalties) {
      homeWon = data.homePenalties > data.awayPenalties;
      awayWon = !homeWon;
    }
    const isDraw = !homeWon && !awayWon;

    if (f.homePlayerId && f.awayPlayerId) {
      const [homeP, awayP] = await Promise.all([Player.findById(f.homePlayerId), Player.findById(f.awayPlayerId)]);
      if (homeP && awayP) {
        const hr = homeP.rating;
        const ar = awayP.rating;
        homeP.rating = calculateNewRating(hr, ar, { isWin: homeWon, isDraw, goalsScored: hs, goalsConceded: as, isMotm: motmId === String(homeP._id) });
        awayP.rating = calculateNewRating(ar, hr, { isWin: awayWon, isDraw, goalsScored: as, goalsConceded: hs, isMotm: motmId === String(awayP._id) });
        for (const [p, won, gf, ga] of [
          [homeP, homeWon, hs, as],
          [awayP, awayWon, as, hs],
        ] as const) {
          p.formHistory = updateFormHistory(p.formHistory || "", won ? "W" : isDraw ? "D" : "L");
          const s: any = p.stats;
          s.matchesPlayed += 1;
          s.goalsScored += gf;
          s.goalsConceded = (s.goalsConceded || 0) + ga;
          if (won) {
            s.wins += 1;
            s.points += 3;
          } else if (isDraw) {
            s.draws += 1;
            s.points += 1;
          } else s.losses += 1;
          if (ga === 0) s.cleanSheets += 1;
          if (motmId === String(p._id)) p.motmCount += 1;
          p.marketValue = calculatePlayerMarketValue({
            rating: p.rating,
            matchesPlayed: s.matchesPlayed,
            winRate: s.matchesPlayed ? (s.wins / s.matchesPlayed) * 100 : 0,
            goalsScored: s.goalsScored,
            motmCount: p.motmCount,
            cleanSheets: s.cleanSheets,
            recentForm: p.formHistory,
          });
        }
        await Promise.all([homeP.save(), awayP.save()]);
      }
    }

    if (f.homeClubId && f.awayClubId) {
      const [hc, ac] = await Promise.all([Club.findById(f.homeClubId), Club.findById(f.awayClubId)]);
      for (const [c, won, gf, ga] of [
        [hc, homeWon, hs, as],
        [ac, awayWon, as, hs],
      ] as const) {
        if (!c) continue;
        const s: any = c.stats;
        s.matches += 1;
        s.goalsScored += gf;
        s.goalsConceded += ga;
        if (won) {
          s.wins += 1;
          c.points += 3;
        } else if (isDraw) {
          s.draws += 1;
          c.points += 1;
        } else s.losses += 1;
        c.formHistory = updateFormHistory(c.formHistory || "", won ? "W" : isDraw ? "D" : "L");
        await c.save();
      }
    }

    const [shaped] = await shapeFixtures([f.toObject()]);
    const home = shaped.homePlayer?.fullName || shaped.homeClub?.name || "Home";
    const away = shaped.awayPlayer?.fullName || shaped.awayClub?.name || "Away";
    const title = isDraw ? `${home} and ${away} drew ${hs} - ${as}` : `${homeWon ? home : away} beat ${homeWon ? away : home} ${Math.max(hs, as)} - ${Math.min(hs, as)}`;
    await db.addActivityEvent({
      type: "MATCH_RESULT",
      category: "Matches",
      title,
      description: [shaped.tournamentName, shaped.round].filter(Boolean).join(" · "),
      avatar: (homeWon ? shaped.homePlayer?.avatar : shaped.awayPlayer?.avatar) || shaped.homeClub?.logo,
      targetUrl: `/matches/${shaped.id}`,
    });
    for (const p of [shaped.homePlayer, shaped.awayPlayer]) {
      if (!p) continue;
      const pl = await Player.findById(p.id, { userId: 1 }).lean<any>();
      await db.addActivityEvent({
        type: "PLAYER_MATCH",
        category: "Matches",
        title: `Played ${home} vs ${away} (${hs} - ${as})`,
        description: shaped.tournamentName || shaped.round,
        targetUrl: `/matches/${shaped.id}`,
        playerId: p.id,
        userId: pl?.userId ? String(pl.userId) : undefined,
        isPublic: false,
      });
      if (pl?.userId) await db.notify(String(pl.userId), "Match result confirmed", `${home} ${hs} - ${as} ${away}`, `/matches/${shaped.id}`);
    }
    if (motmId && shaped.result?.motmPlayerName) {
      const pl = await Player.findById(motmId, { userId: 1, avatar: 1, username: 1 }).lean<any>();
      await db.addActivityEvent({
        type: "MOTM",
        category: "Awards",
        title: `${shaped.result.motmPlayerName} named Man of the Match`,
        description: `${home} vs ${away}`,
        avatar: pl?.avatar,
        targetUrl: `/players/${pl?.username}`,
        playerId: motmId,
        userId: pl?.userId ? String(pl.userId) : undefined,
      });
    }
    return shaped;
  },

  // ----- Tournaments -----
  async getTournaments(filter: { status?: string; includeDrafts?: boolean } = {}) {
    await connectDB();
    const q: any = {};
    if (filter.status && filter.status !== "ALL") q.status = filter.status;
    else if (!filter.includeDrafts) q.status = { $ne: "DRAFT" };
    const list = await Tournament.find(q).sort({ isFeatured: -1, startDate: -1, createdAt: -1 }).lean();
    const prog = await tournamentProgress(list.map((t: any) => String(t._id)));
    return list.map((t: any) => shapeTournament(t, prog.get(String(t._id))));
  },

  async getTournamentBySlug(slug: string, opts: { includeDrafts?: boolean } = {}) {
    await connectDB();
    const t = await Tournament.findOne(isId(slug) ? { $or: [{ slug }, { _id: slug }] } : { slug }).lean<any>();
    if (!t || (t.status === "DRAFT" && !opts.includeDrafts)) return null;
    return db._tournamentDetail(t);
  },

  async getTournamentById(id: string) {
    if (!isId(id)) return null;
    await connectDB();
    const t = await Tournament.findById(id).lean<any>();
    return t ? db._tournamentDetail(t) : null;
  },

  async _tournamentDetail(t: any) {
    const prog = await tournamentProgress([String(t._id)]);
    const fixtures = await shapeFixtures(await Fixture.find({ tournamentId: t._id }).sort({ scheduledDate: 1 }).lean());
    const active = (t.participants || []).filter((p: any) => p.status !== "REMOVED");
    const players = await Player.find({ userId: { $in: active.map((p: any) => p.userId) } }).lean();
    const playerClubs = await clubMap(players.map((p: any) => p.clubId));
    const byUser = new Map(players.map((p: any) => [String(p.userId), p]));
    const participants = active
      .map((p: any) => {
        const pl = byUser.get(String(p.userId));
        return pl ? { ...shapePlayer(pl, playerClubs), joinedAt: new Date(p.joinedAt).toISOString(), entryStatus: p.status } : null;
      })
      .filter(Boolean);
    const clubEntries = (t.clubParticipants || []).filter((c: any) => c.status !== "REMOVED");
    let clubs: any[] = [];
    if (clubEntries.length) {
      const ids = clubEntries.map((c: any) => c.clubId);
      const docs = await Club.find({ _id: { $in: ids } }, { name: 1, shortName: 1, slug: 1, logo: 1, location: 1 }).lean();
      const squad = await Player.aggregate([{ $match: { clubId: { $in: ids } } }, { $group: { _id: "$clubId", n: { $sum: 1 } } }]);
      const sm = new Map(squad.map((x: any) => [String(x._id), x.n]));
      const dm = new Map(docs.map((d: any) => [String(d._id), d]));
      clubs = clubEntries
        .map((c: any) => {
          const d: any = dm.get(String(c.clubId));
          return d ? { ...clubMini(d), location: d.location || "", squadCount: sm.get(String(d._id)) || 0, joinedAt: new Date(c.joinedAt).toISOString() } : null;
        })
        .filter(Boolean);
    }
    return { ...shapeTournament(t, prog.get(String(t._id))), fixtures, participants, clubs };
  },

  async createTournament(data: any) {
    await connectDB();
    const slug = await uniqueSlug(Tournament, data.name);
    const doc = { ...data, slug };
    if (!doc.winnerPlayerId) delete doc.winnerPlayerId;
    const t = await Tournament.create(doc);
    if (t.status !== "DRAFT") {
      await db.addActivityEvent({
        type: "TOURNAMENT_CREATED",
        category: "Tournaments",
        title: `New tournament: ${t.name}`,
        description: t.prizePool ? `Prize pool ${t.prizePool}` : "",
        avatar: t.logo,
        targetUrl: `/tournaments/${t.slug}`,
      });
    }
    return shapeTournament(t.toObject());
  },

  async updateTournament(id: string, data: any) {
    if (!isId(id)) throw new ServiceError("Invalid tournament id", 400);
    await connectDB();
    const set = { ...data };
    if (data.name) {
      const existing = await Tournament.findById(id, { name: 1 }).lean<any>();
      if (existing && existing.name !== data.name) set.slug = await uniqueSlug(Tournament, data.name, id);
    }
    const unset: any = {};
    if ("winnerPlayerId" in set && !set.winnerPlayerId) {
      delete set.winnerPlayerId;
      unset.winnerPlayerId = 1;
    }
    const before = await Tournament.findById(id, { status: 1, winnerPlayerId: 1 }).lean<any>();
    const t = await Tournament.findByIdAndUpdate(id, { $set: set, ...(Object.keys(unset).length ? { $unset: unset } : {}) }, { new: true }).lean<any>();
    if (!t) throw new ServiceError("Tournament not found", 404);
    if (set.winnerPlayerId && String(before?.winnerPlayerId || "") !== String(set.winnerPlayerId)) {
      const champ = await Player.findById(set.winnerPlayerId, { fullName: 1, avatar: 1, username: 1, userId: 1 }).lean<any>();
      if (champ) {
        await db.addActivityEvent({
          type: "CHAMPION",
          category: "Awards",
          title: `${champ.fullName} won ${t.name}!`,
          avatar: champ.avatar,
          targetUrl: `/tournaments/${t.slug}`,
          playerId: String(champ._id),
          userId: champ.userId ? String(champ.userId) : undefined,
        });
        if (champ.userId) await db.notify(String(champ.userId), "Champion!", `Congratulations on winning ${t.name}.`, `/tournaments/${t.slug}`);
      }
    }
    if (before && data.status && before.status !== data.status) {
      const labels: Record<string, string> = {
        REGISTRATION_OPEN: "Registration is now open",
        REGISTRATION_CLOSED: "Registration closed",
        ONGOING: "Tournament has kicked off",
        COMPLETED: "Tournament completed",
        CANCELLED: "Tournament cancelled",
      };
      if (labels[data.status]) {
        await db.addActivityEvent({
          type: "TOURNAMENT_STATUS",
          category: "Tournaments",
          title: `${t.name}: ${labels[data.status]}`,
          avatar: t.logo,
          targetUrl: `/tournaments/${t.slug}`,
        });
        for (const p of t.participants || []) {
          if (p.status !== "REMOVED") await db.notify(String(p.userId), t.name, labels[data.status], `/tournaments/${t.slug}`);
        }
      }
    }
    return shapeTournament(t);
  },

  async deleteTournament(id: string) {
    if (!isId(id)) throw new ServiceError("Invalid tournament id", 400);
    await connectDB();
    const played = await Fixture.exists({ tournamentId: id, status: "FINISHED" });
    if (played) throw new ServiceError("This tournament has finished matches. Mark it CANCELLED or COMPLETED instead of deleting.", 409);
    await Fixture.deleteMany({ tournamentId: id });
    await Tournament.deleteOne({ _id: id });
    return true;
  },

  async joinTournament(slugOrId: string, userId: string) {
    await connectDB();
    const t = await Tournament.findOne(isId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId });
    if (!t || t.status === "DRAFT") throw new ServiceError("Tournament not found", 404);
    if (t.participantType === "CLUB") return db._joinTournamentAsClub(t, userId);
    const player = await Player.findOne({ userId }).lean<any>();
    if (!player) throw new ServiceError("Only registered players can join tournaments", 403);
    if (player.status !== "ACTIVE") throw new ServiceError("Your player account is not active", 403);
    if (t.status !== "REGISTRATION_OPEN") throw new ServiceError("Registration is not open for this tournament", 409);
    if (t.registrationDeadline && new Date(t.registrationDeadline).getTime() < Date.now()) throw new ServiceError("Registration deadline has passed", 409);
    const active = t.participants.filter((p: any) => p.status !== "REMOVED");
    if (active.some((p: any) => String(p.userId) === userId)) throw new ServiceError("You have already joined this tournament", 409);
    if (t.participants.some((p: any) => String(p.userId) === userId && p.status === "REMOVED")) {
      throw new ServiceError("You were removed from this tournament. Contact an admin.", 403);
    }
    if (active.length >= t.maxParticipants) throw new ServiceError("Tournament is full", 409);

    // Atomic guard against two requests racing past the capacity check.
    const res = await Tournament.updateOne(
      { _id: t._id, "participants.userId": { $ne: oid(userId) }, $expr: { $lt: [{ $size: "$participants" }, t.maxParticipants + (t.participants.length - active.length)] } },
      { $push: { participants: { userId, playerId: player._id, clubId: player.clubId, joinedAt: new Date(), status: "CONFIRMED" } } }
    );
    if (!res.modifiedCount) throw new ServiceError("Could not join — the tournament may have just filled up", 409);

    await db.addActivityEvent({
      type: "TOURNAMENT_JOIN",
      category: "Tournaments",
      title: `${player.fullName} joined ${t.name}`,
      avatar: player.avatar,
      targetUrl: `/tournaments/${t.slug}`,
      userId,
      playerId: String(player._id),
    });
    await db.notify(userId, "Tournament registration confirmed", `You are registered for ${t.name}.`, `/tournaments/${t.slug}`);
    return db.getTournamentBySlug(t.slug, { includeDrafts: true });
  },

  async _joinTournamentAsClub(t: any, userId: string) {
    const club = await db.getManagedClub(userId);
    if (!club) throw new ServiceError("Only a club manager can enter a club into this tournament. Register your club first.", 403);
    if (club.status !== "ACTIVE") throw new ServiceError("Your club is not active yet", 403);
    if (t.status !== "REGISTRATION_OPEN") throw new ServiceError("Registration is not open for this tournament", 409);
    if (t.registrationDeadline && new Date(t.registrationDeadline).getTime() < Date.now()) throw new ServiceError("Registration deadline has passed", 409);
    const entries = (t.clubParticipants || []) as any[];
    const existing = entries.find((c) => String(c.clubId) === String(club._id));
    if (existing?.status === "REMOVED") throw new ServiceError("Your club was removed from this tournament. Contact an admin.", 403);
    if (existing) throw new ServiceError("Your club is already registered", 409);
    const active = entries.filter((c) => c.status !== "REMOVED").length;
    if (active >= t.maxParticipants) throw new ServiceError("Tournament is full", 409);
    const res = await Tournament.updateOne(
      { _id: t._id, "clubParticipants.clubId": { $ne: club._id } },
      { $push: { clubParticipants: { clubId: club._id, registeredBy: userId, joinedAt: new Date(), status: "CONFIRMED", paymentType: "free" } } }
    );
    if (!res.modifiedCount) throw new ServiceError("Could not register the club", 409);
    await db.addActivityEvent({
      type: "TOURNAMENT_JOIN",
      category: "Tournaments",
      title: `${club.name} entered ${t.name}`,
      avatar: club.logo,
      targetUrl: `/tournaments/${t.slug}`,
      userId,
    });
    await db.notify(userId, "Club registered", `${club.name} is registered for ${t.name}.`, `/tournaments/${t.slug}`);
    return db.getTournamentBySlug(t.slug, { includeDrafts: true });
  },

  /** The club this user may manage: its manager, or a full-control staff member. */
  async getManagedClub(userId: string) {
    if (!isId(userId)) return null;
    await connectDB();
    const byManager = await Club.findOne({ managerId: userId }).lean<any>();
    if (byManager) return byManager;
    return Club.findOne({ staff: { $elemMatch: { userId: oid(userId), access: "full_control" } } }).lean<any>();
  },

  /**
   * What this user may do with a club: MANAGER (club owner account), FULL (staff with
   * full control) or INFO (staff allowed to edit club info only). Null = no access.
   */
  async getClubAccess(userId: string, clubId: string): Promise<"MANAGER" | "FULL" | "INFO" | null> {
    if (!isId(userId) || !isId(clubId)) return null;
    await connectDB();
    const club = await Club.findById(clubId, { managerId: 1, staff: 1 }).lean<any>();
    if (!club) return null;
    if (club.managerId && String(club.managerId) === userId) return "MANAGER";
    const entry = (club.staff || []).find((s: any) => String(s.userId) === userId);
    if (!entry) return null;
    return entry.access === "full_control" ? "FULL" : "INFO";
  },

  /** Clubs a user can edit (as manager or staff), used to pick "their" club. */
  async getEditableClubId(userId: string, fallbackClubId?: string) {
    if (!isId(userId)) return fallbackClubId;
    await connectDB();
    const c = await Club.findOne({ $or: [{ managerId: userId }, { "staff.userId": oid(userId) }] }, { _id: 1 }).lean<any>();
    return c ? String(c._id) : fallbackClubId;
  },

  async updateClubProfile(clubId: string, data: Record<string, any>) {
    if (!isId(clubId)) throw new ServiceError("Invalid club", 400);
    await connectDB();
    const c = await Club.findByIdAndUpdate(clubId, { $set: data }, { new: true }).lean<any>();
    if (!c) throw new ServiceError("Club not found", 404);
    return shapeClub(c);
  },

  async canManageClub(userId: string, clubId: string) {
    const club = await db.getManagedClub(userId);
    return !!club && String(club._id) === clubId;
  },

  async leaveTournament(slugOrId: string, userId: string) {
    await connectDB();
    const t = await Tournament.findOne(isId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId });
    if (!t) throw new ServiceError("Tournament not found", 404);
    if (t.status !== "REGISTRATION_OPEN") throw new ServiceError("You can only withdraw while registration is open", 409);
    if (t.participantType === "CLUB") {
      const club = await db.getManagedClub(userId);
      if (!club) throw new ServiceError("Only the club manager can withdraw the club", 403);
      const r = await Tournament.updateOne({ _id: t._id }, { $pull: { clubParticipants: { clubId: club._id, status: { $ne: "REMOVED" } } } });
      if (!r.modifiedCount) throw new ServiceError("Your club is not registered for this tournament", 409);
      return db.getTournamentBySlug(t.slug, { includeDrafts: true });
    }
    const before = t.participants.length;
    t.participants = t.participants.filter((p: any) => !(String(p.userId) === userId && p.status !== "REMOVED")) as any;
    if (t.participants.length === before) throw new ServiceError("You are not registered for this tournament", 409);
    await t.save();
    const player = await Player.findOne({ userId }, { fullName: 1 }).lean<any>();
    await db.addActivityEvent({
      type: "TOURNAMENT_LEAVE",
      category: "Tournaments",
      title: `Withdrew from ${t.name}`,
      targetUrl: `/tournaments/${t.slug}`,
      userId,
      playerId: player ? String(player._id) : undefined,
      isPublic: false,
    });
    return db.getTournamentBySlug(t.slug, { includeDrafts: true });
  },

  async setClubEntryStatus(tournamentId: string, clubId: string, status: "CONFIRMED" | "REMOVED") {
    if (!isId(tournamentId) || !isId(clubId)) throw new ServiceError("Invalid id", 400);
    await connectDB();
    const r = await Tournament.updateOne({ _id: tournamentId, "clubParticipants.clubId": oid(clubId) }, { $set: { "clubParticipants.$.status": status } });
    if (!r.matchedCount) throw new ServiceError("Club entry not found", 404);
    return true;
  },

  async removeTournamentParticipant(tournamentId: string, userId: string) {
    if (!isId(tournamentId) || !isId(userId)) throw new ServiceError("Invalid id", 400);
    await connectDB();
    const t = await Tournament.findOneAndUpdate(
      { _id: tournamentId, "participants.userId": oid(userId) },
      { $set: { "participants.$.status": "REMOVED" } },
      { new: true }
    ).lean<any>();
    if (!t) throw new ServiceError("Participant not found", 404);
    await db.notify(userId, "Removed from tournament", `An admin removed you from ${t.name}.`, `/tournaments/${t.slug}`);
    return true;
  },

  async restoreTournamentParticipant(tournamentId: string, userId: string) {
    if (!isId(tournamentId) || !isId(userId)) throw new ServiceError("Invalid id", 400);
    await connectDB();
    await Tournament.updateOne({ _id: tournamentId, "participants.userId": oid(userId) }, { $set: { "participants.$.status": "CONFIRMED" } });
    return true;
  },

  async getTournamentParticipantsAdmin(tournamentId: string) {
    if (!isId(tournamentId)) return [];
    await connectDB();
    const t = await Tournament.findById(tournamentId).lean<any>();
    if (!t) return [];
    if (t.participantType === "CLUB") {
      const entries = t.clubParticipants || [];
      const clubs = await Club.find({ _id: { $in: entries.map((c: any) => c.clubId) } }, { name: 1, shortName: 1, slug: 1, logo: 1, email: 1, managerId: 1 }).lean();
      const managers = await User.find({ _id: { $in: clubs.map((c: any) => c.managerId).filter(Boolean) } }, { fullName: 1, email: 1 }).lean();
      const cm = new Map(clubs.map((c: any) => [String(c._id), c]));
      const mm = new Map(managers.map((m: any) => [String(m._id), m]));
      return entries.map((e: any) => {
        const c: any = cm.get(String(e.clubId)) || {};
        const m: any = c.managerId ? mm.get(String(c.managerId)) || {} : {};
        return {
          clubId: String(e.clubId),
          fullName: c.name,
          username: c.shortName,
          slug: c.slug,
          email: m.email || c.email,
          managerName: m.fullName,
          avatar: c.logo || PLACEHOLDER.club,
          joinedAt: new Date(e.joinedAt).toISOString(),
          status: e.status,
          paymentType: e.paymentType,
          fbPostLink: e.fbPostLink,
        };
      });
    }
    const users = await User.find({ _id: { $in: t.participants.map((p: any) => p.userId) } }, { email: 1, fullName: 1, username: 1 }).lean();
    const players = await Player.find({ userId: { $in: t.participants.map((p: any) => p.userId) } }, { konamiId: 1, userId: 1, rating: 1, avatar: 1, phone: 1 }).lean();
    const um = new Map(users.map((u: any) => [String(u._id), u]));
    const pm = new Map(players.map((p: any) => [String(p.userId), p]));
    return t.participants.map((p: any) => {
      const u: any = um.get(String(p.userId)) || {};
      const pl: any = pm.get(String(p.userId)) || {};
      return {
        userId: String(p.userId),
        playerId: pl._id ? String(pl._id) : undefined,
        fullName: u.fullName,
        username: u.username,
        email: u.email,
        konamiId: pl.konamiId,
        phone: pl.phone,
        rating: pl.rating,
        avatar: pl.avatar || PLACEHOLDER.avatar,
        joinedAt: new Date(p.joinedAt).toISOString(),
        status: p.status,
      };
    });
  },

  async getTournamentsForUser(userId: string) {
    if (!isId(userId)) return [];
    await connectDB();
    const player = await Player.findOne({ userId }, { clubId: 1 }).lean<any>();
    const or: any[] = [{ participants: { $elemMatch: { userId: oid(userId), status: { $ne: "REMOVED" } } } }];
    if (player?.clubId) or.push({ participantType: "CLUB", clubParticipants: { $elemMatch: { clubId: player.clubId, status: { $ne: "REMOVED" } } } });
    const list = await Tournament.find({ $or: or }).sort({ startDate: -1 }).lean();
    const prog = await tournamentProgress(list.map((t: any) => String(t._id)));
    return list.map((t: any) => {
      const entry =
        t.participants.find((p: any) => String(p.userId) === userId) ||
        (player?.clubId ? (t.clubParticipants || []).find((c: any) => String(c.clubId) === String(player.clubId)) : undefined);
      return { ...shapeTournament(t, prog.get(String(t._id))), joinedAt: entry ? new Date(entry.joinedAt).toISOString() : undefined };
    });
  },

  // ----- Events -----
  async getEvents(opts: { includeDrafts?: boolean } = {}) {
    await connectDB();
    const q: any = opts.includeDrafts ? {} : { status: { $ne: "DRAFT" } };
    const list = await Event.find(q).sort({ eventDate: 1 }).lean();
    return list.map((e: any) => db._shapeEvent(e));
  },

  _shapeEvent(e: any) {
    const regs = (e.registrations || []).filter((r: any) => r.status !== "REMOVED");
    const deadline = e.registrationDeadline ? new Date(e.registrationDeadline) : new Date(e.eventDate);
    const out = plain<any>({ ...e, registrations: undefined });
    return {
      ...out,
      banner: e.banner || PLACEHOLDER.banner,
      eventDate: new Date(e.eventDate).toISOString(),
      registrationDeadline: e.registrationDeadline ? new Date(e.registrationDeadline).toISOString() : "",
      registeredCount: regs.length,
      registeredUserIds: regs.map((r: any) => String(r.userId)),
      isRegistrationOpen: e.status === "ACTIVE" && e.registrationOpen && deadline.getTime() > Date.now() && regs.length < (e.capacity || 0),
    };
  },

  async getEventBySlug(slug: string) {
    await connectDB();
    const e = await Event.findOne({ slug, status: { $ne: "DRAFT" } }).lean<any>();
    return e ? db._shapeEvent(e) : null;
  },

  async createEvent(data: any) {
    await connectDB();
    const slug = await uniqueSlug(Event, data.name);
    const e = await Event.create({ ...data, slug });
    if (e.status === "ACTIVE") {
      await db.addActivityEvent({ type: "EVENT_CREATED", category: "Tournaments", title: `New event: ${e.name}`, description: e.venue, targetUrl: `/events#${e.slug}` });
    }
    return db._shapeEvent(e.toObject());
  },

  async updateEvent(id: string, data: any) {
    if (!isId(id)) throw new ServiceError("Invalid event id", 400);
    await connectDB();
    const set = { ...data };
    if (data.name) {
      const existing = await Event.findById(id, { name: 1 }).lean<any>();
      if (existing && existing.name !== data.name) set.slug = await uniqueSlug(Event, data.name, id);
    }
    const e = await Event.findByIdAndUpdate(id, { $set: set }, { new: true }).lean<any>();
    if (!e) throw new ServiceError("Event not found", 404);
    return db._shapeEvent(e);
  },

  async registerForEvent(slugOrId: string, userId: string) {
    await connectDB();
    const e = await Event.findOne(isId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId });
    if (!e) throw new ServiceError("Event not found", 404);
    const shaped = db._shapeEvent(e.toObject());
    if (shaped.registeredUserIds.includes(userId)) throw new ServiceError("You are already registered for this event", 409);
    if (!shaped.isRegistrationOpen) throw new ServiceError("Registration for this event is closed", 409);
    const player = await Player.findOne({ userId }, { fullName: 1, avatar: 1 }).lean<any>();
    const user = await User.findById(userId, { fullName: 1, status: 1 }).lean<any>();
    if (!user || user.status !== "ACTIVE") throw new ServiceError("Your account is not active", 403);
    const res = await Event.updateOne(
      { _id: e._id, "registrations.userId": { $ne: oid(userId) }, $expr: { $lt: [{ $size: "$registrations" }, e.capacity] } },
      { $push: { registrations: { userId, playerId: player?._id, joinedAt: new Date(), status: "CONFIRMED" } } }
    );
    if (!res.modifiedCount) throw new ServiceError("Could not register — the event may be full", 409);
    await db.addActivityEvent({
      type: "EVENT_REGISTER",
      category: "Players",
      title: `${user.fullName} registered for ${e.name}`,
      avatar: player?.avatar,
      targetUrl: `/events#${e.slug}`,
      userId,
      playerId: player ? String(player._id) : undefined,
    });
    await db.notify(userId, "Event registration confirmed", `You're registered for ${e.name}.`, `/events#${e.slug}`);
    const fresh = await Event.findById(e._id).lean<any>();
    return db._shapeEvent(fresh);
  },

  async unregisterFromEvent(slugOrId: string, userId: string) {
    await connectDB();
    const e = await Event.findOneAndUpdate(isId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId }, { $pull: { registrations: { userId: oid(userId) } } }, { new: true }).lean<any>();
    if (!e) throw new ServiceError("Event not found", 404);
    return db._shapeEvent(e);
  },

  async getEventRegistrationsAdmin(eventId: string) {
    if (!isId(eventId)) return [];
    await connectDB();
    const e = await Event.findById(eventId).lean<any>();
    if (!e) return [];
    const users = await User.find({ _id: { $in: e.registrations.map((r: any) => r.userId) } }, { email: 1, fullName: 1, username: 1 }).lean();
    const um = new Map(users.map((u: any) => [String(u._id), u]));
    return e.registrations.map((r: any) => {
      const u: any = um.get(String(r.userId)) || {};
      return { userId: String(r.userId), fullName: u.fullName, username: u.username, email: u.email, joinedAt: new Date(r.joinedAt).toISOString(), status: r.status };
    });
  },

  async removeEventRegistration(eventId: string, userId: string) {
    if (!isId(eventId) || !isId(userId)) throw new ServiceError("Invalid id", 400);
    await connectDB();
    await Event.updateOne({ _id: eventId }, { $pull: { registrations: { userId: oid(userId) } } });
    return true;
  },

  async getEventsForUser(userId: string) {
    if (!isId(userId)) return [];
    await connectDB();
    const list = await Event.find({ "registrations.userId": oid(userId) }).sort({ eventDate: -1 }).lean();
    return list.map((e: any) => db._shapeEvent(e));
  },

  // ----- Referees -----
  async getReferees() {
    await connectDB();
    const list = await Referee.find({}).sort({ tier: 1, rating: -1 }).lean();
    return list.map((r: any) => ({ ...plain<any>(r), avatar: r.avatar || PLACEHOLDER.avatar, completedMatches: r.matchesOfficiated }));
  },

  // ----- Transfers -----
  async getTransferListings() {
    await connectDB();
    const list = await TransferListing.find({ status: { $ne: "CLOSED" } }).sort({ createdAt: -1 }).lean();
    const players = await Player.find({ _id: { $in: list.map((l: any) => l.playerId) } }).lean();
    const clubs = await clubMap(players.map((p: any) => p.clubId));
    const pm = new Map(players.map((p: any) => [String(p._id), shapePlayer(p, clubs)]));
    return list
      .map((l: any) => ({ ...plain<any>(l), listedDate: new Date(l.createdAt).toISOString(), player: pm.get(String(l.playerId)) }))
      .filter((l: any) => l.player);
  },

  async createTransferListing(data: { playerId: string; askingPrice: number; listedBy?: string }) {
    if (!isId(data.playerId)) throw new ServiceError("Invalid player", 400);
    await connectDB();
    const player = await Player.findById(data.playerId);
    if (!player) throw new ServiceError("Player not found", 404);
    const existing = await TransferListing.findOne({ playerId: data.playerId, status: { $ne: "CLOSED" } });
    if (existing) throw new ServiceError("Player is already listed", 409);
    const l = await TransferListing.create({ playerId: data.playerId, askingPrice: data.askingPrice, listedBy: data.listedBy });
    player.contract = { ...(player.contract as any), status: "TRANSFER_LISTED" } as any;
    await player.save();
    await db.addActivityEvent({
      type: "TRANSFER_LISTED",
      category: "Transfers",
      title: `${player.fullName} is on the transfer list`,
      description: `Asking price $${data.askingPrice}M`,
      avatar: player.avatar,
      targetUrl: `/players/${player.username}`,
      playerId: String(player._id),
      userId: player.userId ? String(player.userId) : undefined,
    });
    return plain(l.toObject());
  },

  async closeTransferListing(id: string) {
    if (!isId(id)) throw new ServiceError("Invalid listing", 400);
    await connectDB();
    const l = await TransferListing.findByIdAndUpdate(id, { $set: { status: "CLOSED" } }).lean<any>();
    if (l) await Player.updateOne({ _id: l.playerId, "contract.status": "TRANSFER_LISTED" }, { $set: { "contract.status": "FREE_AGENT" } });
    return true;
  },

  async createTransferRequest(data: any) {
    await connectDB();
    if (!isId(data.playerId) || !isId(data.targetClubId)) throw new ServiceError("Invalid player or club", 400);
    const [player, club] = await Promise.all([Player.findById(data.playerId).lean<any>(), Club.findById(data.targetClubId).lean<any>()]);
    if (!player || !club) throw new ServiceError("Player or club not found", 404);
    const dup = await TransferRequest.findOne({ playerId: data.playerId, targetClubId: data.targetClubId, status: "PENDING" });
    if (dup) throw new ServiceError("A pending offer already exists for this player from this club", 409);
    const r = await TransferRequest.create(data);
    if (player.userId) await db.notify(String(player.userId), "New transfer offer", `${club.name} made an offer of $${data.offeredFee}M.`, "/dashboard");
    return plain(r.toObject());
  },

  async getTransferRequests(filter: { status?: string } = {}) {
    await connectDB();
    const q: any = {};
    if (filter.status) q.status = filter.status;
    const list = await TransferRequest.find(q).sort({ createdAt: -1 }).lean();
    const [players, clubs] = await Promise.all([
      Player.find({ _id: { $in: list.map((r: any) => r.playerId) } }, { fullName: 1, username: 1, avatar: 1 }).lean(),
      Club.find({ _id: { $in: list.map((r: any) => r.targetClubId) } }, { name: 1, shortName: 1, slug: 1, logo: 1 }).lean(),
    ]);
    const pm = new Map(players.map((p: any) => [String(p._id), p]));
    const cm = new Map(clubs.map((c: any) => [String(c._id), c]));
    return list.map((r: any) => ({ ...plain<any>(r), player: plain(pm.get(String(r.playerId))), club: clubMini(cm.get(String(r.targetClubId))) }));
  },

  async setTransferRequestStatus(id: string, status: "ACCEPTED" | "REJECTED" | "CANCELLED", approverName: string) {
    if (!isId(id)) throw new ServiceError("Invalid request", 400);
    await connectDB();
    const r = await TransferRequest.findById(id);
    if (!r) throw new ServiceError("Request not found", 404);
    if (r.status !== "PENDING") throw new ServiceError("Request already handled", 409);
    r.status = status;
    await r.save();
    if (status === "ACCEPTED") await db._executeTransfer(String(r.playerId), String(r.targetClubId), r.offeredFee || 0, approverName);
    return plain(r.toObject());
  },

  async approveTransfer(listingId: string, buyerClubId: string, approverName = "Admin") {
    if (!isId(listingId) || !isId(buyerClubId)) throw new ServiceError("Invalid listing or club", 400);
    await connectDB();
    const listing = await TransferListing.findById(listingId);
    if (!listing || listing.status === "CLOSED") throw new ServiceError("Listing not found", 404);
    const hist = await db._executeTransfer(String(listing.playerId), buyerClubId, listing.askingPrice, approverName);
    listing.status = "CLOSED";
    await listing.save();
    return hist;
  },

  async _executeTransfer(playerId: string, clubId: string, fee: number, approverName: string) {
    const [player, club] = await Promise.all([Player.findById(playerId), Club.findById(clubId)]);
    if (!player || !club) throw new ServiceError("Player or club not found", 404);
    if (player.clubId && String(player.clubId) === clubId) throw new ServiceError("Player already belongs to this club", 409);
    const oldClub = player.clubId ? await Club.findById(player.clubId, { name: 1 }).lean<any>() : null;
    player.clubId = club._id;
    player.contract = { status: "UNDER_CONTRACT", durationMonths: 12, endDate: new Date(Date.now() + 365 * 86400000) } as any;
    await player.save();
    await TransferListing.updateMany({ playerId, status: { $ne: "CLOSED" } }, { $set: { status: "CLOSED" } });
    const hist = await TransferHistory.create({
      playerId,
      playerName: player.fullName,
      previousClubName: oldClub?.name || "Free Agent",
      newClubName: club.name,
      fee,
      approvedBy: approverName,
    });
    await db.addActivityEvent({
      type: "TRANSFER",
      category: "Transfers",
      title: `${player.fullName} signed for ${club.name}`,
      description: fee ? `Fee $${fee}M` : "",
      avatar: player.avatar,
      targetUrl: `/players/${player.username}`,
      playerId,
      userId: player.userId ? String(player.userId) : undefined,
    });
    if (player.userId) await db.notify(String(player.userId), "Transfer completed", `You are now part of ${club.name}.`, `/clubs/${club.slug}`);
    return plain(hist.toObject());
  },

  /**
   * Overall rank by rating among players who have played at least one official
   * match (ties broken by matches played, then join date). Null = unranked.
   */
  async getPlayerRank(p: { id: string; rating: number; stats: { matchesPlayed: number }; createdAt?: string }): Promise<{ rank: number | null; total: number }> {
    await connectDB();
    const ranked = { status: "ACTIVE", "stats.matchesPlayed": { $gt: 0 } };
    if (!p.stats.matchesPlayed) return { rank: null, total: await Player.countDocuments(ranked) };
    const created = p.createdAt ? new Date(p.createdAt) : new Date();
    const [ahead, total] = await Promise.all([
      Player.countDocuments({
        ...ranked,
        $or: [
          { rating: { $gt: p.rating } },
          { rating: p.rating, "stats.matchesPlayed": { $gt: p.stats.matchesPlayed } },
          { rating: p.rating, "stats.matchesPlayed": p.stats.matchesPlayed, createdAt: { $lt: created } },
        ],
      }),
      Player.countDocuments(ranked),
    ]);
    return { rank: ahead + 1, total };
  },

  /** Everything the public club profile needs beyond the club + squad. */
  async getClubProfileExtras(clubId: string) {
    if (!isId(clubId)) return null;
    await connectDB();
    const club = await Club.findById(clubId).lean<any>();
    if (!club) return null;

    const leaderIds = [club.presidentId, club.captainId, club.viceCaptainId].filter(Boolean);
    const [leaders, manager, staffUsers, moves, tourns, rankAhead, rankTotal] = await Promise.all([
      Player.find({ _id: { $in: leaderIds } }, { fullName: 1, username: 1, avatar: 1 }).lean(),
      club.managerId ? User.findById(club.managerId, { fullName: 1, username: 1, avatar: 1 }).lean<any>() : null,
      Player.find({ userId: { $in: (club.staff || []).map((s: any) => s.userId) } }, { fullName: 1, username: 1, avatar: 1, userId: 1 }).lean(),
      TransferHistory.find({ $or: [{ newClubId: club._id }, { oldClubId: club._id }] }).sort({ transferDate: -1 }).limit(60).lean(),
      Tournament.find({ participantType: "CLUB", clubParticipants: { $elemMatch: { clubId: club._id, status: { $ne: "REMOVED" } } } }, { name: 1, slug: 1, logo: 1, status: 1, winnerClubId: 1, clubParticipants: 1 }).lean(),
      Club.countDocuments({ status: "ACTIVE", "stats.matches": { $gt: 0 }, points: { $gt: club.points || 0 } }),
      Club.countDocuments({ status: "ACTIVE", "stats.matches": { $gt: 0 } }),
    ]);
    const lm = new Map(leaders.map((p: any) => [String(p._id), p]));
    const mini = (p: any) => (p ? { username: p.username, fullName: p.fullName, avatar: p.avatar || PLACEHOLDER.avatar } : null);

    const moverIds = moves.map((m: any) => m.playerId).filter(Boolean);
    const movers = await Player.find({ _id: { $in: moverIds } }, { username: 1, avatar: 1 }).lean();
    const mm = new Map(movers.map((p: any) => [String(p._id), p]));

    return {
      manager: manager ? { username: manager.username, fullName: manager.fullName, avatar: manager.avatar || PLACEHOLDER.avatar } : null,
      president: mini(lm.get(String(club.presidentId))),
      captain: mini(lm.get(String(club.captainId))),
      viceCaptain: mini(lm.get(String(club.viceCaptainId))),
      staff: staffUsers.map((p: any) => ({
        ...mini(p),
        access: (club.staff || []).find((s: any) => String(s.userId) === String(p.userId))?.access || "full_control",
      })),
      transfers: moves.map((m: any) => {
        const p: any = mm.get(String(m.playerId)) || {};
        return {
          id: String(m._id),
          date: new Date(m.transferDate).toISOString(),
          direction: String(m.newClubId) === String(club._id) ? "IN" : "OUT",
          playerName: m.playerName,
          username: p.username,
          avatar: p.avatar || PLACEHOLDER.avatar,
          otherClub: String(m.newClubId) === String(club._id) ? m.previousClubName : m.newClubName,
          fee: m.fee || 0,
          type: m.transferType || "free",
        };
      }),
      tournaments: tourns.map((t: any) => {
        const entry = (t.clubParticipants || []).find((c: any) => String(c.clubId) === String(club._id));
        return {
          id: String(t._id),
          name: t.name,
          slug: t.slug,
          logo: t.logo || PLACEHOLDER.logo,
          status: t.status,
          won: t.winnerClubId && String(t.winnerClubId) === String(club._id),
          joinedAt: entry ? new Date(entry.joinedAt).toISOString() : undefined,
        };
      }),
      rank: club.stats?.matches ? { rank: rankAhead + 1, total: rankTotal } : { rank: null, total: rankTotal },
    };
  },

  /** A player's club moves, newest first, with club logos for the timeline. */
  async getTransferHistoryForPlayer(playerId: string) {
    if (!isId(playerId)) return [];
    await connectDB();
    const list = await TransferHistory.find({ playerId }).sort({ transferDate: -1 }).lean();
    const clubs = await clubMap(list.flatMap((h: any) => [h.newClubId, h.oldClubId]).filter(Boolean));
    return list.map((h: any) => ({
      id: String(h._id),
      date: new Date(h.transferDate).toISOString(),
      newClub: clubMini(clubs.get(String(h.newClubId))) || { name: h.newClubName },
      oldClub: h.oldClubId ? clubMini(clubs.get(String(h.oldClubId))) || { name: h.previousClubName } : null,
      fee: h.fee || 0,
      type: h.transferType || "free",
      shirtNo: h.legacy?.shirtNo || "",
    }));
  },

  async getTransferHistory() {
    await connectDB();
    const list = await TransferHistory.find({}).sort({ transferDate: -1 }).limit(200).lean();
    return plain<any[]>(list);
  },

  // ----- Disciplinary -----
  async getDisciplinaryRecords() {
    await connectDB();
    await Disciplinary.updateMany({ status: "ACTIVE", endDate: { $lt: new Date() } }, { $set: { status: "EXPIRED" } });
    const list = await Disciplinary.find({}).sort({ createdAt: -1 }).lean();
    return plain<any[]>(list);
  },

  async issueDisciplinaryAction(data: any) {
    if (!isId(data.targetId)) throw new ServiceError("Invalid target", 400);
    await connectDB();
    const durations: Record<string, number | null> = { WARNING: 0, SUSPENSION_1W: 7, SUSPENSION_1M: 30, BAN_SEASON: 180, PERMANENT_BAN: null };
    const days = durations[data.penalty];
    const target: any =
      data.targetType === "PLAYER" ? await Player.findById(data.targetId).lean() : await Club.findById(data.targetId).lean();
    if (!target) throw new ServiceError("Target not found", 404);
    const rec = await Disciplinary.create({
      ...data,
      targetName: target.fullName || target.name,
      endDate: days === null ? undefined : new Date(Date.now() + (days || 0) * 86400000),
      status: data.penalty === "WARNING" ? "EXPIRED" : "ACTIVE",
    });
    if (data.penalty !== "WARNING") {
      const status = data.penalty === "PERMANENT_BAN" || data.penalty === "BAN_SEASON" ? "BANNED" : "SUSPENDED";
      if (data.targetType === "PLAYER") {
        await Player.updateOne({ _id: target._id }, { $set: { status } });
      } else {
        await Club.updateOne({ _id: target._id }, { $set: { status: "SUSPENDED" } });
      }
    }
    if (data.targetType === "PLAYER" && target.userId) {
      await db.notify(String(target.userId), "Disciplinary notice", `${data.penalty.replace(/_/g, " ")}: ${data.reason}`, "/disciplinary");
    }
    await db.addActivityEvent({
      type: "DISCIPLINARY",
      category: "Disciplinary",
      title: `${data.penalty.replace(/_/g, " ")} issued to ${rec.targetName}`,
      description: data.reason,
      targetUrl: "/disciplinary",
      playerId: data.targetType === "PLAYER" ? data.targetId : undefined,
    });
    return plain(rec.toObject());
  },

  async revokeDisciplinary(id: string) {
    if (!isId(id)) throw new ServiceError("Invalid record", 400);
    await connectDB();
    const rec = await Disciplinary.findByIdAndUpdate(id, { $set: { status: "REVOKED" } }, { new: true }).lean<any>();
    if (!rec) throw new ServiceError("Record not found", 404);
    const stillActive = await Disciplinary.exists({ targetId: rec.targetId, status: "ACTIVE" });
    if (!stillActive) {
      if (rec.targetType === "PLAYER") await Player.updateOne({ _id: rec.targetId }, { $set: { status: "ACTIVE" } });
      else await Club.updateOne({ _id: rec.targetId }, { $set: { status: "ACTIVE" } });
    }
    return plain(rec);
  },

  // ----- Activity / Audit / Notifications -----
  async getActivityEvents(category?: string, limit = 60) {
    await connectDB();
    const q: any = { isPublic: { $ne: false } };
    if (category && category !== "All") q.category = category;
    const list = await Activity.find(q).sort({ createdAt: -1 }).limit(limit).lean();
    return plain<any[]>(list);
  },

  async getActivityForUser(userId: string, playerId?: string, limit = 50) {
    await connectDB();
    const or: any[] = [];
    if (isId(userId)) or.push({ userId });
    if (playerId && isId(playerId)) or.push({ playerId });
    if (!or.length) return [];
    const list = await Activity.find({ $or: or }).sort({ createdAt: -1 }).limit(limit).lean();
    return plain<any[]>(list);
  },

  async addActivityEvent(event: {
    type?: string;
    category?: string;
    title: string;
    description?: string;
    avatar?: string;
    targetUrl?: string;
    userId?: string;
    playerId?: string;
    isPublic?: boolean;
  }) {
    await connectDB();
    const doc: any = { ...event };
    if (doc.userId && !isId(doc.userId)) delete doc.userId;
    if (doc.playerId && !isId(doc.playerId)) delete doc.playerId;
    return plain((await Activity.create(doc)).toObject());
  },

  async getAuditLogs(limit = 300) {
    await connectDB();
    return plain<any[]>(await AuditLog.find({}).sort({ createdAt: -1 }).limit(limit).lean());
  },

  async addAuditLog(log: { adminId?: string; adminName?: string; action: string; target?: string; details?: string; ipAddress?: string }) {
    await connectDB();
    const doc: any = { ...log };
    if (doc.adminId && !isId(doc.adminId)) delete doc.adminId;
    return AuditLog.create(doc);
  },

  async notify(userId: string, title: string, message = "", link?: string) {
    if (!isId(userId)) return;
    await connectDB();
    await Notification.create({ userId, title, message, link });
  },

  async getNotifications(userId: string) {
    if (!isId(userId)) return [];
    await connectDB();
    return plain<any[]>(await Notification.find({ userId }).sort({ createdAt: -1 }).limit(100).lean());
  },

  async markNotificationsRead(userId: string) {
    await connectDB();
    await Notification.updateMany({ userId, read: false }, { $set: { read: true } });
  },

  async unreadNotificationCount(userId: string) {
    if (!isId(userId)) return 0;
    await connectDB();
    return Notification.countDocuments({ userId, read: false });
  },

  // ----- CMS -----
  async getNews(category?: string, opts: { includeUnpublished?: boolean; limit?: number } = {}) {
    await connectDB();
    const q: any = opts.includeUnpublished ? {} : { isPublished: true, publishedDate: { $lte: new Date() } };
    if (category && category !== "ALL") q.category = category;
    const list = await News.find(q).sort({ publishedDate: -1 }).limit(opts.limit || 200).lean();
    return list.map((n: any) => ({ ...plain<any>(n), featuredImage: n.featuredImage || PLACEHOLDER.news, publishedDate: new Date(n.publishedDate).toISOString() }));
  },

  async getNewsBySlug(slug: string) {
    await connectDB();
    const n = await News.findOneAndUpdate({ slug, isPublished: true }, { $inc: { views: 1 } }, { new: true }).lean<any>();
    return n ? { ...plain<any>(n), featuredImage: n.featuredImage || PLACEHOLDER.news, publishedDate: new Date(n.publishedDate).toISOString() } : null;
  },

  async getLeadership() {
    await connectDB();
    const list = await Leader.find({}).sort({ order: 1, createdAt: 1 }).lean();
    return list.map((l: any) => ({ ...plain<any>(l), photo: l.photo || PLACEHOLDER.avatar }));
  },

  async getPartners() {
    await connectDB();
    const list = await Partner.find({}).sort({ order: 1, createdAt: 1 }).lean();
    return list.map((p: any) => ({ ...plain<any>(p), logo: p.logo || PLACEHOLDER.logo }));
  },

  async getSponsors() {
    await connectDB();
    const list = await Sponsor.find({}).sort({ priority: 1, createdAt: 1 }).lean();
    return list.map((s: any) => ({ ...plain<any>(s), logo: s.logo || PLACEHOLDER.logo }));
  },

  // Generic admin CRUD for simple content collections (data is validated by the caller).
  async adminList(resource: AdminResource) {
    await connectDB();
    const M = RESOURCE_MODELS[resource];
    const projection = resource === "tournaments" ? { "participants.userId": 0, "participants.playerId": 0, "participants.clubId": 0 } : resource === "events" ? { "registrations.userId": 0, "registrations.playerId": 0 } : {};
    const list = await M.find({}, projection).sort(RESOURCE_SORT[resource]).limit(1000).lean();
    return plain<any[]>(list).map((row: any) => {
      if (resource === "tournaments") {
        const { participants, ...rest } = row;
        return { ...rest, currentParticipants: (participants || []).filter((p: any) => p.status !== "REMOVED").length };
      }
      if (resource === "events") {
        const { registrations, ...rest } = row;
        return { ...rest, registeredCount: (registrations || []).length };
      }
      return row;
    });
  },

  async adminCreate(resource: AdminResource, data: any) {
    switch (resource) {
      case "clubs":
        return db.createClub(data);
      case "tournaments":
        return db.createTournament(data);
      case "events":
        return db.createEvent(data);
    }
    await connectDB();
    const M = RESOURCE_MODELS[resource];
    const doc: any = { ...data };
    if (resource === "news") doc.slug = await uniqueSlug(News, data.title);
    const created = await M.create(doc);
    if (resource === "news" && created.isPublished) {
      await db.addActivityEvent({ type: "NEWS", category: "Tournaments", title: `News: ${created.title}`, avatar: created.featuredImage, targetUrl: `/news/${created.slug}` });
    }
    return plain(created.toObject());
  },

  async adminUpdate(resource: AdminResource, id: string, data: any) {
    if (!isId(id)) throw new ServiceError("Invalid id", 400);
    switch (resource) {
      case "clubs":
        return db.updateClub(id, data);
      case "tournaments":
        return db.updateTournament(id, data);
      case "events":
        return db.updateEvent(id, data);
    }
    await connectDB();
    const M = RESOURCE_MODELS[resource];
    const set = { ...data };
    if (resource === "news" && data.title) {
      const existing = await News.findById(id, { title: 1 }).lean<any>();
      if (existing && existing.title !== data.title) set.slug = await uniqueSlug(News, data.title, id);
    }
    const doc = await M.findByIdAndUpdate(id, { $set: set }, { new: true, runValidators: true }).lean();
    if (!doc) throw new ServiceError("Not found", 404);
    return plain(doc);
  },

  async adminDelete(resource: AdminResource, id: string) {
    if (!isId(id)) throw new ServiceError("Invalid id", 400);
    switch (resource) {
      case "clubs":
        return db.deleteClub(id);
      case "tournaments":
        return db.deleteTournament(id);
    }
    await connectDB();
    const M = RESOURCE_MODELS[resource];
    if (resource === "referees") await Fixture.updateMany({ refereeId: id }, { $unset: { refereeId: 1 } });
    await M.deleteOne({ _id: id });
    return true;
  },

  // ----- Settings -----
  async getSiteSettings(): Promise<SiteSettings> {
    try {
      await connectDB();
      const s = await Setting.findOne({ key: "site" }).lean<any>();
      return mergeSettings(DEFAULT_SITE_SETTINGS, s?.value);
    } catch (err) {
      console.error("Failed to load site settings:", err);
      return DEFAULT_SITE_SETTINGS;
    }
  },

  async updateSiteSettings(value: SiteSettings) {
    await connectDB();
    const merged = mergeSettings(DEFAULT_SITE_SETTINGS, value);
    await Setting.updateOne({ key: "site" }, { $set: { value: merged } }, { upsert: true });
    return merged;
  },

  // ----- Media -----
  async saveMedia(data: Buffer, contentType: string, filename: string, uploadedBy?: string) {
    await connectDB();
    const m = await Media.create({ data, contentType, size: data.length, filename, uploadedBy: uploadedBy && isId(uploadedBy) ? uploadedBy : undefined });
    return String(m._id);
  },

  async getMedia(id: string) {
    if (!isId(id)) return null;
    await connectDB();
    return Media.findById(id).lean<any>();
  },

  // ----- Stats -----
  async getPlatformStats() {
    await connectDB();
    const [players, clubs, finished, live, activeTourn, refs, transfers, goals, users, pendingResults] = await Promise.all([
      Player.countDocuments({}),
      Club.countDocuments({ status: "ACTIVE" }),
      Fixture.countDocuments({ status: "FINISHED" }),
      Fixture.countDocuments({ status: "LIVE" }),
      Tournament.countDocuments({ status: { $in: ["ONGOING", "REGISTRATION_OPEN"] } }),
      Referee.countDocuments({}),
      TransferHistory.countDocuments({}),
      Player.aggregate([{ $group: { _id: null, g: { $sum: "$stats.goalsScored" } } }]),
      User.countDocuments({}),
      Fixture.countDocuments({ "result.status": "PENDING" }),
    ]);
    const totalTournaments = await Tournament.countDocuments({ status: { $ne: "DRAFT" } });
    return {
      registeredPlayers: players,
      registeredUsers: users,
      activeClubs: clubs,
      completedMatches: finished,
      liveMatches: live,
      activeTournaments: activeTourn,
      totalTournaments,
      registeredOfficials: refs,
      totalTransfers: transfers,
      totalGoalsScored: goals[0]?.g || 0,
      pendingResults,
    };
  },
};

export type AdminResource = "news" | "events" | "partners" | "sponsors" | "leaders" | "referees" | "clubs" | "tournaments";

const RESOURCE_MODELS: Record<AdminResource, any> = {
  news: News,
  events: Event,
  partners: Partner,
  sponsors: Sponsor,
  leaders: Leader,
  referees: Referee,
  clubs: Club,
  tournaments: Tournament,
};

const RESOURCE_SORT: Record<AdminResource, any> = {
  news: { publishedDate: -1 },
  events: { eventDate: -1 },
  partners: { order: 1 },
  sponsors: { priority: 1 },
  leaders: { order: 1 },
  referees: { tier: 1, name: 1 },
  clubs: { name: 1 },
  tournaments: { createdAt: -1 },
};
