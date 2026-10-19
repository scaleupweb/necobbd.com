"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Users, Swords, Trophy, MoreHorizontal } from "lucide-react";

interface MobileBottomNavProps {
  onOpenMenu?: () => void;
}

export function MobileBottomNav({ onOpenMenu }: MobileBottomNavProps) {
  const pathname = usePathname();

  const handleMoreClick = () => {
    if (onOpenMenu) {
      onOpenMenu();
    } else if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-mobile-menu"));
    }
  };

  const items = [
    { label: "Home", href: "/", icon: Home, exact: true },
    { label: "Players", href: "/players", icon: Users },
    { label: "Matches", href: "/matches", icon: Swords },
    { label: "Tournaments", href: "/tournaments", icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E5E7EB] md:hidden safe-bottom-fixed shadow-lg">
      <div className="grid grid-cols-5 h-16 items-center px-1">
        {items.map((item) => {
          const isActive = item.exact
            ? pathname === item.href
            : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] transition-colors ${
                isActive ? "text-[#111111]" : "text-[#5F6368] hover:text-[#111111]"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-[#111111]" />
                )}
              </div>
              <span className={`text-[10px] mt-1 tracking-tight ${isActive ? "font-bold" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <button
          onClick={handleMoreClick}
          className="flex flex-col items-center justify-center h-full min-h-[44px] min-w-[44px] text-[#5F6368] hover:text-[#111111] transition-colors"
          aria-label="Open full menu"
        >
          <MoreHorizontal className="w-5 h-5 stroke-[1.8]" />
          <span className="text-[10px] mt-1 font-medium tracking-tight">More</span>
        </button>
      </div>
    </nav>
  );
}
