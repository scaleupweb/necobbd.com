/**
 * Imports the export from the previous NECOB website (CSV files) into MongoDB.
 *
 *   npm run db:import-legacy -- <folder-with-csv-files> [--media-base=https://old-site/uploads/] [--dry-run]
 *
 * Expected files: users.csv, clubs.csv, club_access.csv, transfers.csv,
 * tournaments.csv, tournament_participants.csv
 *
 * Safe to run more than once: records are matched on their old id (legacy.id)
 * and updated instead of duplicated. Existing passwords keep working because
 * the old bcrypt hashes are imported as-is.
 */
import fs from "fs";
import path from "path";
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local", quiet: true });
config({ path: ".env", quiet: true });

type Row = Record<string, string | null>;

function parseCsv(text: string): Row[] {
  const rows: (string | null)[][] = [];
  let row: (string | null)[] = [];
  let field = "";
  let inQuotes = false;
  let quoted = false;
  const push = () => {
    row.push(quoted ? field : field === "NULL" || field === "" ? null : field);
    field = "";
    quoted = false;
  };
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else inQuotes = false;
      } else field += c;
    } else if (c === '"') {
      inQuotes = true;
      quoted = true;
    } else if (c === ",") push();
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && text[i + 1] === "\n") i++;
      push();
      rows.push(row);
      row = [];
    } else field += c;
  }
  if (field || row.length) {
    push();
    rows.push(row);
  }
  const header = rows.shift() as string[];
  return rows.filter((r) => r.length > 1).map((r) => Object.fromEntries(header.map((h, i) => [h, (r[i] ?? null) as string | null])));
}

const args = process.argv.slice(2);
const dir = args.find((a) => !a.startsWith("--"));
const mediaBase = (args.find((a) => a.startsWith("--media-base="))?.split("=")[1] || "").replace(/\/?$/, "/");
const dryRun = args.includes("--dry-run");

const str = (v: string | null | undefined) => (v ?? "").trim();
const date = (v: string | null | undefined) => {
  const s = str(v);
  if (!s || s.startsWith("0000")) return undefined;
  const d = new Date(s.replace(" ", "T") + (s.length > 10 ? "+06:00" : "T00:00:00+06:00"));
  return isNaN(d.getTime()) ? undefined : d;
};
const media = (file: string | null | undefined) => (mediaBase !== "/" && str(file) ? mediaBase + str(file) : undefined);
const fixHash = (h: string | null | undefined) => str(h).replace(/^\$2y\$/, "$2b$");
const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "club";
const url = (v: string | null | undefined) => (/^https?:\/\//i.test(str(v)) ? str(v) : "");

async function main() {
  if (!dir) throw new Error("Pass the folder that contains the CSV files");
  const read = (name: string) => {
    const file = path.join(dir, `${name}.csv`);
    if (!fs.existsSync(file)) throw new Error(`Missing ${file}`);
    return parseCsv(fs.readFileSync(file, "utf8"));
  };
  const users = read("users");
  const clubs = read("clubs");
  const access = read("club_access");
  const transfers = read("transfers");
  const tournaments = read("tournaments");
  const participants = read("tournament_participants");
  console.log(`Read ${users.length} users, ${clubs.length} clubs, ${access.length} club access, ${transfers.length} transfers, ${tournaments.length} tournaments, ${participants.length} tournament entries`);
  if (mediaBase === "/") console.log("No --media-base given: images are kept as file names only (placeholders will show).");
  if (dryRun) return;

  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_URL is not set");
  await mongoose.connect(uri);
  const { User, Player, Club, Tournament, TransferHistory, TransferRequest } = await import("../src/lib/db/models");
  const { calculatePlayerMarketValue } = await import("../src/lib/valuation/engine");
  const baseValue = calculatePlayerMarketValue({ rating: 750, matchesPlayed: 0, winRate: 0, goalsScored: 0, motmCount: 0, cleanSheets: 0, recentForm: "" });
  const noTs = { upsert: true, timestamps: false } as const;

  // ---- Clubs (without people links yet) ----
  const clubIdMap = new Map<string, any>();
  const clubNameMap = new Map<string, string>();
  for (const c of clubs) {
    const legacyId = str(c.id);
    const existing = await Club.findOne({ "legacy.id": legacyId, "legacy.source": "necob" }, { _id: 1, slug: 1 }).lean<any>();
    let s = existing?.slug;
    if (!s) {
      const base = slug(str(c.name) || str(c.short_name));
      s = base;
      for (let n = 2; await Club.exists({ slug: s }); n++) s = `${base}-${n}`;
    }
    const logo = media(c.logo);
    const cover = media(c.cover);
    await Club.updateOne(
      { "legacy.id": legacyId, "legacy.source": "necob" },
      {
        $set: {
          name: str(c.name) || `Club ${legacyId}`,
          shortName: (str(c.short_name) || str(c.name).slice(0, 4) || "CLB").toUpperCase().slice(0, 10),
          slug: s,
          email: str(c.email).toLowerCase(),
          slogan: str(c.slogan),
          location: str(c.location),
          facebookPage: url(c.fb_link),
          foundedDate: date(c.founded_on) || date(c.created_at),
          status: str(c.status) === "active" ? "ACTIVE" : "INACTIVE",
          isAcademy: str(c.academy) === "active",
          ...(logo ? { logo } : {}),
          ...(cover ? { banner: cover } : {}),
          legacy: { source: "necob", id: legacyId, logo: str(c.logo), cover: str(c.cover), presidentId: str(c.president_id), captainId: str(c.captain_id), viceCaptainId: str(c.vice_captain_id) },
          updatedAt: date(c.updated_at) || new Date(),
        },
        $setOnInsert: { createdAt: date(c.created_at) || new Date() },
      },
      noTs
    );
    const doc = await Club.findOne({ "legacy.id": legacyId, "legacy.source": "necob" }, { _id: 1 }).lean<any>();
    clubIdMap.set(legacyId, doc._id);
    clubNameMap.set(legacyId, str(c.name));
  }
  console.log(`✓ ${clubIdMap.size} clubs`);

  // ---- Users + player profiles ----
  const userIdMap = new Map<string, any>();
  const playerIdMap = new Map<string, any>();
  let skipped = 0;
  for (const u of users) {
    const legacyId = str(u.id);
    const email = str(u.email).toLowerCase();
    if (!email || !u.password_hash) {
      skipped++;
      continue;
    }
    const existing = await User.findOne({ "legacy.id": legacyId, "legacy.source": "necob" }, { _id: 1, username: 1 }).lean<any>();
    // Someone who already signed up on the new site with the same email keeps their account; we just link it.
    const sameEmail = existing ? null : await User.findOne({ email }, { _id: 1, username: 1, legacy: 1 }).lean<any>();

    let username = existing?.username || sameEmail?.username;
    if (!username) {
      const base = (str(u.username) || `player${legacyId}`).toLowerCase().replace(/[^a-z0-9._-]/g, "").slice(0, 30) || `player${legacyId}`;
      username = base;
      for (let n = 2; (await User.exists({ username })) || (await Player.exists({ username })); n++) username = `${base}-${n}`;
    }

    const clubId = u.club_id ? clubIdMap.get(str(u.club_id)) : undefined;
    const avatar = media(u.avatar);
    const cover = media(u.cover);
    const createdAt = date(u.created_at) || new Date();
    const phone = str(u.whatsapp_number) ? `${str(u.whatsapp_code)}${str(u.whatsapp_number)}` : "";

    const filter = existing ? { _id: existing._id } : sameEmail ? { _id: sameEmail._id } : { "legacy.id": legacyId, "legacy.source": "necob" };
    await User.updateOne(
      filter,
      {
        $set: {
          fullName: str(u.name) || username,
          ...(clubId ? { clubId } : {}),
          ...(avatar ? { avatar } : {}),
          legacy: { source: "necob", id: legacyId, status: str(u.status) },
          updatedAt: date(u.updated_at) || new Date(),
        },
        $setOnInsert: {
          email,
          username,
          passwordHash: fixHash(u.password_hash),
          role: "PLAYER",
          status: "ACTIVE",
          tokenVersion: 0,
          failedLoginAttempts: 0,
          createdAt,
        },
      },
      noTs
    );
    const user = await User.findOne(filter, { _id: 1, username: 1 }).lean<any>();
    userIdMap.set(legacyId, user._id);

    const contractEnd = date(u.contract_till);
    await Player.updateOne(
      { userId: user._id },
      {
        $set: {
          username: user.username,
          fullName: str(u.name) || user.username,
          konamiId: str(u.konami_uid),
          deviceModel: str(u.device),
          facebookProfile: url(u.fb_link),
          phone,
          location: str(u.district),
          bloodGroup: str(u.blood_group),
          dob: date(u.dob),
          discord: str(u.discord),
          shirtNo: u.shirt_no ? Number(u.shirt_no) || undefined : undefined,
          ...(clubId ? { clubId } : {}),
          contract: clubId
            ? { status: "UNDER_CONTRACT", durationMonths: 0, endDate: contractEnd }
            : { status: "FREE_AGENT", durationMonths: 0 },
          ...(avatar ? { avatar } : {}),
          ...(cover ? { coverImage: cover } : {}),
          legacy: { source: "necob", id: legacyId, avatar: str(u.avatar), cover: str(u.cover), contractOn: str(u.contract_on), reserveTill: str(u.reserve_till) },
          updatedAt: date(u.updated_at) || new Date(),
        },
        $setOnInsert: { userId: user._id, rating: 750, marketValue: baseValue, status: "ACTIVE", createdAt },
      },
      noTs
    );
    const player = await Player.findOne({ userId: user._id }, { _id: 1 }).lean<any>();
    playerIdMap.set(legacyId, player._id);
  }
  console.log(`✓ ${userIdMap.size} players${skipped ? ` (${skipped} skipped: missing email or password)` : ""}`);

  // ---- Club leaders, club login accounts and staff access ----
  let clubLogins = 0;
  for (const c of clubs) {
    const clubId = clubIdMap.get(str(c.id));
    const set: any = {};
    for (const [field, col] of [
      ["presidentId", "president_id"],
      ["captainId", "captain_id"],
      ["viceCaptainId", "vice_captain_id"],
    ] as const) {
      const p = c[col] ? playerIdMap.get(str(c[col])) : undefined;
      if (p) set[field] = p;
    }

    // Each old club had its own email + password login; it becomes a club-manager account.
    const email = str(c.email).toLowerCase();
    let managerId: any;
    if (email && c.password_hash) {
      const owner = await User.findOne({ email }, { _id: 1, role: 1, legacy: 1 }).lean<any>();
      if (owner && owner.legacy?.clubId !== str(c.id) && owner.role !== "CLUB_MANAGER") {
        managerId = owner._id; // a player already uses this email; they manage the club
      } else {
        let username = owner ? undefined : `${slug(str(c.short_name) || str(c.name))}-club`;
        if (username) for (let n = 2; (await User.exists({ username })) || (await Player.exists({ username })); n++) username = `${slug(str(c.short_name))}-club-${n}`;
        await User.updateOne(
          { email },
          {
            $set: { fullName: str(c.name), clubId, legacy: { source: "necob", clubId: str(c.id) } },
            $setOnInsert: {
              ...(username ? { username } : {}),
              passwordHash: fixHash(c.password_hash),
              role: "CLUB_MANAGER",
              status: "ACTIVE",
              tokenVersion: 0,
              failedLoginAttempts: 0,
              createdAt: date(c.created_at) || new Date(),
              updatedAt: new Date(),
            },
          },
          noTs
        );
        managerId = (await User.findOne({ email }, { _id: 1 }).lean<any>())._id;
        clubLogins++;
      }
    }
    if (managerId) set.managerId = managerId;

    const staff = access
      .filter((a) => str(a.club_id) === str(c.id) && userIdMap.get(str(a.player_id)))
      .map((a) => ({ userId: userIdMap.get(str(a.player_id)), access: str(a.access_type) || "full_control" }));
    set.staff = staff;
    await Club.updateOne({ _id: clubId }, { $set: set }, { timestamps: false });
  }
  console.log(`✓ club leaders & staff linked, ${clubLogins} club login accounts`);

  // ---- Transfers (club registrations on the old site) ----
  let hist = 0;
  let pending = 0;
  for (const t of transfers) {
    const legacyId = str(t.id);
    const playerId = playerIdMap.get(str(t.player_id));
    const newClubId = clubIdMap.get(str(t.new_club_id));
    if (!playerId || !newClubId) continue;
    const player = await Player.findById(playerId, { fullName: 1 }).lean<any>();
    const when = date(t.action_at) || new Date();
    if (str(t.status) === "approved") {
      await TransferHistory.updateOne(
        { "legacy.id": legacyId, "legacy.source": "necob" },
        {
          $set: {
            playerId,
            playerName: player?.fullName,
            previousClubName: t.old_club_id ? clubNameMap.get(str(t.old_club_id)) || "Free Agent" : "Free Agent",
            newClubName: clubNameMap.get(str(t.new_club_id)),
            newClubId,
            oldClubId: t.old_club_id ? clubIdMap.get(str(t.old_club_id)) : undefined,
            fee: Number(t.transfer_fee) || 0,
            transferType: str(t.transfer_type) || "free",
            transferDate: when,
            approvedBy: "NECOB (previous site)",
            legacy: { source: "necob", id: legacyId, actionType: str(t.action_type), shirtNo: str(t.shirt_no), contractTill: str(t.contract_till), fbPost: str(t.facebook_post) },
            updatedAt: when,
          },
          $setOnInsert: { createdAt: when },
        },
        noTs
      );
      hist++;
    } else if (str(t.status) === "pending") {
      const exists = await TransferRequest.exists({ playerId, targetClubId: newClubId, status: "PENDING" });
      if (!exists) {
        await TransferRequest.create({
          playerId,
          targetClubId: newClubId,
          offeredFee: Number(t.transfer_fee) || 0,
          message: `Imported from the previous site (${str(t.transfer_type)} transfer${t.trx_id ? `, trx ${str(t.trx_id)}` : ""})`,
          status: "PENDING",
        });
      }
      pending++;
    }
  }
  console.log(`✓ ${hist} transfer records, ${pending} pending transfer requests`);

  // ---- Tournaments with club entries ----
  for (const t of tournaments) {
    const legacyId = str(t.id);
    const entries = participants
      .filter((p) => str(p.edition_id) === legacyId && clubIdMap.get(str(p.club_id)))
      .map((p) => ({
        clubId: clubIdMap.get(str(p.club_id)),
        registeredBy: undefined,
        joinedAt: date(p.created_at) || new Date(),
        status: str(p.status) === "approved" ? "CONFIRMED" : "PENDING",
        paymentType: str(p.payment_type) || "free",
        trxId: str(p.trx_id) || undefined,
        fbPostLink: url(p.fb_post_link) || undefined,
      }));
    const existing = await Tournament.findOne({ "legacy.id": legacyId, "legacy.source": "necob" }, { slug: 1 }).lean<any>();
    let s = existing?.slug;
    if (!s) {
      const base = slug(str(t.name));
      s = base;
      for (let n = 2; await Tournament.exists({ slug: s }); n++) s = `${base}-${n}`;
    }
    const logo = media(t.brand_logo);
    await Tournament.updateOne(
      { "legacy.id": legacyId, "legacy.source": "necob" },
      {
        $set: {
          name: str(t.name),
          slug: s,
          participantType: "CLUB",
          clubParticipants: entries,
          format: str(t.format_type) === "hybrid" ? "GROUP_AND_KNOCKOUT" : "SINGLE_ELIMINATION",
          ...(logo ? { logo } : {}),
          legacy: { source: "necob", id: legacyId, brandLogo: str(t.brand_logo), formatType: str(t.format_type) },
          updatedAt: date(t.updated_at) || new Date(),
        },
        $setOnInsert: {
          status: "ONGOING",
          isFeatured: true,
          maxParticipants: Math.max(64, entries.length),
          entryFee: "Free",
          startDate: date(t.created_at),
          createdAt: date(t.created_at) || new Date(),
        },
      },
      noTs
    );
    console.log(`✓ tournament "${str(t.name)}" with ${entries.length} clubs`);
  }

  for (const m of [User, Player, Club, Tournament, TransferHistory, TransferRequest]) await m.syncIndexes();
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error("Import failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
