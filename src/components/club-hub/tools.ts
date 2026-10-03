import {
  Users,
  CalendarDays,
  ClipboardList,
  Handshake,
  ArrowLeftRight,
  Repeat,
  History,
  UserPlus,
  UserMinus,
  UserCog,
  PenLine,
  ImageIcon,
  SlidersHorizontal,
  Wallet,
  KeyRound,
  Crown,
  Trophy,
  CalendarCheck,
  type LucideIcon,
} from "lucide-react";

export type ToolGroup = "team" | "transfers" | "admin" | "events";

export type ClubTool = {
  slug: string;
  label: string;
  desc: string;
  icon: LucideIcon;
  group: ToolGroup;
  /** Built and working. Others show a "coming soon" screen until specified. */
  ready: boolean;
};

export const GROUPS: { id: ToolGroup; label: string; tone: string; tile: string }[] = [
  { id: "team", label: "Team & Matches", tone: "text-emerald-600", tile: "bg-emerald-50 text-emerald-700 ring-emerald-100" },
  { id: "transfers", label: "Transfers & Roster", tone: "text-sky-600", tile: "bg-sky-50 text-sky-700 ring-sky-100" },
  { id: "admin", label: "Club Administration", tone: "text-amber-600", tile: "bg-amber-50 text-amber-700 ring-amber-100" },
  { id: "events", label: "Tournaments & Events", tone: "text-violet-600", tile: "bg-violet-50 text-violet-700 ring-violet-100" },
];

export const TOOLS: ClubTool[] = [
  // Team & Matches
  { slug: "squad", label: "Squad Roster", desc: "Your squad, positions, contracts and player status.", icon: Users, group: "team", ready: true },
  { slug: "fixtures", label: "Fixtures", desc: "Upcoming matches, results and schedule.", icon: CalendarDays, group: "team", ready: true },
  { slug: "squad-submission", label: "Squad Submission", desc: "Pick and submit your matchday squad.", icon: ClipboardList, group: "team", ready: false },
  { slug: "friendly-challenge", label: "Friendly Challenge", desc: "Challenge another club to a friendly match.", icon: Handshake, group: "team", ready: false },

  // Transfers & Roster
  { slug: "transfer-window", label: "Transfer Window", desc: "Sign free agents into your squad and make transfer cards.", icon: ArrowLeftRight, group: "transfers", ready: true },
  { slug: "player-loans", label: "Player Loans", desc: "Request loans and answer other clubs' requests.", icon: Repeat, group: "transfers", ready: false },
  { slug: "transfer-history", label: "Transfer History", desc: "Every player who joined or left the club, with dates, contracts and requests.", icon: History, group: "transfers", ready: true },
  { slug: "register-player", label: "Register New Player", desc: "Create a new player account directly in your club.", icon: UserPlus, group: "transfers", ready: true },
  { slug: "unregister-player", label: "Unregister Player", desc: "Release a squad player from your club (confirm by typing the site name).", icon: UserMinus, group: "transfers", ready: true },
  { slug: "update-player", label: "Update Player Info", desc: "Change a squad player's image, Konami ID, device and shirt number.", icon: UserCog, group: "transfers", ready: true },

  // Club Administration
  { slug: "change-info", label: "Change Info", desc: "Slogan, location, Facebook page and about text.", icon: PenLine, group: "admin", ready: true },
  { slug: "change-logo", label: "Change Logo", desc: "Club logo and cover image.", icon: ImageIcon, group: "admin", ready: true },
  { slug: "team-control", label: "Team Control", desc: "Academy, youth and overseas settings.", icon: SlidersHorizontal, group: "admin", ready: false },
  { slug: "wallet", label: "Club Wallet", desc: "Club balance and wallet activity.", icon: Wallet, group: "admin", ready: false },
  { slug: "access-control", label: "Access Control", desc: "Main manager hand-over and staff permissions.", icon: KeyRound, group: "admin", ready: true },
  { slug: "premium", label: "Upgrade to Premium", desc: "Premium club features and sponsorship.", icon: Crown, group: "admin", ready: false },

  // Tournaments & Events
  { slug: "tournament-registration", label: "Tournament Registration", desc: "Enter your club into open tournaments.", icon: Trophy, group: "events", ready: true },
  { slug: "event-registration", label: "Event Registration", desc: "Sign your club up for meetups and LAN events.", icon: CalendarCheck, group: "events", ready: false },
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);

/** Tools that can be ticked for custom staff. Access Control stays with the main manager and full-control staff. */
export const GRANTABLE_TOOL_SLUGS = TOOLS.filter((t) => t.slug !== "access-control").map((t) => t.slug);

/** Whether a club member with this access (and, for custom staff, these tools) may open a tool. */
export const canOpen = (tool: ClubTool, access?: string | null, permissions: string[] = []) =>
  access === "MANAGER" || access === "FULL" || (access === "CUSTOM" && tool.slug !== "access-control" && permissions.includes(tool.slug));
