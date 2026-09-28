"use client";

import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge, statusTone } from "@/components/admin/ui";

export default function AdminRefereesPage() {
  return (
    <ResourceManager
      resource="referees"
      title="Match Officials"
      singular="official"
      subtitle="Referees you can assign to fixtures. To let an official approve results, also give their user account a referee role under Users & Roles."
      fields={[
        { name: "name", label: "Full name", type: "text", required: true },
        { name: "officialId", label: "Official ID", type: "text", placeholder: "REF-001" },
        { name: "tier", label: "Tier", type: "select", required: true, default: "TIER_2", options: ["TIER_1", "TIER_2", "TIER_3"].map((v) => ({ value: v, label: v.replace("_", " ") })) },
        { name: "role", label: "Title", type: "text", default: "Match Official" },
        { name: "status", label: "Status", type: "select", required: true, default: "ACTIVE", options: ["ACTIVE", "INACTIVE", "SUSPENDED"].map((v) => ({ value: v, label: v })) },
        { name: "rating", label: "Rating (0–5)", type: "number", default: 4.5 },
        { name: "matchesOfficiated", label: "Matches officiated", type: "number", default: 0 },
        { name: "fairPlayScore", label: "Fair play score (0–100)", type: "number", default: 95 },
        { name: "avatar", label: "Photo", type: "image" },
        { name: "bio", label: "Bio", type: "textarea" },
      ]}
      columns={[
        {
          label: "Official",
          render: (r) => (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={r.avatar || "/images/placeholders/avatar.svg"} alt="" className="w-9 h-9 rounded-lg object-cover" />
              <div>
                <div className="font-bold">{r.name}</div>
                <div className="text-[10px] text-slate-500">{r.officialId || r.role}</div>
              </div>
            </div>
          ),
        },
        { label: "Tier", render: (r) => <Badge tone="blue">{r.tier.replace("_", " ")}</Badge> },
        { label: "Rating", render: (r) => <span className="font-mono">{r.rating}</span> },
        { label: "Matches", render: (r) => <span className="font-mono">{r.matchesOfficiated}</span> },
        { label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
      ]}
    />
  );
}
