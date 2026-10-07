"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User, Mail, Lock, Smartphone, Shield, ArrowRight, CheckCircle2, Camera, Trash2, Loader2 } from "lucide-react";
import { PLAYER_POSITIONS, PLAY_STYLES, DEVICE_MODELS } from "@/lib/constants";
import { ClubRegisterForm } from "./ClubRegisterForm";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { uploadImage } from "@/lib/image";
import { CropDialog } from "@/components/ui/CropDialog";

export default function RegisterPage() {
  const [type, setType] = useState<"player" | "club">("player");

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("type") === "club") setType("club");
  }, []);

  const pick = (t: "player" | "club") => {
    setType(t);
    const url = new URL(window.location.href);
    if (t === "club") url.searchParams.set("type", "club");
    else url.searchParams.delete("type");
    window.history.replaceState(null, "", url.toString());
  };

  return (
    <div>
      <div className="max-w-2xl mx-auto px-4 pt-10 -mb-6">
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
          {(
            [
              ["player", "Player Registration", User],
              ["club", "Club Registration", Shield],
            ] as const
          ).map(([k, label, Icon]) => (
            <button
              key={k}
              type="button"
              onClick={() => pick(k)}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                type === k ? "bg-black text-white shadow-sm" : "text-slate-600 hover:text-black"
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>
      </div>
      {type === "player" ? <PlayerRegisterForm /> : <ClubRegisterForm />}
    </div>
  );
}

/** YYYY-MM-DD for the date `years` years ago (bounds for the birthday picker). */
function dobLimit(years: number) {
  const d = new Date();
  d.setFullYear(d.getFullYear() - years);
  return d.toISOString().slice(0, 10);
}

function PlayerRegisterForm() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    konamiId: "",
    deviceModel: "",
    dob: "",
    preferredPosition: "CF",
    playStyle: "Quick Counter",
    facebookProfile: "",
    bio: "",
    phone: "",
    website: "",
  });
  const [confirmPassword, setConfirmPassword] = useState("");
  const pw = formData.password;
  const pwChecks = [
    { ok: pw.length >= 8, label: "8+ characters" },
    { ok: /[a-z]/.test(pw), label: "lowercase" },
    { ok: /[A-Z]/.test(pw), label: "uppercase" },
    { ok: /[0-9]/.test(pw), label: "number" },
  ];
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  // Profile photo: cropped in the browser now, uploaded once the account exists.
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [photoUrl, setPhotoUrl] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState("");
  const photoRef = useRef<HTMLInputElement>(null);

  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  const pickPhoto = async (file?: File) => {
    if (photoRef.current) photoRef.current.value = "";
    if (!file) return;
    setPhotoError("");
    if (!/^image\/(png|jpe?g|webp)$/.test(file.type)) {
      setPhotoError("Use a PNG, JPG or WEBP image");
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setPhotoError("Image is too large (max 15 MB)");
      return;
    }
    setCropFile(file);
  };

  const takeCropped = (blob: Blob) => {
    setCropFile(null);
    setPhoto(blob);
    setPhotoUrl(URL.createObjectURL(blob));
  };

  const clearPhoto = () => {
    setPhoto(null);
    setPhotoUrl("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!pwChecks.every((c) => c.ok)) {
      setError("Password must have 8+ characters with uppercase, lowercase and a number.");
      return;
    }
    if (formData.password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json = await res.json();
      if (json.success) {
        // The account is signed in now, so the photo can be uploaded. A failure here
        // isn't fatal: the player can add a photo later from their profile.
        if (photo) {
          try {
            const avatar = await uploadImage(photo, "avatar.jpg");
            await fetch("/api/me/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ avatar }) });
          } catch {
            /* keep going */
          }
        }
        window.location.href = "/dashboard";
      } else {
        setError(json.error?.message || "Registration failed.");
      }
    } catch (err) {
      setError("An error occurred during registration. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-slate-950">Register as eFootball Athlete</h1>
          <p className="text-xs text-slate-500">Create your player profile, join a club and earn a rating from official matches</p>
        </div>

        {/* Card */}
        <div className="rounded-3xl bg-white border border-slate-200 p-8 shadow-sm space-y-5">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => photoRef.current?.click()}
                className="relative w-20 h-20 shrink-0 rounded-full overflow-hidden border-2 border-dashed border-slate-300 bg-slate-50 hover:border-slate-400 flex items-center justify-center"
                aria-label="Choose profile photo"
              >
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-6 h-6 text-slate-400" />
                )}
                {photoBusy && (
                  <span className="absolute inset-0 bg-white/70 flex items-center justify-center">
                    <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
                  </span>
                )}
              </button>
              <div className="space-y-1.5">
                <label className="block text-slate-700 font-bold">Profile Photo</label>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => photoRef.current?.click()} disabled={photoBusy} className="px-3 py-1.5 rounded-lg bg-black text-white font-bold disabled:opacity-60">
                    {photoUrl ? "Change photo" : "Upload photo"}
                  </button>
                  {photoUrl && (
                    <button type="button" onClick={clearPhoto} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 font-bold">
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
                <p className="text-[11px] text-slate-400">Optional · a clear photo of your face · JPG, PNG or WEBP</p>
                {photoError && <p className="text-[11px] font-bold text-rose-600">{photoError}</p>}
              </div>
              <input ref={photoRef} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pickPhoto(e.target.files?.[0])} />
              <CropDialog file={cropFile} aspect={1} round maxSize={512} title="Adjust your profile photo" onCancel={() => setCropFile(null)} onDone={takeCropped} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Mahim Haider"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Handle / Username *</label>
                <input
                  type="text"
                  placeholder="e.g. mahim_striker"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Email Address *</label>
                <input
                  type="email"
                  placeholder="athlete@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Password *</label>
                <PasswordInput
                  placeholder="••••••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                  required
                  minLength={8}
                  autoComplete="new-password"
                />
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {pwChecks.map((c) => (
                    <span key={c.label} className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${c.ok ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {c.ok ? "✓" : "•"} {c.label}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Confirm Password *</label>
                <PasswordInput
                  placeholder="••••••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                  required
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-slate-700 font-bold mb-1">Phone (private)</label>
                <input
                  type="tel"
                  placeholder="01XXXXXXXXX"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                />
              </div>
            </div>

            {/* Honeypot for bots: hidden from people, left empty */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={formData.website}
              onChange={(e) => setFormData({ ...formData, website: e.target.value })}
              className="hidden"
              aria-hidden="true"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Konami ID / In-Game UID *</label>
                <input
                  type="text"
                  placeholder="e.g. ASEV-130-051-751"
                  value={formData.konamiId}
                  onChange={(e) => setFormData({ ...formData, konamiId: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white font-mono text-xs uppercase"
                  required
                />
                <p className="mt-1 text-[11px] text-slate-500">Your own eFootball User ID (4 letters + 9 numbers). Each UID can only be registered once.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Primary Device Model *</label>
                <input
                  type="text"
                  list="device-models"
                  value={formData.deviceModel}
                  onChange={(e) => setFormData({ ...formData, deviceModel: e.target.value })}
                  placeholder="Type your phone, e.g. Redmi Note 13 Pro"
                  required
                  minLength={2}
                  maxLength={60}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                />
                <datalist id="device-models">
                  {DEVICE_MODELS.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
                <p className="text-[10px] text-slate-400 mt-1">Type any model — suggestions appear as you type.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Preferred Tactical Position</label>
                <select
                  value={formData.preferredPosition}
                  onChange={(e) => setFormData({ ...formData, preferredPosition: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-black focus:bg-white text-xs"
                >
                  {PLAYER_POSITIONS.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Preferred Play Style</label>
                <select
                  value={formData.playStyle}
                  onChange={(e) => setFormData({ ...formData, playStyle: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-black focus:bg-white text-xs"
                >
                  {PLAY_STYLES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-bold mb-1">Date of Birth *</label>
                <input
                  type="date"
                  value={formData.dob}
                  onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                  min={dobLimit(100)}
                  max={dobLimit(8)}
                  required
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 focus:outline-none focus:border-black focus:bg-white text-xs"
                />
                <p className="text-[10px] text-slate-400 mt-1">Only the day and month are shown on your profile.</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">Facebook Profile URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://facebook.com/username"
                  value={formData.facebookProfile}
                  onChange={(e) => setFormData({ ...formData, facebookProfile: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-black focus:bg-white text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-black text-white font-bold text-xs hover:bg-zinc-800 shadow-sm transition-all flex items-center justify-center space-x-2 mt-2"
            >
              <span>{loading ? "Creating Profile..." : "Create my profile"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="text-center text-xs text-slate-500 pt-2 border-t border-slate-100">
            Already registered?{" "}
            <Link href="/login" className="text-slate-950 font-bold hover:underline">
              Sign In to Profile
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
