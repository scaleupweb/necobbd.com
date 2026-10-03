"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useClubHub } from "@/components/club-hub/ClubHubContext";
import { toolBySlug, canOpen } from "@/components/club-hub/tools";
import {
  ToolShell,
  ComingSoon,
  SquadRoster,
  ClubFixtures,
  TransferHistory,
  ChangeInfo,
  ChangeLogo,
  AccessControl,
  TournamentRegistration,
  UpdatePlayerInfo,
  RegisterNewPlayer,
} from "@/components/club-hub/ToolViews";
import { TransferWindow } from "@/components/club-hub/TransferWindow";

const VIEWS: Record<string, () => React.ReactNode> = {
  squad: () => <SquadRoster />,
  fixtures: () => <ClubFixtures />,
  "transfer-history": () => <TransferHistory />,
  "update-player": () => <UpdatePlayerInfo />,
  "register-player": () => <RegisterNewPlayer />,
  "transfer-window": () => <TransferWindow />,
  "change-info": () => <ChangeInfo />,
  "change-logo": () => <ChangeLogo />,
  "access-control": () => <AccessControl />,
  "tournament-registration": () => <TournamentRegistration />,
};

export default function ClubToolPage() {
  const { tool: slug } = useParams<{ tool: string }>();
  const { club } = useClubHub();
  const tool = toolBySlug(slug);

  if (!tool || !canOpen(tool, club.access, club.permissions)) {
    return (
      <div className="py-16 text-center space-y-3">
        <h1 className="text-lg font-black text-slate-950">{tool ? "Managers only" : "Tool not found"}</h1>
        <p className="text-sm text-slate-500">{tool ? "Your club role can't open this tool." : "This club tool doesn't exist."}</p>
        <Link href="/dashboard/my-club" className="inline-block px-4 py-2 rounded-xl bg-black text-white text-xs font-bold">All tools</Link>
      </div>
    );
  }

  const view = tool.ready ? VIEWS[tool.slug] : undefined;
  return <ToolShell tool={tool}>{view ? view() : <ComingSoon tool={tool} />}</ToolShell>;
}
