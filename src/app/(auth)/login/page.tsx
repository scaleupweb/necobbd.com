"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock, Mail, User, ShieldAlert, ArrowRight, Sparkles } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ emailOrUsername, password }),
      });

      const json = await res.json();
      if (json.success) {
        // Only follow same-site relative paths from ?next= to avoid open redirects.
        const next = new URLSearchParams(window.location.search).get("next") || "";
        const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "";
        const staff = ["SUPER_ADMIN", "ADMIN", "MODERATOR", "TOURNAMENT_OFFICIAL", "SENIOR_REFEREE", "REFEREE"];
        window.location.href = safeNext || (staff.includes(json.data.role) ? "/admin" : "/dashboard");
      } else {
        setError(json.error?.message || "Invalid credentials.");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-black p-0.5 mx-auto flex items-center justify-center shadow-sm">
            <Lock className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-950">Welcome Back</h1>
          <p className="text-xs text-slate-500">Access your athlete profile, match reports & club portal</p>
        </div>

        {/* Form Card */}
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-700 font-bold mb-1.5">Email or Username</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="you@example.com or username"
                  autoComplete="username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-700 font-bold">Password</label>
                <Link href="/forgot-password" className="text-[11px] text-slate-600 hover:text-black hover:underline">
                  Forgot?
                </Link>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 shadow-sm transition-all flex items-center justify-center space-x-2"
            >
              <span>{loading ? "Authenticating..." : "Sign In to Portal"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Don&apos;t have an account yet?{" "}
            <Link href="/register" className="text-slate-950 font-bold hover:underline">
              Create one
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
