// Ready-to-paste match announcement for the captains' group (TTSBD / BOE style), built from the lineup.

const BOLD_UPPER = 0x1d5d4; // 𝗔
const BOLD_LOWER = 0x1d5ee; // 𝗮
const BOLD_DIGIT = 0x1d7ec; // 𝟬

/** Unicode sans-serif bold, so it stays bold when pasted into Messenger / Facebook. */
export function bold(text: string) {
  return Array.from(text)
    .map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 65 && c <= 90) return String.fromCodePoint(BOLD_UPPER + c - 65);
      if (c >= 97 && c <= 122) return String.fromCodePoint(BOLD_LOWER + c - 97);
      if (c >= 48 && c <= 57) return String.fromCodePoint(BOLD_DIGIT + c - 48);
      return ch;
    })
    .join("");
}

const fmtDay = (d: Date) => d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtTime = (d: Date) => d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });

export type MatchTextInput = {
  tournament: string;
  round: string;
  home: { name: string; shortName?: string };
  away: { name: string; shortName?: string };
  scheduledDate: string;
  lineup?: {
    minutes?: number;
    slots: { id: string; label: string; time: string }[];
    rows: { host: string; slotId: string; homePlayer?: { fullName: string } | null; awayPlayer?: { fullName: string } | null }[];
  } | null;
  counts?: { remaining: number; homeWins: number; awayWins: number };
  captains?: { home?: string; away?: string };
  judge?: string;
  detailsUrl: string;
  rulesUrl: string;
  site?: string;
};

export function buildMatchText(m: MatchTextInput) {
  const out: string[] = [];
  const hs = (m.home.shortName || m.home.name).toUpperCase();
  const as = (m.away.shortName || m.away.name).toUpperCase();
  out.push("━━━━━━━━━━━━━━");
  out.push(`✨ ${bold(m.site || "NECOB")} 🇧🇩 | ${bold(m.tournament)} | ${bold(m.round)}`);
  out.push("");
  out.push(`${bold(m.home.name)} ⚔ ${bold(m.away.name)}`);
  out.push("");

  const rows = m.lineup?.rows || [];
  if (rows.length) {
    const minutes = m.lineup?.minutes || 10;
    const slots = [...(m.lineup?.slots || [])].sort((a, b) => +new Date(a.time) - +new Date(b.time));
    const icons = ["🌙", "⚡", "🔥", "⭐", "🎯", "🌟"];
    slots.forEach((slot, i) => {
      const inSlot = rows.filter((r) => r.slotId === slot.id);
      if (!inSlot.length) return;
      const start = new Date(slot.time);
      const end = new Date(start.getTime() + minutes * 60000);
      out.push(`${icons[i % icons.length]} ${slot.label || `Slot ${i + 1}`}: ${fmtDay(start)} | ${fmtTime(start)} - ${fmtTime(end)}`);
      out.push("⠀");
      for (const r of inSlot) {
        const h = r.homePlayer?.fullName || `${hs} player`;
        const a = r.awayPlayer?.fullName || `${as} player`;
        out.push(`${r.host === "HOME" ? "🔑" : ""}${h} 🆚 ${a}${r.host === "AWAY" ? "🔑" : ""}`);
        out.push("⠀");
      }
    });
    out.push("🔑 = room host");
  } else {
    const d = new Date(m.scheduledDate);
    out.push(`📅 ${bold("Date")}: ${d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })} | ${fmtTime(d)}`);
    out.push("📝 Lineup will be announced soon.");
  }
  out.push("");
  if (m.counts) {
    out.push(`📌 Match Remaining: ${m.counts.remaining}`);
    out.push("");
    out.push(`🎯 Match Win: ${bold(hs)} ${m.counts.homeWins} | ${m.counts.awayWins} ${bold(as)}`);
    out.push("");
  }
  const caps = [m.captains?.home, m.captains?.away].filter(Boolean);
  if (caps.length) {
    out.push(`👤 Team Captain: ${caps.join(", ")}`);
    out.push("");
  }
  if (m.judge) {
    out.push(`👨‍⚖️ Match Operations: ${m.judge}`);
    out.push("");
  }
  out.push(`🌍 Details: ${m.detailsUrl}`);
  out.push("");
  out.push(`📜 Rules: ${m.rulesUrl}`);
  out.push("━━━━━━━━━━━━━━");
  out.push(bold("Good luck to both clubs!"));
  return out.join("\n");
}
