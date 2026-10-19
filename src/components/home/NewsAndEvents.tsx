import Link from "next/link";
import Image from "next/image";
import { Trophy, Swords, Users, Newspaper, CalendarDays } from "lucide-react";
import { SectionHeader as Header } from "./SectionHeader";
import type { HomepageData } from "@/lib/homepage";

function EventBadge({ badgeType }: { badgeType?: string }) {
  const Icon = badgeType === "gold" ? Trophy : badgeType === "purple" ? Swords : Users;
  return (
    <div className="w-10 h-10 rounded-xl bg-[#0B0C0F] ring-1 ring-[#C79A3B]/30 flex items-center justify-center text-[#F7DC8B] shrink-0">
      <Icon className="w-4 h-4" />
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
    <section className="w-full py-6 sm:py-8">
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
                    className="group home-card overflow-hidden flex flex-col h-full"
                  >
                    {/* Posters come in any shape: show the whole image, with a blurred copy filling the spare space. */}
                    <div className="relative aspect-[4/3] w-full bg-[#111111] overflow-hidden">
                      <Image src={item.image} alt="" aria-hidden fill sizes="(max-width: 640px) 100vw, 33vw" className="object-cover scale-110 blur-xl opacity-60" />
                      <Image src={item.image} alt={item.title} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain group-hover:scale-[1.03] transition-transform duration-300" />
                    </div>
                    <div className="p-3.5 sm:p-4 flex-1 flex flex-col justify-between">
                      <h3 className="text-xs sm:text-sm font-black text-[#111111] leading-snug line-clamp-2">{item.title}</h3>
                      <div className="flex items-center gap-1.5 text-[11px] text-[#6B7280] font-semibold pt-3 mt-auto">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#C79A3B]" /> {item.date}
                        <span className="ml-auto text-[#111111] font-black opacity-0 group-hover:opacity-100 transition-opacity">Read →</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {e && (
            <div className={`${n ? "lg:col-span-4" : "lg:col-span-12"} flex flex-col`}>
              <SectionHeader title={eventsTitle} href="/events" />
              <div className="bg-white border border-slate-200 rounded-3xl p-4 sm:p-5 shadow-sm divide-y divide-slate-100 flex-1 flex flex-col">
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
                      className="px-3.5 py-1.5 rounded-full text-xs font-black bg-[#0B0C0F] hover:bg-black text-white transition-colors shrink-0"
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
