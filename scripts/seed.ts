/**
 * Creates (or updates) the super admin account from environment variables.
 * No demo data is inserted.
 *
 *   ADMIN_EMAIL=... ADMIN_PASSWORD=... npm run db:seed
 */
import { config } from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";

config({ path: ".env.local" });
config({ path: ".env" });

async function main() {
  const uri = process.env.DATABASE_URL || process.env.MONGODB_URI;
  const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "";
  const username = (process.env.ADMIN_USERNAME || "admin").trim().toLowerCase();
  const fullName = process.env.ADMIN_NAME || "Site Administrator";

  if (!uri) throw new Error("DATABASE_URL is not set");
  if (!email) throw new Error("ADMIN_EMAIL is not set");
  if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error("ADMIN_PASSWORD must be at least 12 characters with upper, lower case letters and a number");
  }

  await mongoose.connect(uri);
  const { User } = await import("../src/lib/db/models");
  await User.syncIndexes();

  const passwordHash = await bcrypt.hash(password, 12);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = "SUPER_ADMIN";
    existing.status = "ACTIVE";
    existing.passwordHash = passwordHash;
    existing.tokenVersion = (existing.tokenVersion || 0) + 1;
    await existing.save();
    console.log(`Updated super admin ${email} (password reset from ADMIN_PASSWORD).`);
  } else {
    const clash = await User.findOne({ username });
    await User.create({ email, username: clash ? `${username}-${Date.now().toString(36)}` : username, fullName, passwordHash, role: "SUPER_ADMIN", status: "ACTIVE" });
    console.log(`Created super admin ${email}.`);
  }

  // Make sure every collection's unique indexes exist before real traffic arrives.
  const models = await import("../src/lib/db/models");
  for (const m of Object.values(models)) {
    if (typeof (m as any)?.syncIndexes === "function") await (m as any).syncIndexes();
  }
  console.log("Indexes are in sync.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e.message);
    process.exitCode = 1;
  })
  .finally(() => mongoose.disconnect());
