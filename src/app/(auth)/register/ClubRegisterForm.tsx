"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { LocationInput } from "@/components/ui/LocationInput";
import { PasswordInput } from "@/components/ui/PasswordInput";

const input =
  "w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs";

/** Registers a club plus its manager login; the club waits for admin approval. */
export function ClubRegisterForm() {
  const [f, setF] = useState({
    clubName: "",
    shortName: "",
    managerName: "",
    email: "",
    password: "",
    phone: "",
    location: "",
    facebookPage: "",
    slogan: "",
    description: "",
    website: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [me, setMe] = useState<any>(undefined);
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((j) => setMe(j.success ? j.data : null))
      .catch(() => setMe(null));
  }, []);
  const set =(k: keyof typeof f, v: string) => setF((x) => ({ ...x, [k]: v }));
  const pwChecks = [
    { ok: f.password.length >= 8, label: "8+ characters" },
    { ok: /[a-z]/.test(f.password), label: "lowercase" },
    { ok: /[A-Z]/.test(f.password), label: "uppercase" },
    { ok: /[0-9]/.test(f.password), label: "number" },
  ];

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!me) {
      if (!pwChecks.every((c) => c.ok)) return setError("Password must have 8+ characters with uppercase, lowercase and a number.");
      if (f.password !== confirmPassword) return setError("Passwords do not match.");
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register-club", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
      const json = await res.json();
      if (!json.success) throw new Error(json.error?.message || "Registration failed");
      window.location.href = "/dashboard/my-club";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Register your Club</h1>
          <p className="text-xs text-slate-500">Create your club and its manager login. An admin reviews new clubs before they go live.</p>
        </div>
        <div className="rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-sm space-y-5">
          {error && <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">{error}</div>}
          <form onSubmit={submit} className="space-y-4 text-xs">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Club details</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="sm:col-span-2 block space-y-1">
                <span className="block text-slate-700 font-bold">Club name *</span>
                <input className={input} value={f.clubName} onChange={(e) => set("clubName", e.target.value)} placeholder="e.g. The Crimson Mask" required minLength={3} maxLength={60} />
              </label>
              <label className="block space-y-1">
                <span className="block text-slate-700 font-bold">Short tag *</span>
                <input
                  className={`${input} uppercase font-mono`}
                  value={f.shortName}
                  onChange={(e) => set("shortName", e.target.value.replace(/[^A-Za-z0-9]/g, "").slice(0, 6))}
                  placeholder="TCM"
                  required
                  minLength={2}
                />
              </label>
              <label className="block space-y-1">
                <span className="block text-slate-700 font-bold">Location</span>
                <LocationInput className={input} value={f.location} onChange={(v) => set("location", v)} placeholder="Dhaka" />
              </label>
              <label className="sm:col-span-2 block space-y-1">
                <span className="block text-slate-700 font-bold">Slogan</span>
                <input className={input} value={f.slogan} onChange={(e) => set("slogan", e.target.value)} placeholder="Behind the mask, beyond the game." maxLength={120} />
              </label>
              <label className="sm:col-span-3 block space-y-1">
                <span className="block text-slate-700 font-bold">Facebook page</span>
                <input className={input} value={f.facebookPage} onChange={(e) => set("facebookPage", e.target.value)} placeholder="https://facebook.com/yourclub" />
              </label>
              <label className="sm:col-span-3 block space-y-1">
                <span className="block text-slate-700 font-bold">About the club</span>
                <textarea className={input} rows={3} value={f.description} onChange={(e) => set("description", e.target.value)} maxLength={500} />
              </label>
            </div>

            {me ? (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                The club will be managed from your account <strong>@{me.username}</strong>. You can run it from <strong>My Club</strong> — no separate login needed.
              </div>
            ) : (
              <p className="text-[11px] text-slate-500">
                Already a player here?{" "}
                <Link href="/login?next=/register?type=club" className="font-bold text-black underline">
                  Sign in first
                </Link>{" "}
                and the club will be linked to your player account.
              </p>
            )}
            {me === null && (
            <>
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 pt-2">Manager login</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block space-y-1">
                <span className="block text-slate-700 font-bold">Manager full name *</span>
                <input className={input} value={f.managerName} onChange={(e) => set("managerName", e.target.value)} required minLength={2} />
              </label>
              <label className="block space-y-1">
                <span className="block text-slate-700 font-bold">Phone (private)</span>
                <input type="tel" className={input} value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="01XXXXXXXXX" />
              </label>
              <label className="sm:col-span-2 block space-y-1">
                <span className="block text-slate-700 font-bold">Email (used to sign in) *</span>
                <input type="email" className={input} value={f.email} onChange={(e) => set("email", e.target.value)} required autoComplete="email" />
              </label>
              <label className="block space-y-1">
                <span className="block text-slate-700 font-bold">Password *</span>
                <PasswordInput className={input} value={f.password} onChange={(e) => set("password", e.target.value)} required autoComplete="new-password" />
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {pwChecks.map((c) => (
                    <span key={c.label} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {c.ok ? "✓" : "•"} {c.label}
                    </span>
                  ))}
                </div>
              </label>
              <label className="block space-y-1">
                <span className="block text-slate-700 font-bold">Confirm password *</span>
                <PasswordInput className={input} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" />
              </label>
            </div>
            </>
            )}
            <input type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" value={f.website} onChange={(e) => set("website", e.target.value)} />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
            >
              <span>{loading ? "Registering club…" : "Register club"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Already registered?{" "}
            <Link href="/login" className="text-slate-950 font-bold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
