import mongoose, { Schema, Model } from "mongoose";

const { ObjectId, Mixed } = Schema.Types;

// Loosely typed on purpose: mongoose's generic model() overloads make tsc run out of memory.
function model(name: string, schema: Schema<any>): Model<any> {
  return (mongoose.models[name] as Model<any>) || (mongoose.model as (n: string, s: Schema<any>) => Model<any>)(name, schema);
}

const opts = { timestamps: true };

// ---------- Users & Players ----------

const UserSchema = new Schema<any>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: ["SUPER_ADMIN", "ADMIN", "MODERATOR", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE", "CLUB_MANAGER", "PLAYER"],
      default: "PLAYER",
    },
    status: { type: String, enum: ["ACTIVE", "PENDING", "SUSPENDED", "BANNED", "INACTIVE"], default: "ACTIVE" },
    avatar: String,
    clubId: { type: ObjectId, ref: "Club" },
    tokenVersion: { type: Number, default: 0 },
    failedLoginAttempts: { type: Number, default: 0 },
    lockUntil: Date,
    lastLoginAt: Date,
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    legacy: { type: Mixed },
  },
  opts
);

const PlayerSchema = new Schema<any>(
  {
    userId: { type: ObjectId, ref: "User", unique: true, sparse: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    fullName: { type: String, required: true },
    avatar: String,
    coverImage: String,
    konamiId: { type: String, default: "" },
    deviceModel: { type: String, default: "" },
    facebookProfile: { type: String, default: "" },
    preferredPosition: { type: String, default: "CF" },
    playStyle: { type: String, default: "Possession Game" },
    bio: { type: String, default: "" },
    phone: { type: String, default: "" },
    location: { type: String, default: "" },
    rating: { type: Number, default: 750 },
    marketValue: { type: Number, default: 5 },
    status: { type: String, enum: ["ACTIVE", "PENDING_VERIFICATION", "SUSPENDED", "BANNED", "INACTIVE"], default: "ACTIVE" },
    isVerified: { type: Boolean, default: false },
    formHistory: { type: String, default: "" },
    motmCount: { type: Number, default: 0 },
    clubId: { type: ObjectId, ref: "Club" },
    shirtNo: Number,
    bloodGroup: { type: String, default: "" },
    dob: Date,
    discord: { type: String, default: "" },
    // Record from the previous NECOB website (ids and original image file names).
    legacy: { type: Mixed },
    stats: {
      matchesPlayed: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      goalsScored: { type: Number, default: 0 },
      goalsConceded: { type: Number, default: 0 },
      assists: { type: Number, default: 0 },
      cleanSheets: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
    },
    contract: {
      status: { type: String, default: "FREE_AGENT" },
      durationMonths: { type: Number, default: 0 },
      endDate: Date,
    },
  },
  opts
);

// ---------- Clubs ----------

const ClubSchema = new Schema<any>(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String, required: true, uppercase: true, trim: true },
    slug: { type: String, required: true, unique: true },
    logo: String,
    banner: String,
    managerId: { type: ObjectId, ref: "User" },
    email: { type: String, default: "", lowercase: true, trim: true },
    slogan: { type: String, default: "" },
    presidentId: { type: ObjectId, ref: "Player" },
    captainId: { type: ObjectId, ref: "Player" },
    viceCaptainId: { type: ObjectId, ref: "Player" },
    isAcademy: { type: Boolean, default: false },
    // Other users allowed to manage this club (from the old site's club access list).
    staff: {
      type: [new Schema<any>({ userId: { type: ObjectId, ref: "User" }, access: { type: String, default: "full_control" } }, { _id: false })],
      default: [],
    },
    legacy: { type: Mixed },
    location: { type: String, default: "" },
    facebookPage: { type: String, default: "" },
    description: { type: String, default: "" },
    foundedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"], default: "ACTIVE" },
    marketValue: { type: Number, default: 0 },
    trophiesCount: { type: Number, default: 0 },
    points: { type: Number, default: 0 },
    formHistory: { type: String, default: "" },
    stats: {
      matches: { type: Number, default: 0 },
      wins: { type: Number, default: 0 },
      draws: { type: Number, default: 0 },
      losses: { type: Number, default: 0 },
      goalsScored: { type: Number, default: 0 },
      goalsConceded: { type: Number, default: 0 },
    },
  },
  opts
);

// ---------- Tournaments & Fixtures ----------

const ParticipantSchema = new Schema<any>(
  {
    userId: { type: ObjectId, ref: "User", required: true },
    playerId: { type: ObjectId, ref: "Player" },
    clubId: { type: ObjectId, ref: "Club" },
    joinedAt: { type: Date, default: Date.now },
    status: { type: String, enum: ["CONFIRMED", "WAITLIST", "REMOVED"], default: "CONFIRMED" },
  },
  { _id: false }
);

const TournamentSchema = new Schema<any>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true },
    season: { type: String, default: "" },
    banner: String,
    logo: String,
    description: { type: String, default: "" },
    rules: { type: String, default: "" },
    format: { type: String, default: "SINGLE_ELIMINATION" },
    gameCategory: { type: String, default: "eFootball Mobile" },
    platform: { type: String, default: "Mobile" },
    startDate: Date,
    endDate: Date,
    registrationDeadline: Date,
    maxParticipants: { type: Number, default: 32 },
    prizePool: { type: String, default: "" },
    entryFee: { type: String, default: "Free" },
    status: {
      type: String,
      enum: ["DRAFT", "REGISTRATION_OPEN", "REGISTRATION_CLOSED", "ONGOING", "COMPLETED", "CANCELLED"],
      default: "DRAFT",
    },
    isFeatured: { type: Boolean, default: false },
    // PLAYER: individual players join. CLUB: club managers enter their club.
    participantType: { type: String, enum: ["PLAYER", "CLUB"], default: "CLUB" },
    participants: { type: [ParticipantSchema], default: [] },
    clubParticipants: {
      type: [
        new Schema<any>(
          {
            clubId: { type: ObjectId, ref: "Club", required: true },
            registeredBy: { type: ObjectId, ref: "User" },
            joinedAt: { type: Date, default: Date.now },
            status: { type: String, enum: ["CONFIRMED", "PENDING", "REMOVED"], default: "CONFIRMED" },
            paymentType: { type: String, default: "free" },
            trxId: String,
            fbPostLink: String,
          },
          { _id: false }
        ),
      ],
      default: [],
    },
    winnerPlayerId: { type: ObjectId, ref: "Player" },
    winnerClubId: { type: ObjectId, ref: "Club" },
    legacy: { type: Mixed },
  },
  opts
);

const FixtureSchema = new Schema<any>(
  {
    tournamentId: { type: ObjectId, ref: "Tournament" },
    round: { type: String, default: "Regular Season" },
    scheduledDate: { type: Date, required: true },
    venue: { type: String, default: "Online" },
    status: { type: String, enum: ["SCHEDULED", "LIVE", "FINISHED", "POSTPONED", "CANCELLED"], default: "SCHEDULED" },
    startedAt: Date,
    isOnStream: { type: Boolean, default: false },
    streamUrl: { type: String, default: "" },
    streamPlatform: { type: String, default: "" },
    homeClubId: { type: ObjectId, ref: "Club" },
    awayClubId: { type: ObjectId, ref: "Club" },
    homePlayerId: { type: ObjectId, ref: "Player" },
    awayPlayerId: { type: ObjectId, ref: "Player" },
    refereeId: { type: ObjectId, ref: "Referee" },
    liveScore: {
      home: { type: Number, default: 0 },
      away: { type: Number, default: 0 },
    },
    result: {
      homeScore: Number,
      awayScore: Number,
      homePenalties: Number,
      awayPenalties: Number,
      motmPlayerId: { type: ObjectId, ref: "Player" },
      motmReason: String,
      status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"] },
      submittedBy: { type: ObjectId, ref: "User" },
      approvedBy: { type: ObjectId, ref: "User" },
      proofScreenshot: String,
      notes: String,
    },
  },
  opts
);

// ---------- Officials, Transfers, Discipline ----------

const RefereeSchema = new Schema<any>(
  {
    userId: { type: ObjectId, ref: "User" },
    officialId: String,
    name: { type: String, required: true },
    avatar: String,
    tier: { type: String, enum: ["TIER_1", "TIER_2", "TIER_3"], default: "TIER_2" },
    role: { type: String, default: "Match Official" },
    rating: { type: Number, default: 4.5 },
    matchesOfficiated: { type: Number, default: 0 },
    disputesHandled: { type: Number, default: 0 },
    fairPlayScore: { type: Number, default: 95 },
    bio: { type: String, default: "" },
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "SUSPENDED"], default: "ACTIVE" },
  },
  opts
);

const TransferListingSchema = new Schema<any>(
  {
    playerId: { type: ObjectId, ref: "Player", required: true },
    askingPrice: { type: Number, required: true },
    status: { type: String, enum: ["LISTED", "AVAILABLE", "CLOSED"], default: "LISTED" },
    listedBy: { type: ObjectId, ref: "User" },
  },
  opts
);

const TransferRequestSchema = new Schema<any>(
  {
    playerId: { type: ObjectId, ref: "Player", required: true },
    targetClubId: { type: ObjectId, ref: "Club", required: true },
    offeredFee: { type: Number, default: 0 },
    proposedSalary: Number,
    message: String,
    status: { type: String, enum: ["PENDING", "ACCEPTED", "REJECTED", "CANCELLED"], default: "PENDING" },
    requesterUserId: { type: ObjectId, ref: "User" },
  },
  opts
);

const TransferHistorySchema = new Schema<any>(
  {
    playerId: { type: ObjectId, ref: "Player" },
    playerName: String,
    previousClubName: String,
    newClubName: String,
    fee: Number,
    transferDate: { type: Date, default: Date.now },
    approvedBy: String,
    newClubId: { type: ObjectId, ref: "Club" },
    oldClubId: { type: ObjectId, ref: "Club" },
    transferType: { type: String, default: "free" },
    legacy: { type: Mixed },
  },
  opts
);

const DisciplinarySchema = new Schema<any>(
  {
    targetType: { type: String, enum: ["PLAYER", "CLUB"], required: true },
    targetId: { type: ObjectId, required: true },
    targetName: String,
    reason: { type: String, required: true },
    penalty: { type: String, required: true },
    status: { type: String, enum: ["ACTIVE", "EXPIRED", "REVOKED"], default: "ACTIVE" },
    startDate: { type: Date, default: Date.now },
    endDate: Date,
    evidence: String,
    notes: String,
    issuedBy: String,
  },
  opts
);

// ---------- Activity, Audit, Notifications ----------

const ActivitySchema = new Schema<any>(
  {
    type: { type: String, default: "GENERAL" },
    category: { type: String, default: "Matches" },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    avatar: String,
    targetUrl: String,
    userId: { type: ObjectId, ref: "User", index: true },
    playerId: { type: ObjectId, ref: "Player", index: true },
    isPublic: { type: Boolean, default: true },
  },
  opts
);

const AuditLogSchema = new Schema<any>(
  {
    adminId: { type: ObjectId, ref: "User" },
    adminName: String,
    action: { type: String, required: true },
    target: String,
    details: String,
    ipAddress: String,
  },
  opts
);

const NotificationSchema = new Schema<any>(
  {
    userId: { type: ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true },
    message: { type: String, default: "" },
    link: String,
    type: { type: String, default: "INFO" },
    read: { type: Boolean, default: false },
  },
  opts
);

// ---------- CMS ----------

const NewsSchema = new Schema<any>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    excerpt: { type: String, default: "" },
    content: { type: String, default: "" },
    featuredImage: String,
    author: { type: String, default: "Editorial Team" },
    category: { type: String, default: "Announcement" },
    tags: { type: [String], default: [] },
    publishedDate: { type: Date, default: Date.now },
    views: { type: Number, default: 0 },
    isFeatured: { type: Boolean, default: false },
    isPublished: { type: Boolean, default: true },
  },
  opts
);

const EventSchema = new Schema<any>(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    banner: String,
    description: { type: String, default: "" },
    eventType: { type: String, default: "Meetup" },
    venue: { type: String, default: "" },
    eventDate: { type: Date, required: true },
    registrationDeadline: Date,
    capacity: { type: Number, default: 100 },
    prizePool: { type: String, default: "" },
    status: { type: String, enum: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"], default: "ACTIVE" },
    registrationOpen: { type: Boolean, default: true },
    registrations: { type: [ParticipantSchema], default: [] },
  },
  opts
);

const PartnerSchema = new Schema<any>(
  {
    name: { type: String, required: true },
    category: { type: String, default: "Partner" },
    logo: String,
    website: String,
    description: String,
    order: { type: Number, default: 0 },
  },
  opts
);

const SponsorSchema = new Schema<any>(
  {
    name: { type: String, required: true },
    logo: String,
    website: String,
    placement: { type: String, default: "Homepage" },
    priority: { type: Number, default: 0 },
  },
  opts
);

const LeaderSchema = new Schema<any>(
  {
    name: { type: String, required: true },
    role: { type: String, default: "" },
    category: { type: String, default: "Core Team" },
    photo: String,
    period: String,
    bio: String,
    facebook: String,
    order: { type: Number, default: 0 },
  },
  opts
);

const SettingSchema = new Schema<any>(
  {
    key: { type: String, required: true, unique: true },
    value: { type: Mixed, default: {} },
  },
  { ...opts, minimize: false }
);

const MediaSchema = new Schema<any>(
  {
    data: { type: Buffer, required: true },
    contentType: { type: String, required: true },
    size: Number,
    filename: String,
    uploadedBy: { type: ObjectId, ref: "User" },
  },
  opts
);

export const User: Model<any> = model("User", UserSchema);
export const Player: Model<any> = model("Player", PlayerSchema);
export const Club: Model<any> = model("Club", ClubSchema);
export const Tournament: Model<any> = model("Tournament", TournamentSchema);
export const Fixture: Model<any> = model("Fixture", FixtureSchema);
export const Referee: Model<any> = model("Referee", RefereeSchema);
export const TransferListing: Model<any> = model("TransferListing", TransferListingSchema);
export const TransferRequest: Model<any> = model("TransferRequest", TransferRequestSchema);
export const TransferHistory: Model<any> = model("TransferHistory", TransferHistorySchema);
export const Disciplinary: Model<any> = model("Disciplinary", DisciplinarySchema);
export const Activity: Model<any> = model("Activity", ActivitySchema);
export const AuditLog: Model<any> = model("AuditLog", AuditLogSchema);
export const Notification: Model<any> = model("Notification", NotificationSchema);
export const News: Model<any> = model("News", NewsSchema);
export const Event: Model<any> = model("Event", EventSchema);
export const Partner: Model<any> = model("Partner", PartnerSchema);
export const Sponsor: Model<any> = model("Sponsor", SponsorSchema);
export const Leader: Model<any> = model("Leader", LeaderSchema);
export const Setting: Model<any> = model("Setting", SettingSchema);
export const Media: Model<any> = model("Media", MediaSchema);
