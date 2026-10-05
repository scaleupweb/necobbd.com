import type { LucideIcon } from "lucide-react";

/** A friendly "nothing here yet" panel for lists that are empty until real data arrives. */
export function EmptyState({ icon: Icon, title, text }: { icon: LucideIcon; title: string; text: string }) {
  return (
    <div className="py-16 px-6 text-center rounded-2xl border border-dashed border-slate-300 bg-white">
      <Icon className="w-8 h-8 mx-auto text-slate-300" />
      <div className="mt-3 text-sm font-black text-slate-950">{title}</div>
      <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto">{text}</p>
    </div>
  );
}
