import Link from "next/link";
import { UserPlus } from "lucide-react";
import { SectionHeader } from "./SectionHeader";
import type { HomepageData } from "@/lib/homepage";

/** Horizontal strip of the latest players to join the community. */
export function NewestPlayers({ players }: { players: HomepageData["newestPlayers"] }) {
  if (!players.length) return null;
  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <SectionHeader icon={UserPlus} title="New in the community" subtitle="Latest players to join" href="/players" accent="bg-emerald-500 text-white" />
        <div className="flex gap-3 overflow-x-auto no-scrollbar snap-x -mx-4 px-4 sm:mx-0 sm:px-0 pb-1">
          {players.map((p) => (
            <Link
              key={p.username}
              href={`/players/${p.username}`}
              className="snap-start shrink-0 w-[150px] rounded-2xl bg-white border border-[#E5E7EB] hover:border-black hover:-translate-y-0.5 hover:shadow-md transition-all p-3 text-center"
            >
              <div className="relative w-16 h-16 mx-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.avatar} alt="" className="w-16 h-16 rounded-full object-cover ring-2 ring-emerald-400 ring-offset-2" />
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 px-1.5 rounded-full bg-black text-white text-[9px] font-black">{p.position}</span>
              </div>
              <div className="mt-3 text-xs font-black text-[#111111] truncate">{p.name}</div>
              <div className="text-[10px] text-[#6B7280] truncate">{p.club || "No club"}</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
