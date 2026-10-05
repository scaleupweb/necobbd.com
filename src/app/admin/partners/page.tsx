"use client";

import { useEffect, useState } from "react";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { api, Toggle } from "@/components/admin/ui";
import { toast } from "@/lib/feedback";

/** Master switch: shows or hides the whole partners & sponsors strip on the homepage. */
function SectionSwitch() {
  const [on, setOn] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    api<any>("/api/admin/settings")
      .then((st) => setOn(st.sections?.partners?.show !== false))
      .catch(() => setOn(null));
  }, []);
  const flip = async (v: boolean) => {
    if (busy) return;
    setBusy(true);
    setOn(v);
    try {
      // Re-read the latest settings so nothing else edited meanwhile is overwritten.
      const st = await api<any>("/api/admin/settings");
      st.sections.partners.show = v;
      await api("/api/admin/settings", { method: "PUT", json: st });
      toast.success(v ? "Partners section is now on the homepage" : "Partners section is hidden from the homepage");
    } catch (e: any) {
      setOn(!v);
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  if (on === null) return null;
  return (
    <div className={`flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border p-4 ${on ? "bg-emerald-50/60 border-emerald-200" : "bg-slate-50 border-dashed border-slate-300"}`}>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-black text-slate-950">Partners section on the homepage</div>
        <div className="text-[11px] text-slate-500">
          {on
            ? "On — the partners & sponsors strip shows under the hero. Use the switch on each row to hide single items."
            : "Off — the whole strip is hidden from the homepage. Partners stay listed on the Partners page."}
        </div>
      </div>
      <Toggle checked={on} onChange={flip} label={on ? "Section on" : "Section off"} />
    </div>
  );
}

/** On/off switch for showing one partner or sponsor on the homepage. */
function HomeSwitch({ resource, row, reload }: { resource: "partners" | "sponsors"; row: any; reload: () => void }) {
  const [on, setOn] = useState(row.showOnHome !== false);
  const [busy, setBusy] = useState(false);
  const flip = async (v: boolean) => {
    if (busy) return;
    setBusy(true);
    setOn(v);
    try {
      await api(`/api/admin/resources/${resource}/${row.id}`, { method: "PATCH", json: { showOnHome: v } });
      toast.success(v ? `${row.name} is now on the homepage` : `${row.name} is hidden from the homepage`);
      reload();
    } catch (e: any) {
      setOn(!v);
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <span title={on ? "Shown on the homepage" : "Hidden from the homepage"} className="mr-1">
      <Toggle checked={on} onChange={flip} label={on ? "On" : "Off"} />
    </span>
  );
}

const TABS = [
  ["partners", "Partners"],
  ["sponsors", "Sponsors"],
  ["leaders", "Leadership team"],
] as const;

const Logo = ({ src }: { src?: string }) => (
  // eslint-disable-next-line @next/next/no-img-element
  <img src={src || "/images/placeholders/club.svg"} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
);

export default function AdminPartnersPage() {
  const [tab, setTab] = useState<(typeof TABS)[number][0]>("partners");

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TABS.map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`px-3.5 py-2 rounded-xl text-xs font-bold ${tab === k ? "bg-black text-white" : "bg-white border border-slate-200"}`}>
            {l}
          </button>
        ))}
      </div>

      {tab !== "leaders" && <SectionSwitch />}

      {tab === "partners" && (
        <ResourceManager
          key="partners"
          resource="partners"
          title="Partners"
          singular="partner"
          subtitle="Switch each partner on or off for the homepage strip. All partners are listed on the Partners page."
          rowActions={(r, reload) => <HomeSwitch resource="partners" row={r} reload={reload} />}
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "category", label: "Category", type: "text", default: "Partner", placeholder: "Title Partner, University…" },
            { name: "website", label: "Website", type: "text", placeholder: "https://" },
            { name: "order", label: "Sort order", type: "number", default: 0 },
            { name: "logo", label: "Logo", type: "image" },
            { name: "description", label: "Description", type: "textarea" },
            { name: "showOnHome", label: "Show on homepage", type: "checkbox", default: true },
          ]}
          columns={[
            { label: "Partner", render: (r) => <div className="flex items-center gap-2"><Logo src={r.logo} /><span className="font-bold">{r.name}</span></div> },
            { label: "Category", render: (r) => r.category },
            { label: "Order", render: (r) => r.order },
            { label: "Homepage", render: (r) => (r.showOnHome !== false ? <span className="text-emerald-700 font-bold">Shown</span> : <span className="text-slate-400 font-bold">Hidden</span>) },
          ]}
        />
      )}

      {tab === "sponsors" && (
        <ResourceManager
          key="sponsors"
          resource="sponsors"
          title="Sponsors"
          singular="sponsor"
          subtitle="Switch each sponsor on or off for the homepage strip. All sponsors are listed on the Partners page."
          rowActions={(r, reload) => <HomeSwitch resource="sponsors" row={r} reload={reload} />}
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "placement", label: "Placement", type: "text", default: "Homepage" },
            { name: "website", label: "Website", type: "text", placeholder: "https://" },
            { name: "priority", label: "Priority (lower = first)", type: "number", default: 0 },
            { name: "logo", label: "Logo", type: "image" },
            { name: "showOnHome", label: "Show on homepage", type: "checkbox", default: true },
          ]}
          columns={[
            { label: "Sponsor", render: (r) => <div className="flex items-center gap-2"><Logo src={r.logo} /><span className="font-bold">{r.name}</span></div> },
            { label: "Placement", render: (r) => r.placement },
            { label: "Priority", render: (r) => r.priority },
            { label: "Homepage", render: (r) => (r.showOnHome !== false ? <span className="text-emerald-700 font-bold">Shown</span> : <span className="text-slate-400 font-bold">Hidden</span>) },
          ]}
        />
      )}

      {tab === "leaders" && (
        <ResourceManager
          key="leaders"
          resource="leaders"
          title="Leadership team"
          singular="member"
          subtitle="Shown on the About page."
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "role", label: "Role / title", type: "text" },
            { name: "category", label: "Group", type: "text", default: "Core Team" },
            { name: "period", label: "Period", type: "text", placeholder: "2024 – Present" },
            { name: "facebook", label: "Facebook URL", type: "text" },
            { name: "order", label: "Sort order", type: "number", default: 0 },
            { name: "photo", label: "Photo", type: "image" },
            { name: "bio", label: "Short bio", type: "textarea" },
          ]}
          columns={[
            { label: "Member", render: (r) => <div className="flex items-center gap-2"><Logo src={r.photo} /><span className="font-bold">{r.name}</span></div> },
            { label: "Role", render: (r) => r.role },
            { label: "Order", render: (r) => r.order },
          ]}
        />
      )}
    </div>
  );
}
