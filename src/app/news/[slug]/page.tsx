import { notFound } from "next/navigation";
import Link from "next/link";
import { Newspaper, Calendar, Eye, User, ArrowLeft, Share2, Tag } from "lucide-react";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function NewsArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await db.getNewsBySlug(slug);

  if (!article) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <Link href="/news" className="inline-flex items-center space-x-2 text-xs font-bold text-slate-500 hover:text-black transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to News Coverage</span>
      </Link>

      <div className="space-y-4">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-slate-100 text-slate-900 border border-slate-200 text-xs font-bold uppercase">
          <span>{article.category}</span>
        </div>

        <h1 className="text-3xl sm:text-5xl font-black text-slate-950 tracking-tight leading-tight">
          {article.title}
        </h1>

        <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pb-4 border-b border-slate-200">
          <span className="flex items-center text-slate-700"><User className="w-3.5 h-3.5 mr-1 text-black" /> By {article.author}</span>
          <span>•</span>
          <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1 text-black" /> {formatDate(article.publishedDate)}</span>
          <span>•</span>
          <span className="flex items-center"><Eye className="w-3.5 h-3.5 mr-1 text-black" /> {article.views} reads</span>
        </div>
      </div>

      {/* Featured Banner */}
      <div className="relative h-[260px] sm:h-[360px] lg:h-[420px] rounded-3xl overflow-hidden border border-slate-200 shadow-sm bg-[#111111]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.featuredImage} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-60" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={article.featuredImage} alt={article.title} className="relative w-full h-full object-contain" />
      </div>

      {/* Article Content */}
      <div className="prose max-w-none text-slate-700 leading-relaxed space-y-4 text-sm sm:text-base">
        <p className="text-lg text-slate-950 font-medium leading-relaxed">
          {article.excerpt}
        </p>
        {String(article.content || "")
          .split(/\n{2,}/)
          .filter(Boolean)
          .map((para: string, i: number) => (
            <p key={i} className="whitespace-pre-line">{para}</p>
          ))}
      </div>

      {/* Tags & Footer */}
      <div className="pt-6 border-t border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <Tag className="w-4 h-4 text-black" />
          <div className="flex flex-wrap gap-1.5">
            {article.tags?.map((tag: string, idx: number) => (
              <span key={idx} className="px-2.5 py-0.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-medium">
                #{tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
