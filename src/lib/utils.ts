import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  if (!amount || amount <= 0) return "—";
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(1)}B`;
  }
  return `$${amount.toFixed(1)}M`;
}

export function formatDate(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatTime(dateString: string | Date): string {
  const d = new Date(dateString);
  return d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatRelativeTime(dateString: string | Date): string {
  const now = new Date().getTime();
  const past = new Date(dateString).getTime();
  const diffInMinutes = Math.floor((now - past) / (1000 * 60));

  if (diffInMinutes < 1) return "Just now";
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(dateString);
}

export function getFormColor(res: string) {
  switch (res?.toUpperCase()) {
    case "W":
      return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    case "D":
      return "bg-amber-500/20 text-amber-400 border-amber-500/40";
    case "L":
      return "bg-rose-500/20 text-rose-400 border-rose-500/40";
    default:
      return "bg-slate-700/50 text-slate-300 border-slate-600";
  }
}
