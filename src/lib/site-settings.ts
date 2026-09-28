// Editable site content. Admins change these from /admin/site; anything not
// saved in the database falls back to the defaults below.

export interface SiteSettings {
  brand: {
    siteName: string;
    logoLine1: string;
    logoLine2: string;
    logoUrl: string;
    tagline: string;
    description: string;
  };
  announcement: {
    show: boolean;
    text: string;
    linkLabel: string;
    linkHref: string;
  };
  countdown: {
    enabled: boolean;
    label: string;
    title: string;
    description: string;
    targetDate: string;
    tournamentId: string;
    ctaLabel: string;
    ctaHref: string;
    endedText: string;
  };
  hero: {
    eyebrow: string;
    headingLine1: string;
    headingLine2: string;
    highlightWord: string;
    supportingText: string;
    ctaPrimaryLabel: string;
    ctaPrimaryHref: string;
    ctaSecondaryLabel: string;
    ctaSecondaryHref: string;
    image: string;
    showStats: boolean;
    statLabels: { players: string; clubs: string; tournaments: string; matches: string };
  };
  sections: {
    liveMatches: { show: boolean; title: string };
    tournaments: { show: boolean; title: string };
    activity: { show: boolean; title: string };
    weeklyStars: { show: boolean; title: string; subtitle: string };
    topScorers: { show: boolean; title: string };
    clubRankings: { show: boolean; title: string };
    transfers: { show: boolean; title: string; promoTitle: string; promoText: string; promoCta: string; promoImage: string };
    news: { show: boolean; title: string };
    events: { show: boolean; title: string };
    partners: { show: boolean; title: string; subtitle: string };
  };
  cta: {
    show: boolean;
    badge: string;
    titleLine1: string;
    highlight: string;
    text: string;
    primaryLabel: string;
    primaryHref: string;
    secondaryLabel: string;
    secondaryHref: string;
    image: string;
  };
  footer: {
    headline: string;
    text: string;
    copyright: string;
    email: string;
    phone: string;
    address: string;
    socials: { facebook: string; x: string; youtube: string; instagram: string; discord: string };
  };
  pages: {
    aboutTitle: string;
    aboutIntro: string;
    rulesContent: string;
  };
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  brand: {
    siteName: "NEXA Football",
    logoLine1: "NEXA",
    logoLine2: "FOOTBALL",
    logoUrl: "",
    tagline: "The Home of eFootball",
    description:
      "The premier esports championship platform for eFootball players, clubs, tournaments, rankings, and match officials in Bangladesh.",
  },
  announcement: {
    show: false,
    text: "",
    linkLabel: "",
    linkHref: "",
  },
  countdown: {
    enabled: false,
    label: "Registration Closing In",
    title: "Tournament Registration Is Open",
    description: "Secure your spot before the deadline.",
    targetDate: "",
    tournamentId: "",
    ctaLabel: "Join Now",
    ctaHref: "/tournaments",
    endedText: "Registration has closed.",
  },
  hero: {
    eyebrow: "THE HOME OF eFOOTBALL",
    headingLine1: "UNITED BY PASSION",
    headingLine2: "POWERED BY",
    highlightWord: "PLAYERS",
    supportingText: "Compete. Represent. Grow. Be part of something bigger.",
    ctaPrimaryLabel: "Join Community",
    ctaPrimaryHref: "/register",
    ctaSecondaryLabel: "Explore Tournaments",
    ctaSecondaryHref: "/tournaments",
    image: "/images/hero-banner.png",
    showStats: true,
    statLabels: { players: "Players", clubs: "Clubs", tournaments: "Tournaments", matches: "Matches Played" },
  },
  sections: {
    liveMatches: { show: true, title: "Live Matches" },
    tournaments: { show: true, title: "Ongoing Tournaments" },
    activity: { show: true, title: "What's Happening" },
    weeklyStars: { show: true, title: "Weekly Stars", subtitle: "This week's top performers" },
    topScorers: { show: true, title: "Top Scorers" },
    clubRankings: { show: true, title: "Club Rankings" },
    transfers: {
      show: true,
      title: "Transfer Market",
      promoTitle: "Find Your Next Star",
      promoText: "Search players, compare value and build your dream squad.",
      promoCta: "Browse Transfer Market",
      promoImage: "/images/hero-player.png",
    },
    news: { show: true, title: "Latest News" },
    events: { show: true, title: "Upcoming Events" },
    partners: { show: true, title: "Our Partners", subtitle: "Together for a stronger eFootball community" },
  },
  cta: {
    show: true,
    badge: "National Ecosystem",
    titleLine1: "Be Part of the",
    highlight: "Movement",
    text: "Join players, clubs and fans building a bigger eFootball community. Compete in official leagues and climb national rankings.",
    primaryLabel: "Create Account",
    primaryHref: "/register",
    secondaryLabel: "Learn More",
    secondaryHref: "/about",
    image: "/images/cta-banner.png",
  },
  footer: {
    headline: "Play. Compete. Belong.",
    text: "The official home of competitive eFootball.",
    copyright: "© {year} NEXA Football. All rights reserved.",
    email: "",
    phone: "",
    address: "",
    socials: { facebook: "", x: "", youtube: "", instagram: "", discord: "" },
  },
  pages: {
    aboutTitle: "About Us",
    aboutIntro:
      "We organise competitive eFootball in Bangladesh — tournaments, club leagues, rankings, and a fair-play framework run by certified match officials.",
    rulesContent: "",
  },
};

function isPlainObject(v: unknown): v is Record<string, any> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Deep-merge saved values over defaults, keeping only keys that exist in the defaults. */
export function mergeSettings<T>(defaults: T, saved: unknown): T {
  if (!isPlainObject(defaults)) {
    if (saved === undefined || saved === null) return defaults;
    if (typeof saved !== typeof defaults) return defaults;
    return saved as T;
  }
  const out: Record<string, any> = {};
  const src = isPlainObject(saved) ? saved : {};
  for (const key of Object.keys(defaults as Record<string, any>)) {
    out[key] = mergeSettings((defaults as Record<string, any>)[key], src[key]);
  }
  return out as T;
}
