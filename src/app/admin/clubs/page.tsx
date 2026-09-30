"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ResourceManager, FieldDef } from "@/components/admin/ResourceManager";
import { api, Badge, statusTone } from "@/components/admin/ui";
import { clubLogo } from "@/lib/crest";

export default function AdminClubsPage() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    api<any[]>("/api/admin/users").then(setUsers).catch(() => setUsers([]));
  }, []);

  const managerName = useMemo(() => new Map(users.map((u) => [u.id, u.fullName])), [users]);

  const fields: FieldDef[] = [
    { name: "name", label: "Club name", type: "text", required: true },
    { name: "shortName", label: "Short tag (2–6 letters)", type: "text", required: true },
    { name: "location", label: "City / location", type: "text" },
    { name: "status", label: "Status", type: "select", required: true, default: "ACTIVE", options: ["ACTIVE", "PENDING", "SUSPENDED", "INACTIVE"].map((v) => ({ value: v, label: v })) },
    {
      name: "managerId",
      label: "Club manager",
      type: "select",
      hint: "The user becomes this club's manager and can bid in the transfer market. Give them the CLUB_MANAGER role under Users.",
      options: users.map((u) => ({ value: u.id, label: `${u.fullName} (@${u.username}) · ${u.role.replace(/_/g, " ")}` })),
    },
    { name: "slogan", label: "Slogan", type: "text" },
    { name: "email", label: "Club email", type: "text" },
    { name: "facebookPage", label: "Facebook page", type: "text", placeholder: "https://" },
    { name: "isAcademy", label: "Academy club", type: "checkbox" },
    { name: "trophiesCount", label: "Trophies", type: "number", default: 0 },
    { name: "marketValue", label: "Base club value ($M)", type: "number", default: 0, hint: "Squad value is added automatically" },
    { name: "logo", label: "Logo", type: "image" },
    { name: "banner", label: "Banner", type: "wideImage" },
    { name: "description", label: "Description", type: "textarea" },
  ];

  return (
    <ResourceManager
      resource="clubs"
      title="Clubs"
      singular="club"
      subtitle="Create clubs, assign managers and keep club details up to date. Assign players to clubs from the Players page."
      searchKeys={["name", "shortName", "location"]}
      fields={fields}
      columns={[
        {
          label: "Club",
          render: (r) => (
            <div className="flex items-center gap-2.5 min-w-[180px]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={clubLogo(r)} alt="" className="w-9 h-9 rounded-lg object-cover border border-slate-200" />
              <div>
                <div className="font-bold text-slate-950">{r.name}</div>
                <div className="text-[10px] text-slate-500">{r.shortName} · {r.location || "—"}</div>
              </div>
            </div>
          ),
        },
        { label: "Manager", render: (r) => (r.managerId ? managerName.get(r.managerId) || "—" : <span className="text-slate-400">None</span>) },
        { label: "Points", render: (r) => <span className="font-mono">{r.points}</span> },
        { label: "W-D-L", render: (r) => <span className="font-mono">{r.stats?.wins ?? 0}-{r.stats?.draws ?? 0}-{r.stats?.losses ?? 0}</span> },
        { label: "Status", render: (r) => <Badge tone={statusTone(r.status)}>{r.status}</Badge> },
      ]}
      rowActions={(r) => (
        <Link href={`/clubs/${r.slug}`} target="_blank" className="inline-flex items-center px-2 py-1.5 text-slate-500 hover:text-black" title="Open">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      )}
    />
  );
}
