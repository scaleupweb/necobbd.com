import Link from "next/link";
import Image from "next/image";
import { Trophy, Swords, Users, Newspaper, CalendarDays } from "lucide-react";
import { SectionHeader as Header } from "./SectionHeader";
import type { HomepageData } from "@/lib/homepage";

function EventBadge({ badgeType }: { badgeType?: string }) {
  if (badgeType === "gold")
    return (
      <div className="w-10 h-10 rounded-xl bg-[#2A1D06] border border-[#F59E0B]/30 flex items-center justify-center text-[#FBBF24] shrink-0 shadow-inner">
        <Trophy className="w-4.5 h-4.5" />
      </div>
    );
  if (badgeType === "purple")
    return (
      <div className="w-10 h-10 rounded-xl bg-[#220B2E] border border-[#A855F7]/30 flex items-center justify-center text-[#C084FC] shrink-0 shadow-inner">
        <Swords className="w-4.5 h-4.5" />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-xl bg-[#0B1E38] border border-[#3B82F6]/30 flex items-center justify-center text-[#60A5FA] shrink-0 shadow-inner">
      <Users className="w-4.5 h-4.5" />
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  const isNews = href === "/news";
  return (
    <Header
      icon={isNews ? Newspaper : CalendarDays}
      title={title}
      subtitle={isNews ? "Stories, announcements and reports" : "Mark your calendar"}
      href={href}
      accent={isNews ? "bg-rose-500 text-white" : "bg-amber-400 text-black"}
    />
  );
}

export function NewsAndEvents({
  newsTitle,
  eventsTitle,
  showNews,
  showEvents,
  news,
  events,
}: {
  newsTitle: string;
  eventsTitle: string;
  showNews: boolean;
  showEvents: boolean;
  news: HomepageData["news"];
  events: HomepageData["events"];
}) {
  const n = showNews && news.length > 0;
  const e = showEvents && events.length > 0;
  if (!n && !e) return null;

  return (
    <section className="w-full py-6">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {n && (
            <div className={`${e ? "lg:col-span-8" : "lg:col-span-12"} flex flex-col`}>
              <SectionHeader title={newsTitle} href="/news" />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4 flex-1 items-stretch">
                {news.map((item) => (
                  <Link
                    key={item.slug}
                    href={`/news/${item.slug}`}
                    className="group bg-white border border-[#E5E7EB] hover:border-[#111111] rounded-2xl overflow-hidden flex flex-col transition-all duration-300 shadow-sm hover:shadow-md h-full"
                  >
                    <div className="relative aspect-[16/10] w-full bg-[#F7F8FA] overflow-hidden">
                      <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                      <h3 className="text-xs sm:text-sm font-black text-[#111111] leading-snug line-clamp-2">{item.title}</h3>
                      <div className="text-[11px] text-[#6B7280] font-medium pt-3 mt-auto">{item.date}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {e && (
            <div className={`${n ? "lg:col-span-4" : "lg:col-span-12"} flex flex-col`}>
              <SectionHeader title={eventsTitle} href="/events" />
              <div className="bg-white border border-[#E5E7EB] rounded-2xl p-4 sm:p-5 shadow-sm divide-y divide-[#F1F3F5] flex-1 flex flex-col">
                {events.map((ev) => (
                  <div key={ev.slug} className="py-3 sm:py-3.5 first:pt-0 last:pb-0 flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-3 min-w-0">
                      <EventBadge badgeType={ev.badgeType} />
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-[#111111] truncate leading-tight">{ev.title}</div>
                        <div className="text-[11px] text-[#6B7280] font-medium leading-tight mt-1 truncate">
                          {ev.date}
                          {ev.venue ? ` · ${ev.venue}` : ""}
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/events#${ev.slug}`}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#F3F4F6] hover:bg-[#E5E7EB] text-[#111111] border border-[#E5E7EB] transition-colors shrink-0"
                    >
                      {ev.isRegistrationOpen ? "Register" : "Details"}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
