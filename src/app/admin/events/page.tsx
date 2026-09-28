"use client";

import { useEffect, useState } from "react";
import { Users, UserMinus, Download } from "lucide-react";
import { ResourceManager, FieldDef } from "@/components/admin/ResourceManager";
import { api, Badge, Button, Empty, Modal, Notice, statusTone } from "@/components/admin/ui";
import { formatDate, formatTime } from "@/lib/utils";

const FIELDS: FieldDef[] = [
  { name: "name", label: "Event name", type: "text", required: true },
  { name: "eventType", label: "Type", type: "text", default: "Meetup", placeholder: "LAN Final, Meetup, Online Qualifier…" },
  { name: "status", label: "Status", type: "select", required: true, default: "ACTIVE", options: ["DRAFT", "ACTIVE", "COMPLETED", "CANCELLED"].map((v) => ({ value: v, label: v })) },
  { name: "venue", label: "Venue", type: "text" },
  { name: "eventDate", label: "Event date & time", type: "datetime", required: true },
  { name: "registrationDeadline", label: "Registration deadline", type: "datetime", hint: "Defaults to the event start" },
  { name: "capacity", label: "Capacity", type: "number", required: true, default: 100 },
  { name: "prizePool", label: "Prize pool", type: "text" },
  { name: "registrationOpen", label: "Registration open", type: "checkbox", default: true },
  { name: "banner", label: "Banner", type: "wideImage" },
  { name: "description", label: "Description", type: "textarea" },
];

export default function AdminEventsPage() {
  const [regsOf, setRegsOf] = useState<any>(null);
  return (
    <>
      <ResourceManager
        resource="events"
        title="Events"
        singular="event"
        subtitle="LAN finals, meetups and qualifiers. Players register from the Events page."
        fields={FIELDS}
        columns={[
          { label: "Event", render: (r) => <div className="font-bold text-slate-950 min-w-[180px]">{r.name}<div className="text-[10px] text-slate-500 font-normal">{r.eventType} · {r.venue || "TBA"}</div></div> },
          { label: "Date", render: (r) => `${formatDate(r.eventDate)} ${formatTime(r.eventDate)}` },
          { label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
          { label: "Registered", render: (r) => <span className="font-mono">{r.registeredCount ?? 0}/{r.capacity}</span> },
          { label: "Open", render: (r) => (r.registrationOpen ? <Badge tone="green">YES</Badge> : <Badge>NO</Badge>) },
        ]}
        rowActions={(r) => (
          <Button small variant="secondary" onClick={() => setRegsOf(r)}>
            <Users className="w-3.5 h-3.5" /> Attendees
          </Button>
        )}
      />
      {regsOf && <RegistrationsModal event={regsOf} onClose={() => setRegsOf(null)} />}
    </>
  );
}

function RegistrationsModal({ event, onClose }: { event: any; onClose: () => void }) {
  const [list, setList] = useState<any[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<any[]>(`/api/admin/events/${event.id}/registrations`).then(setList).catch((e) => setError(e.message));
  }, [event.id]);

  const remove = async (userId: string) => {
    if (!confirm("Remove this registration?")) return;
    try {
      setList(await api(`/api/admin/events/${event.id}/registrations?userId=${userId}`, { method: "DELETE" }));
    } catch (e: any) {
      setError(e.message);
    }
  };

  const exportCsv = () => {
    if (!list) return;
    const rows = [["Name", "Username", "Email", "Registered"], ...list.map((r) => [r.fullName, r.username, r.email, r.joinedAt])];
    const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${event.slug}-attendees.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Modal open onClose={onClose} title={`${event.name} — attendees`} wide>
      <div className="space-y-3">
        {error && <Notice kind="err">{error}</Notice>}
        <div className="flex justify-between items-center text-xs">
          <span>
            <strong>{list?.length ?? 0}</strong> / {event.capacity} registered
          </span>
          <Button small variant="secondary" onClick={exportCsv} disabled={!list?.length}>
            <Download className="w-3.5 h-3.5" /> Export CSV
          </Button>
        </div>
        {list === null ? (
          <div className="py-8 text-center text-xs text-slate-500 animate-pulse">Loading…</div>
        ) : list.length === 0 ? (
          <Empty>No registrations yet.</Empty>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl">
            {list.map((r) => (
              <div key={r.userId} className="flex items-center justify-between gap-3 p-3 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-slate-950">{r.fullName}</div>
                  <div className="text-slate-500 truncate">@{r.username} · {r.email} · {formatDate(r.joinedAt)}</div>
                </div>
                <Button small variant="ghost" onClick={() => remove(r.userId)} title="Remove">
                  <UserMinus className="w-3.5 h-3.5 text-rose-600" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
