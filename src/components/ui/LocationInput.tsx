"use client";

import { useState } from "react";
import { LocateFixed, Loader2 } from "lucide-react";

/**
 * Text input for a location with a "Detect" button that asks the browser for
 * the user's position and turns it into "City, Division" (e.g. "Dhaka, Dhaka Division").
 */
export function LocationInput({
  value,
  onChange,
  className = "",
  placeholder = "e.g. Dhaka",
  maxLength = 80,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  maxLength?: number;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const detect = () => {
    setError("");
    if (!("geolocation" in navigator)) {
      setError("Your browser can't share location.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          // Free client-side reverse geocoding (no API key needed).
          const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coords.latitude}&longitude=${coords.longitude}&localityLanguage=en`;
          const res = await fetch(url);
          if (!res.ok) throw new Error();
          const d = await res.json();
          const city = d.city || d.locality || "";
          const region = d.principalSubdivision || "";
          const parts = [city, region && !region.toLowerCase().startsWith(city.toLowerCase()) ? region : ""].filter(Boolean);
          const text = (parts.length ? parts.join(", ") : d.countryName || "").slice(0, maxLength);
          if (!text) throw new Error();
          onChange(text);
        } catch {
          setError("Couldn't find your area. Please type it.");
        } finally {
          setBusy(false);
        }
      },
      (err) => {
        setBusy(false);
        setError(err.code === err.PERMISSION_DENIED ? "Location permission was denied." : "Couldn't get your location.");
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 10 * 60 * 1000 }
    );
  };

  return (
    <div className="space-y-1">
      <div className="flex gap-2">
        <input className={`${className} flex-1 min-w-0`} value={value} onChange={(e) => onChange(e.target.value)} maxLength={maxLength} placeholder={placeholder} />
        <button
          type="button"
          onClick={detect}
          disabled={busy}
          title="Detect my location"
          className="shrink-0 inline-flex items-center gap-1.5 px-3 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:border-black hover:text-black disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LocateFixed className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{busy ? "Detecting…" : "Detect"}</span>
        </button>
      </div>
      {error && <p className="text-[11px] text-rose-600">{error}</p>}
    </div>
  );
}
