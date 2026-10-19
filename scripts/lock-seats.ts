/**
 * Saves every club player's current Main Team Squad seat, so seats stop shifting.
 * Older players had no stored seat and were placed on the fly; this stores exactly
 * the seat each one is shown in today, then adds the one-player-per-seat index.
 *
 *   npm run db:lock-seats            (dry run: shows what would change)
 *   npm run db:lock-seats -- --apply (writes the seats)
 */
import { config } from "dotenv";
import mongoose from "mongoose";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  if (!uri) throw new Error("DATABASE_URL is not set");
  const apply = process.argv.includes("--apply");

  await mongoose.connect(uri);
  const { Player, Club } = await import("../src/lib/db/models");
  const { seatLayout } = await import("../src/lib/squad");

  const players = await Player.find({ clubId: { $type: "objectId" } }, { clubId: 1, seat: 1, shirtNo: 1, fullName: 1 }).lean<any[]>();
  const byClub = new Map<string, any[]>();
  for (const p of players) {
    const k = String(p.clubId);
    if (!byClub.has(k)) byClub.set(k, []);
    byClub.get(k)!.push(p);
  }
  const clubs = new Map((await Club.find({}, { name: 1 }).lean<any[]>()).map((c) => [String(c._id), c.name]));

  const ops: any[] = [];
  let unplaced = 0;
  for (const [clubId, squad] of byClub) {
    const layout = seatLayout(squad);
    const placed = new Set(layout.filter(Boolean).map((p: any) => String(p._id)));
    const missing = squad.filter((p) => !placed.has(String(p._id)));
    if (missing.length) {
      unplaced += missing.length;
      console.warn(`! ${clubs.get(clubId) || clubId}: ${missing.length} player(s) beyond ${layout.length} seats — left unchanged: ${missing.map((p) => p.fullName).join(", ")}`);
    }
    let changed = 0;
    layout.forEach((p: any, i) => {
      if (p && p.seat !== i + 1) {
        ops.push({ updateOne: { filter: { _id: p._id }, update: { $set: { seat: i + 1 } } } });
        changed++;
      }
    });
    if (changed) console.log(`${clubs.get(clubId) || clubId}: ${changed} seat(s) to save`);
  }

  console.log(`\n${players.length} players in ${byClub.size} clubs · ${ops.length} seat(s) to save${unplaced ? ` · ${unplaced} without a seat` : ""}`);
  if (!apply) {
    console.log("Dry run — nothing written. Run again with --apply to save.");
  } else {
    if (ops.length) await Player.bulkWrite(ops);
    await Player.createIndexes();
    console.log("Seats saved and the one-player-per-seat index is in place.");
  }
  await mongoose.disconnect();
}

main().catch(async (e) => {
  console.error(e);
  await mongoose.disconnect();
  process.exit(1);
});
