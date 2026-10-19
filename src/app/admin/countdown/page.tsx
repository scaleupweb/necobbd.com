"use client";

import { useEffect, useState } from "react";
import { Play, Square, Save, Loader2, Timer } from "lucide-react";
import { api, Button, Field, inputCls, Notice, PageHeader, toLocalInput, fromLocalInput, Badge } from "@/components/admin/ui";
import { CountdownBanner } from "@/components/home/CountdownBanner";
import type { SiteSettings } from "@/lib/site-settings";

export default function CountdownAdminPage() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [c, setC] = useState<SiteSettings["countdown"] | null>(null);
  const [local, setLocal] = useState("");
  const [tournaments, setTournaments] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = async () => {
    const [s, t] = await Promise.all([api<SiteSettings>("/api/admin/settings"), api<any[]>("/api/admin/resources/tournaments")]);
    setSettings(s);
    setC(s.countdown);
    setLocal(toLocalInput(s.countdown.targetDate));
    setTournaments(t.filter((x) => !["COMPLETED", "CANCELLED"].includes(x.status)));
  };

  useEffect(() => {
    load().catch((e) => setMsg({ ok: false, text: e.message }));
  }, []);

  const persist = async (enabled: boolean) => {
    if (!settings || !c) return;
    setBusy(true);
    setMsg(null);
    try {
      const countdown = { ...c, enabled, targetDate: fromLocalInput(local) };
      const saved = await api<SiteSettings>("/api/admin/settings", { method: "PUT", json: { ...settings, countdown } });
      setSettings(saved);
      setC(saved.countdown);
      setMsg({
        ok: true,
        text: enabled
          ? "Countdown is live on the homepage." + (countdown.tournamentId ? " Tournament registration has been opened." : "")
          : "Countdown stopped." + (countdown.tournamentId ? " Tournament registration has been closed." : ""),
      });
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(false);
    }
  };

  if (!c) return msg ? <Notice kind="err">{msg.text}</Notice> : <div className="py-20 text-center text-xs text-slate-500 animate-pulse">Loading…</div>;

  const set = (k: keyof SiteSettings["countdown"], v: any) => setC({ ...c, [k]: v });
  const target = fromLocalInput(local);
  const running = settings?.countdown.enabled && settings.countdown.targetDate && new Date(settings.countdown.targetDate).getTime() > Date.now();

  const quick = (hours: number) => setLocal(toLocalInput(new Date(Date.now() + hours * 3600000).toISOString()));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Registration Countdown"
        subtitle="Show a live countdown on the homepage and open/close a tournament's registration with one click."
        actions={running ? <Badge tone="green">RUNNING</Badge> : <Badge>STOPPED</Badge>}
      />
      {msg && <Notice kind={msg.ok ? "ok" : "err"}>{msg.text}</Notice>}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 rounded-2xl bg-white border border-slate-200 p-5 shadow-sm space-y-4">
          <Field label="Linked tournament (optional)" hint="When linked, starting the countdown opens registration and sets the deadline; stopping it closes registration.">
            <select className={inputCls} value={c.tournamentId} onChange={(e) => set("tournamentId", e.target.value)}>
              <option value="">— None (just show a countdown) —</option>
              {tournaments.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} ({t.status.replace(/_/g, " ").toLowerCase()})
                </option>
              ))}
            </select>
          </Field>

          <Field label="Countdown ends at *" hint="Your local time.">
            <input type="datetime-local" className={inputCls} value={local} onChange={(e) => setLocal(e.target.value)} />
          </Field>
          <div className="flex flex-wrap gap-2">
            {[
              [1, "+1 hour"],
              [24, "+1 day"],
              [72, "+3 days"],
              [168, "+1 week"],
            ].map(([h, l]) => (
              <Button key={l} small variant="secondary" onClick={() => quick(h as number)}>
                {l}
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <Field label="Small label">
              <input className={inputCls} value={c.label} onChange={(e) => set("label", e.target.value)} />
            </Field>
            <Field label="Title">
              <input className={inputCls} value={c.title} onChange={(e) => set("title", e.target.value)} />
            </Field>
            <Field label="Description" full>
              <input className={inputCls} value={c.description} onChange={(e) => set("description", e.target.value)} />
            </Field>
            <Field label="Button label">
              <input className={inputCls} value={c.ctaLabel} onChange={(e) => set("ctaLabel", e.target.value)} />
            </Field>
            <Field label="Button link" hint="Leave as /tournaments to auto-link the chosen tournament">
              <input className={inputCls} value={c.ctaHref} onChange={(e) => set("ctaHref", e.target.value)} />
            </Field>
            <Field label="Text shown after it ends" full>
              <input className={inputCls} value={c.endedText} onChange={(e) => set("endedText", e.target.value)} />
            </Field>
          </div>

          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <Button variant="success" onClick={() => persist(true)} disabled={busy || !target}>
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} {running ? "Update & keep running" : "Start countdown"}
            </Button>
            {running && (
              <Button variant="danger" onClick={() => persist(false)} disabled={busy}>
                <Square className="w-4 h-4" /> Stop countdown
              </Button>
            )}
            {!running && (
              <Button variant="secondary" onClick={() => persist(false)} disabled={busy}>
                <Save className="w-4 h-4" /> Save without starting
              </Button>
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-3">
          <div className="text-xs font-bold text-slate-500 uppercase">Preview</div>
          {target ? (
            <CountdownBanner
              preview
              countdown={{ ...c, targetDate: target }}
              tournament={(() => {
                const t: any = tournaments.find((x: any) => x.id === c.tournamentId);
                if (!t) return null;
                // Count entries the same way the homepage does (removed entries don't count).
                const list = (t.participantType === "CLUB" ? t.clubParticipants : t.participants) || [];
                const count = list.filter((x: any) => x.status !== "REMOVED").length;
                return { slug: t.slug, name: t.name, currentParticipants: count, maxParticipants: t.maxParticipants || 0 };
              })()}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">Pick an end time to see the preview</div>
          )}
        </div>
      </div>
    </div>
  );
}
