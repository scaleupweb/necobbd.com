"use client";

import { useState } from "react";
import { ResourceManager } from "@/components/admin/ResourceManager";

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

      {tab === "partners" && (
        <ResourceManager
          key="partners"
          resource="partners"
          title="Partners"
          singular="partner"
          subtitle="Shown in the homepage marquee and on the Partners page."
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "category", label: "Category", type: "text", default: "Partner", placeholder: "Title Partner, University…" },
            { name: "website", label: "Website", type: "text", placeholder: "https://" },
            { name: "order", label: "Sort order", type: "number", default: 0 },
            { name: "logo", label: "Logo", type: "image" },
            { name: "description", label: "Description", type: "textarea" },
          ]}
          columns={[
            { label: "Partner", render: (r) => <div className="flex items-center gap-2"><Logo src={r.logo} /><span className="font-bold">{r.name}</span></div> },
            { label: "Category", render: (r) => r.category },
            { label: "Order", render: (r) => r.order },
          ]}
        />
      )}

      {tab === "sponsors" && (
        <ResourceManager
          key="sponsors"
          resource="sponsors"
          title="Sponsors"
          singular="sponsor"
          subtitle="Listed on the Partners page."
          fields={[
            { name: "name", label: "Name", type: "text", required: true },
            { name: "placement", label: "Placement", type: "text", default: "Homepage" },
            { name: "website", label: "Website", type: "text", placeholder: "https://" },
            { name: "priority", label: "Priority (lower = first)", type: "number", default: 0 },
            { name: "logo", label: "Logo", type: "image" },
          ]}
          columns={[
            { label: "Sponsor", render: (r) => <div className="flex items-center gap-2"><Logo src={r.logo} /><span className="font-bold">{r.name}</span></div> },
            { label: "Placement", render: (r) => r.placement },
            { label: "Priority", render: (r) => r.priority },
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
