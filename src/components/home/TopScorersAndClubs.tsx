import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Trophy, Flame } from "lucide-react";
import type { HomepageData } from "@/lib/homepage";
import { SectionHeader } from "./SectionHeader";

function RankBadge({ rank }: { rank: number }) {
  const styles: Record<number, string> = {
    1: "bg-[#F59E0B] text-black",
    2: "bg-[#E5E7EB] text-black",
    3: "bg-[#D97706] text-white",
  };
  return styles[rank] ? (
    <span className={`inline-flex w-5 h-5 rounded-full text-[10px] font-black items-center justify-center shadow-xs ${styles[rank]}`}>{rank}</span>
  ) : (
    <span className="text-[11px] font-bold text-[#6B7280]">{rank}</span>
  );
}

function Header({ title, href }: { icon?: React.ReactNode; title: string; href: string }) {
  const scorers = href.includes("scorers");
  return (
    <SectionHeader
      icon={scorers ? Flame : Trophy}
      title={title}
      subtitle={scorers ? "Most goals in official matches" : "League points table"}
      href={href}
      accent={scorers ? "bg-rose-500 text-white" : "bg-black text-white"}
    />
  );
}

export function TopScorersAndClubs({
  scorersTitle,
  clubsTitle,
  showScorers,
  showClubs,
  topScorers,
  clubRankings,
}: {
  scorersTitle: string;
  clubsTitle: string;
  showScorers: boolean;
  showClubs: boolean;
  topScorers: HomepageData["topScorers"];
  clubRankings: HomepageData["clubRankings"];
}) {
  const sc = showScorers && topScorers.length > 0;
  const cl = showClubs && clubRankings.length > 0;
  if (!sc && !cl) return null;

  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid grid-cols-1 ${sc && cl ? "lg:grid-cols-2" : ""} gap-6`}>
          {sc && (
            <div className="space-y-3.5">
              <Header icon={<Flame className="w-4 h-4 text-rose-500" />} title={scorersTitle} href="/rankings/scorers" />
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#F7F8FA] text-[#5F6368] font-bold uppercase text-[10px] tracking-wider border-b border-[#E5E7EB]">
                      <tr>
                        <th className="py-2.5 px-3 text-center w-8">#</th>
                        <th className="py-2.5 px-3">Player</th>
                        <th className="py-2.5 px-3">Club</th>
                        <th className="py-2.5 px-3 text-right font-black text-[#111111]">Goals</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7F8FA]">
                      {topScorers.map((s) => (
                        <tr key={s.rank} className="hover:bg-[#F7F8FA]/70 transition-colors">
                          <td className="py-2.5 px-3 text-center">
                            <RankBadge rank={s.rank} />
                          </td>
                          <td className="py-2.5 px-3 font-bold text-[#111111]">
                            <Link href={`/players/${s.username}`} className="flex items-center space-x-2 hover:underline">
                              <div className="w-6 h-6 rounded-full overflow-hidden bg-[#F7F8FA] border border-[#E5E7EB] relative shrink-0">
                                <Image src={s.avatar} alt="" fill sizes="24px" className="object-cover" />
                              </div>
                              <span className="truncate max-w-[120px] sm:max-w-[160px]">{s.playerName}</span>
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-[#5F6368] font-bold text-[11px]">{s.clubShort}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#111111] font-mono text-sm">{s.goals}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {cl && (
            <div className="space-y-3.5">
              <Header icon={<Trophy className="w-4 h-4 text-[#111111]" />} title={clubsTitle} href="/rankings" />
              <div className="bg-[#FFFFFF] border border-[#E5E7EB] rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto no-scrollbar">
                  <table className="w-full text-left text-xs min-w-[440px]">
                    <thead className="bg-[#F7F8FA] text-[#5F6368] font-bold uppercase text-[10px] tracking-wider border-b border-[#E5E7EB]">
                      <tr>
                        <th className="py-2.5 px-3.5 text-center w-10">#</th>
                        <th className="py-2.5 px-3.5">Club</th>
                        <th className="py-2.5 px-3 text-center">P</th>
                        <th className="py-2.5 px-3 text-center">W</th>
                        <th className="py-2.5 px-3 text-center">D</th>
                        <th className="py-2.5 px-3 text-center">L</th>
                        <th className="py-2.5 px-3.5 text-right font-black text-[#111111]">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F7F8FA]">
                      {clubRankings.map((c) => (
                        <tr key={c.rank} className="hover:bg-[#F7F8FA]/70 transition-colors">
                          <td className="py-2.5 px-3.5 text-center font-bold text-[#5F6368]">
                            {c.rank === 1 ? <span className="inline-flex w-5 h-5 rounded-full bg-[#111111] text-white text-[10px] font-black items-center justify-center">1</span> : c.rank}
                          </td>
                          <td className="py-2.5 px-3.5 font-bold text-[#111111]">
                            <Link href={`/clubs/${c.slug}`} className="flex items-center space-x-2.5 hover:underline">
                              <div className="w-6 h-6 rounded-md overflow-hidden bg-[#F7F8FA] border border-[#E5E7EB] relative shrink-0">
                                <Image src={c.logo} alt="" fill sizes="24px" className="object-cover" />
                              </div>
                              <span className="truncate max-w-[130px] sm:max-w-[170px]">{c.clubName}</span>
                            </Link>
                          </td>
                          <td className="py-2.5 px-3 text-center text-[#5F6368] font-mono">{c.played}</td>
                          <td className="py-2.5 px-3 text-center text-[#5F6368] font-mono">{c.won}</td>
                          <td className="py-2.5 px-3 text-center text-[#5F6368] font-mono">{c.draw}</td>
                          <td className="py-2.5 px-3 text-center text-[#5F6368] font-mono">{c.lost}</td>
                          <td className="py-2.5 px-3.5 text-right font-black text-[#111111] font-mono text-sm">{c.points}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
