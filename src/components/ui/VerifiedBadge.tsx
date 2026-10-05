import { useId } from "react";

// Wavy "seal" outline (12 soft lobes), like the verified badge on Facebook.
const SEAL = (() => {
  const pts: string[] = [];
  const n = 144;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const r = 10.6 + 1.15 * Math.cos(a * 12);
    pts.push(`${(12 + r * Math.cos(a)).toFixed(2)},${(12 + r * Math.sin(a)).toFixed(2)}`);
  }
  return `M${pts.join("L")}Z`;
})();

/** Solid blue verified seal with a white tick. Size it with className, e.g. "w-4 h-4". */
export function VerifiedBadge({ className = "w-4 h-4", title = "Verified" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 24 24" className={`inline-block shrink-0 drop-shadow-[0_1px_1.5px_rgba(24,119,242,0.35)] ${className}`} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id={`vb-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3B9BFF" />
          <stop offset="1" stopColor="#0866FF" />
        </linearGradient>
      </defs>
      <path d={SEAL} fill={`url(#vb-${id})`} />
      <path d="M7.4 12.3l3.1 3.1 6.1-6.3" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
