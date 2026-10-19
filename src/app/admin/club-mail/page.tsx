"use client";

import { useEffect, useMemo, useState } from "react";
import { Mail, Send, Loader2, Search, CheckCircle2, XCircle, FlaskConical } from "lucide-react";
import { api, Button, Notice, PageHeader, inputCls } from "@/components/admin/ui";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { toast, confirmDialog } from "@/lib/feedback";

type Club = { id: string; name: string; shortName: string; logo: string; status: string; clubEmail: string; managerEmail: string; managerName: string };
type Result = { clubId: string; name: string; to: string[]; ok: boolean; error?: string };

const BATCH = 10;

export default function AdminClubMailPage() {
  const [clubs, setClubs] = useState<Club[] | null>(null);
  const [configured, setConfigured] = useState(true);
  const [error, setError] = useState("");
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const [mode, setMode] = useState<"all" | "pick">("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [includeManager, setIncludeManager] = useState(true);
  const [query, setQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [results, setResults] = useState<Result[]>([]);

  useEffect(() => {
    api<{ clubs: Club[]; configured: boolean }>("/api/admin/club-mail")
      .then((d) => {
        setClubs(d.clubs);
        setConfigured(d.configured);
      })
      .catch((e) => setError(e.message));
  }, []);

  const reachable = (c: Club) => !!(c.clubEmail || (includeManager && c.managerEmail));
  const targets = useMemo(() => (clubs || []).filter((c) => (mode === "all" ? c.status === "ACTIVE" : picked.has(c.id)) && reachable(c)), [clubs, mode, picked, includeManager]); // eslint-disable-line react-hooks/exhaustive-deps
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (clubs || []).filter((c) => !q || c.name.toLowerCase().includes(q) || c.shortName.toLowerCase().includes(q) || c.clubEmail.includes(q) || c.managerEmail.includes(q));
  }, [clubs, query]);
  const ready = subject.trim().length >= 3 && !!html;

  const toggle = (id: string) =>
    setPicked((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const sendTest = async () => {
    setTesting(true);
    try {
      const r = await api<{ to: string }>("/api/admin/club-mail", { method: "POST", json: { subject, html, test: true } });
      toast.success(`Test email sent to ${r.to}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setTesting(false);
    }
  };

  const send = async () => {
    if (!targets.length) return;
    const yes = await confirmDialog({
      title: `Email ${targets.length} club${targets.length === 1 ? "" : "s"}?`,
      text: `"${subject.trim()}" goes to each club separately${includeManager ? " (club email and main manager's email)" : " (club email only)"}. This can't be undone.`,
      confirmText: `Send to ${targets.length}`,
    });
    if (!yes) return;
    setSending(true);
    setResults([]);
    setProgress({ done: 0, total: targets.length });
    const all: Result[] = [];
    try {
      for (let i = 0; i < targets.length; i += BATCH) {
        const ids = targets.slice(i, i + BATCH).map((c) => c.id);
        try {
          const r = await api<{ results: Result[] }>("/api/admin/club-mail", { method: "POST", json: { subject, html, clubIds: ids, includeManager } });
          all.push(...r.results);
        } catch (e: any) {
          for (const id of ids) all.push({ clubId: id, name: targets.find((c) => c.id === id)?.name || id, to: [], ok: false, error: e.message });
        }
        setResults([...all]);
        setProgress({ done: Math.min(i + BATCH, targets.length), total: targets.length });
      }
      const okCount = all.filter((r) => r.ok).length;
      if (okCount === all.length) toast.success(`Email sent to ${okCount} club${okCount === 1 ? "" : "s"}`);
      else toast.error(`${okCount} sent, ${all.length - okCount} failed — see the list below`);
    } finally {
      setSending(false);
    }
  };

  const failed = results.filter((r) => !r.ok);

  return (
    <div className="space-y-6">
      <PageHeader title="Email Clubs" subtitle="Send one message to every club, or to the clubs you choose. Each club receives its own email." />
      {error && <Notice kind="err">{error}</Notice>}
      {!configured && <Notice kind="err">Email is not set up on this site (SMTP settings are missing), so messages can't be sent.</Notice>}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-6 items-start">
        {/* Message */}
        <section className="space-y-4 min-w-0">
          <label className="block space-y-1">
            <span className="block text-slate-700 font-bold text-xs">Subject</span>
            <input className={inputCls} value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. Registration for NECOB Season 2 is open" maxLength={150} />
          </label>
          <div className="space-y-1">
            <span className="block text-slate-700 font-bold text-xs">Message</span>
            <RichTextEditor value={html} onChange={setHtml} placeholder="Write your message to the clubs…" />
            <span className="block text-[10px] text-slate-400">Each email starts with “Hello &lt;club name&gt; team,” and ends with the NECOB signature.</span>
          </div>
        </section>

        {/* Recipients */}
        <aside className="space-y-4 xl:sticky xl:top-6">
          <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
            <div className="text-xs font-black text-slate-950 uppercase tracking-wider">Send to</div>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-slate-100">
              {(["all", "pick"] as const).map((m) => (
                <button key={m} type="button" onClick={() => setMode(m)} className={`py-2 rounded-lg text-xs font-bold ${mode === m ? "bg-black text-white" : "text-slate-600"}`}>
                  {m === "all" ? "All active clubs" : "Choose clubs"}
                </button>
              ))}
            </div>
            <label className="flex items-start gap-2 text-xs text-slate-700 cursor-pointer">
              <input type="checkbox" checked={includeManager} onChange={(e) => setIncludeManager(e.target.checked)} className="mt-0.5 w-4 h-4 accent-black" />
              <span>
                Also send to the <b>main manager’s</b> account email (when it’s different from the club email)
              </span>
            </label>

            {mode === "pick" && (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input className={`${inputCls} pl-8`} value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clubs…" />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-500">{picked.size} chosen</span>
                  <span className="flex gap-2">
                    <button type="button" className="font-bold text-slate-700 hover:underline" onClick={() => setPicked(new Set(filtered.map((c) => c.id)))}>
                      Select shown
                    </button>
                    <button type="button" className="font-bold text-slate-500 hover:underline" onClick={() => setPicked(new Set())}>
                      Clear
                    </button>
                  </span>
                </div>
                <div className="max-h-[340px] overflow-y-auto rounded-xl border border-slate-200 divide-y divide-slate-100">
                  {clubs === null ? (
                    <div className="py-8 text-center"><Loader2 className="w-4 h-4 animate-spin mx-auto text-slate-400" /></div>
                  ) : (
                    filtered.map((c) => (
                      <label key={c.id} className={`flex items-center gap-2.5 px-2.5 py-2 text-xs cursor-pointer hover:bg-slate-50 ${!reachable(c) ? "opacity-50" : ""}`}>
                        <input type="checkbox" checked={picked.has(c.id)} onChange={() => toggle(c.id)} disabled={!reachable(c)} className="w-4 h-4 accent-black shrink-0" />
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={c.logo} alt="" className="w-7 h-7 rounded-lg object-cover bg-slate-100 shrink-0" />
                        <span className="min-w-0">
                          <span className="block font-bold text-slate-900 truncate">
                            {c.name} {c.status !== "ACTIVE" && <span className="text-amber-700 font-black">· {c.status}</span>}
                          </span>
                          <span className="block text-[10px] text-slate-500 truncate">{c.clubEmail || c.managerEmail || "no email"}</span>
                        </span>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
              <b className="text-slate-950">{targets.length}</b> club{targets.length === 1 ? "" : "s"} will get this email
              {mode === "all" && clubs && <span className="text-slate-500"> (active clubs with an email)</span>}
            </div>

            <div className="flex flex-col gap-2">
              <Button variant="secondary" onClick={sendTest} disabled={!ready || testing || sending || !configured}>
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />} Send a test to me first
              </Button>
              <Button onClick={send} disabled={!ready || sending || !targets.length || !configured}>
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} {sending ? `Sending… ${progress.done}/${progress.total}` : `Send to ${targets.length} club${targets.length === 1 ? "" : "s"}`}
              </Button>
            </div>
            {sending && (
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%` }} />
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex items-center gap-2 font-black text-slate-950">
                <Mail className="w-4 h-4" /> {results.length - failed.length} sent{failed.length ? `, ${failed.length} failed` : ""}
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {[...failed, ...results.filter((r) => r.ok)].map((r) => (
                  <div key={r.clubId} className="py-1.5 flex items-start gap-2">
                    {r.ok ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" /> : <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />}
                    <span className="min-w-0">
                      <span className="font-bold text-slate-900">{r.name}</span>
                      <span className="block text-[10px] text-slate-500 break-all">{r.ok ? r.to.join(", ") : r.error}</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
