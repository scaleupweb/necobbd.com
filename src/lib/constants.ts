export const SITE_NAME = "eFCOB — National eFootball Community of Bangladesh";
export const SITE_DESCRIPTION = "The premier esports championship ecosystem for eFootball players, clubs, tournaments, rankings, and match officials in Bangladesh.";

export const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Matches", href: "/matches" },
  { label: "Players", href: "/players" },
  { label: "Clubs", href: "/clubs" },
  { label: "Tournaments", href: "/tournaments" },
  { label: "Rankings", href: "/rankings" },
  { label: "Transfer Market", href: "/transfer-market" },
  { label: "Activity", href: "/activity" },
  { label: "News", href: "/news" },
  { label: "About", href: "/about" },
];

export const MORE_LINKS = [
  { label: "Referees & Officials", href: "/referees" },
  { label: "Events & LAN", href: "/events" },
  { label: "Partners & Universities", href: "/partners" },
  { label: "Disciplinary Register", href: "/disciplinary" },
  { label: "Rulebook & Fair Play", href: "/rules" },
];

export const PLAYER_POSITIONS = [
  "CF", "SS", "LWF", "RWF", "AMF", "LMF", "RMF", "CMF", "DMF", "LB", "CB", "RB", "GK"
];

export const PLAY_STYLES = [
  "Possession Game",
  "Quick Counter",
  "Long Ball Counter",
  "Out Wide",
  "Long Ball"
];

// Suggestions only — players can type any device.
export const DEVICE_MODELS = [
  "iPhone 17 Pro Max",
  "iPhone 17 Pro",
  "iPhone 17",
  "iPhone 16 Pro Max",
  "iPhone 16",
  "iPhone 15 Pro Max",
  "iPhone 15",
  "iPhone 14 Pro Max",
  "iPhone 14",
  "iPhone 13",
  "iPhone 12",
  "iPhone 11",
  "iPad Pro",
  "iPad Air",
  "Samsung Galaxy S25 Ultra",
  "Samsung Galaxy S24 Ultra",
  "Samsung Galaxy S23",
  "Samsung Galaxy A55",
  "Samsung Galaxy A35",
  "Xiaomi 14 Ultra",
  "Redmi Note 14 Pro",
  "Redmi Note 13 Pro",
  "Redmi Turbo 4 Pro",
  "POCO F7 Pro",
  "POCO F6",
  "POCO X7 Pro",
  "POCO X6 Pro",
  "Realme GT 7 Pro",
  "Realme P4 5G",
  "Realme 14 Pro",
  "OnePlus 13",
  "OnePlus 12",
  "Infinix GT 20 Pro",
  "Infinix Zero 40",
  "Tecno Pova 6 Pro",
  "Vivo X200",
  "Vivo V40",
  "Oppo Find X8",
  "Oppo Reno 12",
  "Honor Magic 7",
  "Google Pixel 9",
  "ROG Phone 9 Pro",
  "Red Magic 10 Pro",
];

export const GAME_PLATFORMS = [
  "eFootball Mobile (iOS/Android)",
  "eFootball Console (PS5/Xbox/PC)",
  "EA Sports FC Mobile",
  "EA Sports FC 25 Console"
];

export const RANKING_FORMULA_CONFIG = {
  WIN_POINTS: 3,
  DRAW_POINTS: 1,
  LOSS_POINTS: 0,
  GOAL_WEIGHT: 0.15,
  CLEAN_SHEET_BONUS: 0.5,
  BASE_RATING: 750,
  RATING_K_FACTOR: 32,
};
