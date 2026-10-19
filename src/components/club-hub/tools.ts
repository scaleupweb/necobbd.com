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

export const GROUPS: { id: ToolGroup; label: string; blurb: string; tone: string; tile: string; head: string }[] = [
  { id: "team", label: "Matchday", blurb: "Your squad and the games ahead", tone: "text-emerald-600", tile: "bg-emerald-50 text-emerald-700 ring-emerald-100", head: "from-emerald-500 to-teal-600" },
  { id: "transfers", label: "Squad & Signings", blurb: "Bring players in, move them on", tone: "text-sky-600", tile: "bg-sky-50 text-sky-700 ring-sky-100", head: "from-sky-500 to-indigo-600" },
  { id: "admin", label: "Club Office", blurb: "Identity, people and settings", tone: "text-amber-600", tile: "bg-amber-50 text-amber-700 ring-amber-100", head: "from-amber-500 to-orange-600" },
  { id: "events", label: "Competitions", blurb: "Tournaments and community events", tone: "text-violet-600", tile: "bg-violet-50 text-violet-700 ring-violet-100", head: "from-violet-500 to-fuchsia-600" },
];

export const TOOLS: ClubTool[] = [
  // Team & Matches
  { slug: "squad", label: "My Squad", desc: "Everyone in your Main Team Squad, with seats and contracts.", icon: Users, group: "team", ready: true },
  { slug: "fixtures", label: "Match Schedule", desc: "What's next and how past games ended.", icon: CalendarDays, group: "team", ready: true },
  { slug: "squad-submission", label: "Matchday Lineup", desc: "Choose who plays on matchday.", icon: ClipboardList, group: "team", ready: false },
  { slug: "friendly-challenge", label: "Friendly Match", desc: "Invite another club to a friendly.", icon: Handshake, group: "team", ready: false },

  // Transfers & Roster
  { slug: "transfer-window", label: "Sign Players", desc: "Find players, pick a seat, send the request and make a card.", icon: ArrowLeftRight, group: "transfers", ready: true },
  { slug: "player-loans", label: "Loan Deals", desc: "Borrow or lend players between clubs.", icon: Repeat, group: "transfers", ready: false },
  { slug: "transfer-history", label: "Moves Log", desc: "Who came in, who left — dates, contracts and requests.", icon: History, group: "transfers", ready: true },
  { slug: "register-player", label: "Add New Player", desc: "Create a fresh player account straight into your club.", icon: UserPlus, group: "transfers", ready: true },
  { slug: "unregister-player", label: "Release Player", desc: "Let a squad member go (type the site name to confirm).", icon: UserMinus, group: "transfers", ready: true },
  { slug: "update-player", label: "Edit Player", desc: "Update a squad member's photo, Konami ID, device or number.", icon: UserCog, group: "transfers", ready: true },

  // Club Administration
  { slug: "change-info", label: "Club Details", desc: "Slogan, city, Facebook page and your club story.", icon: PenLine, group: "admin", ready: true },
  { slug: "change-logo", label: "Logo & Cover", desc: "Your crest and the banner people see first.", icon: ImageIcon, group: "admin", ready: true },
  { slug: "team-control", label: "Team Settings", desc: "Academy, youth and overseas options.", icon: SlidersHorizontal, group: "admin", ready: false },
  { slug: "wallet", label: "Club Funds", desc: "Balance and money activity for the club.", icon: Wallet, group: "admin", ready: false },
  { slug: "access-control", label: "Staff & Roles", desc: "Who helps run the club and what they can open.", icon: KeyRound, group: "admin", ready: true },
  { slug: "premium", label: "Club Premium", desc: "Extra club features and sponsorship.", icon: Crown, group: "admin", ready: false },

  // Tournaments & Events
  { slug: "tournament-registration", label: "Enter Tournaments", desc: "Put your club into open tournaments.", icon: Trophy, group: "events", ready: true },
  { slug: "event-registration", label: "Join Events", desc: "Sign up for meetups and LAN days.", icon: CalendarCheck, group: "events", ready: false },
];

export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);

/** Tools that can be ticked for custom staff. Access Control stays with the main manager and full-control staff. */
export const GRANTABLE_TOOL_SLUGS = TOOLS.filter((t) => t.slug !== "access-control").map((t) => t.slug);

/** Whether a club member with this access (and, for custom staff, these tools) may open a tool. */
export const canOpen = (tool: ClubTool, access?: string | null, permissions: string[] = []) =>
  access === "MANAGER" || access === "FULL" || (access === "CUSTOM" && tool.slug !== "access-control" && permissions.includes(tool.slug));
