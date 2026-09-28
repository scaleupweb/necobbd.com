# 🏆 NEXA Football / eFCOB — Full-Stack eFootball Championship Platform

> **The Premier Esports Ecosystem for eFootball Tournaments, Rankings, Club Franchises, and Athlete Profiles.**

Built with Next.js 15 App Router, TypeScript, Tailwind CSS, Prisma ORM, Framer Motion, and Lucide Icons.

---

## ⚡ Features & Modules

- **🏠 Master Homepage**: Wide hero composition with custom player assets, live match cards, tournament progress tracking, activity feed, weekly stars, top scorers, club rankings, transfer market spotlights, news, events, and community CTA.
- **⚔️ Match Centre (`/matches`)**: Filter by Live, Upcoming, Finished, and Live Stream matches with real-time scorelines and club logos.
- **📺 Match Detail Hub (`/matches/[id]`)**: Embedded live broadcast, score timeline events, radar charts, MOTM award designation, and referee accreditation badges.
- **🏃 Athlete Directory (`/players`)**: Complete search and filters by position, club, rating, market valuation, and dynamic win/loss form.
- **🛡️ Club Hub (`/clubs`)**: Club rosters, franchise market valuations, trophies, manager credentials, and match history.
- **🏆 Tournament Center (`/tournaments`)**: Interactive knockout bracket tree (Quarter-Finals $\rightarrow$ Semi-Finals $\rightarrow$ Finals) with prize pool breakdowns.
- **🥇 Leaderboards (`/rankings`)**: Dedicated rankings for Top Scorers, Assists, Clean Sheets, MOTM honors, and Match Officials.
- **💰 Transfer Market (`/transfer-market`)**: Active athlete listings, buyout proposal modals, and valuation calculators.
- **📡 Live Activity Stream (`/activity`)**: Real-time event log for transfers, registrations, awards, and matches.
- **📰 Editorial & Events (`/news`, `/events`)**: CMS articles, LAN championship schedules, and tournament registration.
- **⚖️ Governance (`/rules`, `/disciplinary`, `/referees`)**: Official rulebook, public disciplinary tribunal, and certified arbiter tier management.
- **🔒 Super Admin Operations Suite (`/admin/*`)**:
  - Live Match Operations & score arbitration
  - Athlete & Club roster management
  - Fixture scheduling & Tournament bracket generation
  - Transfer market moderation & buyout approvals
  - Referee accreditation (Tier 1-3) & Fair Play recalibration
  - Sanction issuance & Tribunal register
  - Immutable audit trail ledger with hash verification

---

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router, `proxy.ts` route guards)
- **Language**: TypeScript
- **Database**: MongoDB (Mongoose) — MongoDB Atlas recommended
- **Auth**: JWT in httpOnly cookie, checked against the database on every request (bans, role changes and password resets apply instantly), bcrypt, login lockout, rate limiting
- **Styling**: Tailwind CSS · Lucide icons

---

## 🚀 Getting Started

1. `npm install`
2. Copy `.env.example` to `.env` and fill in:
   - `DATABASE_URL` — your MongoDB Atlas connection string
   - `AUTH_SECRET` — a long random string
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` — the first super admin (password: 12+ chars, upper, lower, number)
   - SMTP settings (optional) for password-reset emails; without them the reset link is printed in the server log
3. `npm run db:seed` — creates the super admin (no demo data)
4. `npm run dev` and sign in at `/login` → you land in the admin panel at `/admin`

## 🔒 Admin panel (`/admin`)

- **Homepage & Site Content** — every heading, button, image, section on/off, announcement bar, footer, socials, About & Rules text
- **Registration Countdown** — link a tournament, set a deadline, start/stop with one click (opens/closes registration)
- **Tournaments / Events** — create, change status, see and export participants, remove players, crown champions
- **Fixtures & Results / Live Desk** — schedule matches, go live, update live score, approve results (ratings and stats update automatically)
- **Users & Roles / Players / Clubs / Match Officials** — roles, suspend/ban, reset passwords, verify players, assign clubs
- **Transfers, Disciplinary, News, Partners & Team, Audit Log**

Images can be uploaded directly (stored in MongoDB) or pasted as https URLs.

---

## 📄 License
MIT License.
