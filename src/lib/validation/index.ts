import { z } from "zod";

// ---------- Shared field types ----------

const trimmed = (max: number) => z.string().trim().max(max);

/** Image: empty, site-relative path (e.g. uploaded /api/media/..), or http(s) URL. */
export const imageUrl = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || /^https?:\/\//i.test(v), "Must be an uploaded image or an http(s) URL");

/** Link target: empty, relative path, anchor, http(s) or mailto. Blocks javascript: etc. */
export const safeLink = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || (v.startsWith("/") && !v.startsWith("//")) || v.startsWith("#") || /^(https?:\/\/|mailto:|tel:)/i.test(v), "Invalid link");

const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^https?:\/\//i.test(v), "Must be a valid http(s) URL")
  .optional()
  .default("");

const dateInput = z
  .union([z.string(), z.date()])
  .transform((v, ctx) => {
    if (v === "" || v === null) return undefined;
    const d = new Date(v);
    if (isNaN(d.getTime())) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Invalid date" });
      return z.NEVER;
    }
    return d;
  });

const objectId = z.string().regex(/^[a-f0-9]{24}$/i, "Invalid id");
const optionalId = z.union([objectId, z.literal("")]).optional();

export const password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128, "Password is too long")
  .regex(/[a-z]/, "Password needs a lowercase letter")
  .regex(/[A-Z]/, "Password needs an uppercase letter")
  .regex(/[0-9]/, "Password needs a number");

/** Date of birth as YYYY-MM-DD; the person must be 8–100 years old. */
export const dob = z
  .string({ required_error: "Please enter your date of birth" })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Please enter your date of birth")
  .refine((s) => {
    const d = new Date(`${s}T00:00:00Z`);
    if (isNaN(d.getTime())) return false;
    const age = (Date.now() - d.getTime()) / (365.25 * 86400000);
    return age >= 8 && age <= 100;
  }, "Please enter a valid date of birth");

export const ROLES = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE", "CLUB_MANAGER", "PLAYER"] as const;

// ---------- Auth ----------

export const RegisterSchema = z.object({
  fullName: trimmed(60).min(2, "Full name must be at least 2 characters"),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .min(3, "Username must be at least 3 characters")
    .max(30)
    .regex(/^[a-z0-9_-]+$/, "Username can only contain letters, numbers, underscores and hyphens"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(120),
  password,
  konamiId: trimmed(40).min(5, "Konami ID / In-game UID is required"),
  deviceModel: trimmed(60).min(2, "Device model is required"),
  dob,
  facebookProfile: optionalUrl,
  preferredPosition: trimmed(10).default("CF"),
  playStyle: trimmed(40).default("Possession Game"),
  phone: trimmed(30).optional().default(""),
  bio: trimmed(300).optional().default(""),
  website: z.string().max(0).optional(), // honeypot: must stay empty
});

export const ClubRegisterSchema = z.object({
  clubName: trimmed(60).min(3, "Club name must be at least 3 characters"),
  shortName: z
    .string()
    .trim()
    .min(2, "Short tag must be 2-6 letters")
    .max(6, "Short tag must be 2-6 letters")
    .regex(/^[A-Za-z0-9]+$/, "Short tag can only contain letters and numbers")
    .transform((s) => s.toUpperCase()),
  managerName: trimmed(60).min(2, "Manager name is required"),
  email: z.string().trim().toLowerCase().email("Please enter a valid email address").max(120),
  password,
  phone: trimmed(30).optional().default(""),
  location: trimmed(80).optional().default(""),
  facebookPage: optionalUrl,
  slogan: trimmed(120).optional().default(""),
  description: trimmed(500).optional().default(""),
  website: z.string().max(0).optional(), // honeypot
});

/** Fields a club manager / club moderator may edit on their own club. */
export const ClubSelfUpdateSchema = z.object({
  logo: imageUrl.optional(),
  banner: imageUrl.optional(),
  slogan: trimmed(120).optional(),
  description: trimmed(1000).optional(),
  location: trimmed(80).optional(),
  facebookPage: optionalUrl,
});

export const LoginSchema = z.object({
  emailOrUsername: trimmed(120).min(1, "Email or username is required"),
  password: z.string().min(1, "Password is required").max(128),
});

export const ForgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email("Enter a valid email"),
});

export const ResetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  password,
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: password,
});

// ---------- Players ----------

export const PlayerSelfUpdateSchema = z.object({
  fullName: trimmed(60).min(2).optional(),
  avatar: imageUrl.optional(),
  coverImage: imageUrl.optional(),
  konamiId: trimmed(40).min(5).optional(),
  deviceModel: trimmed(60).min(2).optional(),
  dob: dob.optional(),
  facebookProfile: optionalUrl,
  preferredPosition: trimmed(10).optional(),
  playStyle: trimmed(40).optional(),
  bio: trimmed(300).optional(),
  phone: trimmed(30).optional(),
  location: trimmed(80).optional(),
});

/** What a club manager may change on a player in their own squad. */
export const ClubPlayerUpdateSchema = z.object({
  avatar: imageUrl.optional(),
  konamiId: trimmed(40).min(5, "Konami ID must be at least 5 characters").optional(),
  deviceModel: trimmed(60).min(2, "Device model is required").optional(),
  shirtNo: z.union([z.coerce.number().int().min(1, "Shirt number must be 1–99").max(99, "Shirt number must be 1–99"), z.literal(""), z.null()]).optional(),
});

export const PlayerAdminUpdateSchema =PlayerSelfUpdateSchema.extend({
  status: z.enum(["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "BANNED", "INACTIVE"]).optional(),
  isVerified: z.boolean().optional(),
  clubId: optionalId,
  rating: z.coerce.number().min(100).max(3000).optional(),
  marketValue: z.coerce.number().min(0).max(100000).optional(),
});

export const UserAdminUpdateSchema = z.object({
  fullName: trimmed(60).min(2).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "BANNED", "INACTIVE"]).optional(),
  clubId: optionalId,
});

export const UserAdminCreateSchema = z.object({
  fullName: trimmed(60).min(2),
  username: z.string().trim().toLowerCase().min(3).max(30).regex(/^[a-z0-9_-]+$/),
  email: z.string().trim().toLowerCase().email(),
  password,
  role: z.enum(ROLES).default("PLAYER"),
  createPlayerProfile: z.boolean().default(true),
  konamiId: trimmed(40).optional().default(""),
});

// ---------- Content resources (admin) ----------

export const ClubSchema = z.object({
  name: trimmed(60).min(3, "Club name is required"),
  shortName: trimmed(6).min(2, "Short name is required").transform((s) => s.toUpperCase()),
  location: trimmed(80).optional().default(""),
  facebookPage: optionalUrl,
  description: trimmed(1000).optional().default(""),
  logo: imageUrl.optional().default(""),
  banner: imageUrl.optional().default(""),
  status: z.enum(["ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"]).optional().default("ACTIVE"),
  managerId: optionalId,
  slogan: trimmed(120).optional().default(""),
  email: z.union([z.string().trim().toLowerCase().email(), z.literal("")]).optional().default(""),
  isAcademy: z.boolean().optional().default(false),
  trophiesCount: z.coerce.number().int().min(0).max(1000).optional().default(0),
  marketValue: z.coerce.number().min(0).max(100000).optional().default(0),
});

export const TournamentBaseSchema = z.object({
    name: trimmed(100).min(3, "Tournament name is required"),
    season: trimmed(40).optional().default(""),
    description: trimmed(3000).optional().default(""),
    rules: trimmed(10000).optional().default(""),
    format: z.enum(["SINGLE_ELIMINATION", "DOUBLE_ELIMINATION", "LEAGUE_ROUND_ROBIN", "GROUP_AND_KNOCKOUT", "SWISS", "CLUB_BATTLE", "NATIONAL_TOURNAMENT"]).default("SINGLE_ELIMINATION"),
    gameCategory: trimmed(60).optional().default("eFootball Mobile"),
    platform: trimmed(40).optional().default("Mobile"),
    startDate: dateInput.optional(),
    endDate: dateInput.optional(),
    registrationDeadline: dateInput.optional(),
    maxParticipants: z.coerce.number().int().min(2).max(1024).default(32),
    prizePool: trimmed(60).optional().default(""),
    entryFee: trimmed(40).optional().default("Free"),
    status: z.enum(["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED", "CANCELLED"]).default("DRAFT"),
    isFeatured: z.boolean().optional().default(false),
    participantType: z.literal("CLUB").default("CLUB"),
    banner: imageUrl.optional().default(""),
    logo: imageUrl.optional().default(""),
    winnerPlayerId: optionalId,
});

export const TournamentSchema = TournamentBaseSchema.refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const EventSchema = z.object({
  name: trimmed(100).min(3, "Event name is required"),
  description: trimmed(3000).optional().default(""),
  eventType: trimmed(40).optional().default("Meetup"),
  venue: trimmed(120).optional().default(""),
  eventDate: dateInput,
  registrationDeadline: dateInput.optional(),
  capacity: z.coerce.number().int().min(1).max(100000).default(100),
  prizePool: trimmed(60).optional().default(""),
  status: z.enum(["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"]).default("ACTIVE"),
  registrationOpen: z.boolean().optional().default(true),
  banner: imageUrl.optional().default(""),
});

export const NewsSchema = z.object({
  title: trimmed(160).min(3, "Title is required"),
  excerpt: trimmed(400).optional().default(""),
  content: trimmed(50000).optional().default(""),
  featuredImage: imageUrl.optional().default(""),
  author: trimmed(80).optional().default("Editorial Team"),
  category: trimmed(40).optional().default("Announcement"),
  tags: z
    .union([z.array(trimmed(30)), z.string()])
    .transform((v) => (Array.isArray(v) ? v : v.split(",").map((t) => t.trim()).filter(Boolean)))
    .optional()
    .default([]),
  publishedDate: dateInput.optional(),
  isFeatured: z.boolean().optional().default(false),
  isPublished: z.boolean().optional().default(true),
});

export const PartnerSchema = z.object({
  name: trimmed(80).min(2),
  category: trimmed(40).optional().default("Partner"),
  logo: imageUrl.optional().default(""),
  website: optionalUrl,
  description: trimmed(300).optional().default(""),
  order: z.coerce.number().int().optional().default(0),
});

export const SponsorSchema = z.object({
  name: trimmed(80).min(2),
  logo: imageUrl.optional().default(""),
  website: optionalUrl,
  placement: trimmed(40).optional().default("Homepage"),
  priority: z.coerce.number().int().optional().default(0),
});

export const LeaderSchema = z.object({
  name: trimmed(80).min(2),
  role: trimmed(80).optional().default(""),
  category: trimmed(40).optional().default("Core Team"),
  photo: imageUrl.optional().default(""),
  period: trimmed(40).optional().default(""),
  bio: trimmed(500).optional().default(""),
  facebook: optionalUrl,
  order: z.coerce.number().int().optional().default(0),
});

export const RefereeSchema = z.object({
  name: trimmed(80).min(2),
  officialId: trimmed(30).optional().default(""),
  avatar: imageUrl.optional().default(""),
  tier: z.enum(["TIER_1", "TIER_2", "TIER_3"]).default("TIER_2"),
  role: trimmed(80).optional().default("Match Official"),
  rating: z.coerce.number().min(0).max(5).optional().default(4.5),
  matchesOfficiated: z.coerce.number().int().min(0).optional().default(0),
  fairPlayScore: z.coerce.number().min(0).max(100).optional().default(95),
  bio: trimmed(500).optional().default(""),
  status: z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]).optional().default("ACTIVE"),
});

// ---------- Fixtures / results ----------

export const FixtureCreateSchema = z.object({
  tournamentId: optionalId,
  homeClubId: optionalId,
  awayClubId: optionalId,
  homePlayerId: optionalId,
  awayPlayerId: optionalId,
  refereeId: optionalId,
  scheduledDate: dateInput,
  venue: trimmed(120).optional().default("Online"),
  round: trimmed(60).optional().default("Regular Season"),
  isOnStream: z.boolean().optional().default(false),
  streamUrl: optionalUrl,
  streamPlatform: trimmed(40).optional().default(""),
});

export const FixtureUpdateSchema = z.object({
  tournamentId: optionalId,
  homeClubId: optionalId,
  awayClubId: optionalId,
  homePlayerId: optionalId,
  awayPlayerId: optionalId,
  refereeId: optionalId,
  scheduledDate: dateInput.optional(),
  venue: trimmed(120).optional(),
  round: trimmed(60).optional(),
  isOnStream: z.boolean().optional(),
  streamUrl: optionalUrl.optional(),
  streamPlatform: trimmed(40).optional(),
});

const score = z.coerce.number().int().min(0).max(99);

export const MatchResultSchema = z.object({
  homeScore: score,
  awayScore: score,
  homePenalties: score.optional().nullable(),
  awayPenalties: score.optional().nullable(),
  motmPlayerId: optionalId,
  motmReason: trimmed(250).optional().default(""),
  proofScreenshot: imageUrl.optional().default(""),
  notes: trimmed(500).optional().default(""),
});

export const LiveScoreSchema = z.object({ home: score, away: score });

// ---------- Transfers & discipline ----------

export const TransferRequestSchema = z.object({
  playerId: objectId,
  targetClubId: objectId,
  offeredFee: z.coerce.number().min(0).max(100000).default(0),
  proposedSalary: z.coerce.number().min(0).max(100000).optional(),
  message: trimmed(300).optional().default(""),
});

export const DisciplinaryActionSchema = z.object({
  targetType: z.enum(["PLAYER", "CLUB"]),
  targetId: objectId,
  reason: trimmed(500).min(5, "Reason is required"),
  penalty: z.enum(["WARNING", "SUSPENSION_1W", "SUSPENSION_1M", "BAN_SEASON", "PERMANENT_BAN"]),
  evidence: trimmed(1000).optional().default(""),
  notes: trimmed(1000).optional().default(""),
});
