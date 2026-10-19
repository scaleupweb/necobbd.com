export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'MODERATOR'
  | 'TOURNAMENT_OFFICIAL'
  | 'SENIOR_REFEREE'
  | 'REFEREE'
  | 'CLUB_MANAGER'
  | 'PLAYER';

export type UserStatus = 'ACTIVE' | 'PENDING' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';
export type PlayerStatus = 'ACTIVE' | 'PENDING_VERIFICATION' | 'SUSPENDED' | 'BANNED' | 'INACTIVE';
export type ContractStatus = 'FREE_AGENT' | 'UNDER_CONTRACT' | 'UNDER_TERMINATION' | 'TRANSFER_LISTED';
export type RefereeTier = 'TIER_1' | 'TIER_2' | 'TIER_3';
export type TournamentFormat =
  | 'SINGLE_ELIMINATION'
  | 'DOUBLE_ELIMINATION'
  | 'LEAGUE_ROUND_ROBIN'
  | 'GROUP_AND_KNOCKOUT'
  | 'SWISS'
  | 'CLUB_BATTLE'
  | 'NATIONAL_TOURNAMENT';

export type TournamentStatus =
  | 'DRAFT'
  | 'REGISTRATION_OPEN'
  | 'REGISTRATION_CLOSED'
  | 'ONGOING'
  | 'COMPLETED'
  | 'CANCELLED';

export type FixtureStatus = 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED' | 'CANCELLED';
export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type TransferStatus = 'AVAILABLE' | 'LISTED' | 'NEGOTIATING' | 'TRANSFERRED' | 'UNAVAILABLE';
export type RequestStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED';
export type DisputeStatus = 'OPEN' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED';

export type FormResult = 'W' | 'D' | 'L';

export interface UserSession {
  id: string;
  email: string;
  username: string;
  fullName: string;
  role: Role;
  avatar?: string;
  playerProfileId?: string;
  clubId?: string;
}

export interface PlayerSummary {
  id: string;
  userId: string;
  username: string;
  fullName: string;
  avatar?: string;
  konamiId: string;
  deviceModel: string;
  preferredPosition: string;
  playStyle: string;
  rating: number;
  marketValue: number; // in $M
  status: PlayerStatus;
  form: FormResult[];
  motmCount: number;
  club?: {
    id: string;
    name: string;
    shortName: string;
    slug: string;
    logo?: string;
  };
  stats?: {
    matchesPlayed: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    goalsScored: number;
    assists: number;
    cleanSheets: number;
    points: number;
  };
  contract?: {
    status: ContractStatus;
    durationMonths: number;
    endDate?: string;
    daysRemaining?: number;
  };
}

export interface ClubSummary {
  id: string;
  name: string;
  shortName: string;
  slug: string;
  logo?: string;
  banner?: string;
  location: string;
  managerName?: string;
  managerId?: string;
  marketValue: number;
  points: number;
  form: FormResult[];
  squadCount: number;
  stats?: {
    matches: number;
    wins: number;
    draws: number;
    losses: number;
    winRate: number;
    goalsScored: number;
    goalsConceded: number;
  };
  trophiesCount: number;
}

export interface FixtureSummary {
  id: string;
  tournamentId?: string;
  tournamentName?: string;
  round: string;
  scheduledDate: string;
  venue: string;
  status: FixtureStatus;
  isOnStream: boolean;
  streamUrl?: string;
  streamPlatform?: string;
  homeClub?: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  awayClub?: {
    id: string;
    name: string;
    shortName: string;
    logo?: string;
  };
  homePlayer?: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
    rating: number;
  };
  awayPlayer?: {
    id: string;
    username: string;
    fullName: string;
    avatar?: string;
    rating: number;
  };
  result?: {
    homeScore: number;
    awayScore: number;
    homePenalties?: number;
    awayPenalties?: number;
    motmPlayerName?: string;
    motmPlayerAvatar?: string;
    motmReason?: string;
    status: VerificationStatus;
  };
  referee?: {
    id: string;
    name: string;
    tier: RefereeTier;
    rating: number;
  };
}

export interface TournamentSummary {
  id: string;
  name: string;
  slug: string;
  banner?: string;
  logo?: string;
  description: string;
  format: TournamentFormat;
  gameCategory: string;
  platform: string;
  startDate: string;
  endDate: string;
  registrationDeadline: string;
  maxParticipants: number;
  currentParticipants: number;
  prizePool: string;
  status: TournamentStatus;
  progressPercent: number;
  completedMatches: number;
  totalMatches: number;
}

export interface ActivityFeedItem {
  id: string;
  type: string;
  category: 'Matches' | 'Players' | 'Clubs' | 'Transfers' | 'Tournaments' | 'Awards' | 'Disciplinary';
  title: string;
  description: string;
  createdAt: string;
  avatar?: string;
  targetUrl?: string;
}
