"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ResourceManager } from "@/components/admin/ResourceManager";
import { Badge } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

export default function AdminNewsPage() {
  return (
    <ResourceManager
      resource="news"
      title="News"
      singular="article"
      subtitle="Publish announcements, match reports and interviews. The latest three appear on the homepage."
      searchKeys={["title", "category", "author"]}
      fields={[
        { name: "title", label: "Title", type: "text", required: true, full: true },
        { name: "category", label: "Category", type: "text", default: "Announcement" },
        { name: "author", label: "Author", type: "text", default: "Editorial Team" },
        { name: "publishedDate", label: "Publish date", type: "datetime", hint: "Future dates stay hidden until then" },
        { name: "tags", label: "Tags", type: "tags", hint: "Comma separated" },
        { name: "isPublished", label: "Published", type: "checkbox", default: true },
        { name: "isFeatured", label: "Featured", type: "checkbox" },
        { name: "featuredImage", label: "Cover image", type: "wideImage" },
        { name: "excerpt", label: "Short summary", type: "textarea" },
        { name: "content", label: "Article body", type: "textarea", hint: "Separate paragraphs with a blank line" },
      ]}
      columns={[
        { label: "Title", render: (r) => <div className="font-bold text-slate-950 min-w-[220px] line-clamp-2">{r.title}</div> },
        { label: "Category", render: (r) => r.category },
        { label: "Published", render: (r) => (r.isPublished ? <Badge tone="green">{formatDate(r.publishedDate)}</Badge> : <Badge tone="amber">DRAFT</Badge>) },
        { label: "Views", render: (r) => <span className="font-mono">{r.views}</span> },
      ]}
      rowActions={(r) => (
        <Link href={`/news/${r.slug}`} target="_blank" className="inline-flex items-center px-2 py-1.5 text-slate-500 hover:text-black" title="Open">
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      )}
    />
  );
}
