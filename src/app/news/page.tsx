import Link from "next/link";
import { Newspaper, Calendar, Eye, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const articles = await db.getNews();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      
      {/* Page Header */}
      <div className="pb-6 border-b border-slate-200">
        <div className="inline-flex items-center space-x-2 text-xs font-bold text-slate-600 uppercase tracking-widest mb-1.5">
          <Newspaper className="w-4 h-4 text-black" />
          <span>Official Esports Media & Coverage</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-950 tracking-tight">
          News, Broadcasts & <span className="text-slate-500">Editorials</span>
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-xl">
          Tournament reports, transfer market disclosures, player interviews, and official federation announcements.
        </p>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {articles.length === 0 && (
          <div className="md:col-span-2 lg:col-span-3 rounded-3xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">No news published yet.</div>
        )}
        {articles.map((art: any) => (
          <div
            key={art.id}
            className="rounded-3xl bg-white border border-slate-200 overflow-hidden hover:border-black shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
          >
            <div className="relative h-52 overflow-hidden bg-slate-100">
              <img
                src={art.featuredImage}
                alt={art.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-0.5 rounded-full bg-black/90 text-white text-[10px] font-bold uppercase tracking-wider">
                {art.category}
              </div>
            </div>

            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 mb-2">
                  <span>{formatDate(art.publishedDate)}</span>
                  <span>•</span>
                  <span className="flex items-center"><Eye className="w-3 h-3 mr-1" /> {art.views} views</span>
                </div>
                <Link
                  href={`/news/${art.slug}`}
                  className="text-base font-bold text-slate-950 group-hover:text-black transition-colors line-clamp-2"
                >
                  {art.title}
                </Link>
                <p className="text-xs text-slate-600 line-clamp-2 mt-2 leading-relaxed">
                  {art.excerpt}
                </p>
              </div>

              <Link
                href={`/news/${art.slug}`}
                className="inline-flex items-center text-xs font-bold text-black hover:underline pt-3 border-t border-slate-100"
              >
                <span>Read Full Article</span>
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Link>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
