import Image from "next/image";
import type { HomepageData } from "@/lib/homepage";

export function PartnersSection({ title, subtitle, partners }: { title: string; subtitle: string; partners: HomepageData["partners"] }) {
  // Repeat items so the marquee loops seamlessly even with few partners.
  const reps = Math.max(2, Math.ceil(12 / Math.max(partners.length, 1)));
  const track = Array.from({ length: reps }, () => partners).flat();

  return (
    <section className="w-full py-8 overflow-hidden">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-xl mx-auto space-y-1 pb-6">
          <div className="text-[10px] font-black tracking-[0.3em] text-[#C79A3B]">TRUSTED BY</div>
          <h2 className="text-xl sm:text-2xl font-black text-[#111111] tracking-tight">{title}</h2>
          {subtitle && <p className="text-xs sm:text-sm text-[#5F6368]">{subtitle}</p>}
        </div>

        <div className="relative w-full overflow-hidden">
          <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-r from-[#F6F7F9] to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 sm:w-20 bg-gradient-to-l from-[#F6F7F9] to-transparent z-10" />
          <div className="animate-marquee flex items-center space-x-3 sm:space-x-4 py-1">
            {track.map((partner, idx) => {
              const card = (
                <div className="w-[160px] sm:w-[190px] h-[85px] sm:h-[90px] shrink-0 bg-[#FFFFFF] border border-[#E5E7EB] hover:border-[#111111] rounded-xl px-4 py-3 flex flex-col items-center justify-center text-center transition-all shadow-sm hover:shadow-md group select-none">
                  {partner.logo && !partner.logo.startsWith("/images/placeholders") ? (
                    <div className="relative w-full h-9">
                      <Image src={partner.logo} alt={partner.name} fill sizes="160px" className="object-contain" />
                    </div>
                  ) : (
                    <span className="font-black text-xs sm:text-sm tracking-wider text-[#111111] group-hover:text-[#C79A3B] transition-colors truncate w-full">{partner.name}</span>
                  )}
                  <span className="text-[10px] text-[#5F6368] font-medium mt-1 truncate w-full">{partner.category}</span>
                </div>
              );
              return partner.website ? (
                <a key={idx} href={partner.website} target="_blank" rel="noopener noreferrer" aria-label={partner.name}>
                  {card}
                </a>
              ) : (
                <div key={idx}>{card}</div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
