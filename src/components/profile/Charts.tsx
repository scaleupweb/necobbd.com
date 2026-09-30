// Small dependency-free SVG charts for the player profile (server-rendered).

type Series = { name: string; color: string; values: number[] };

export function LineChart({ labels, series, height = 220 }: { labels: string[]; series: Series[]; height?: number }) {
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 12, t: 14, b: 28 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const step = labels.length > 1 ? (W - pad.l - pad.r) / (labels.length - 1) : 0;
  const x = (i: number) => pad.l + (labels.length > 1 ? i * step : (W - pad.l - pad.r) / 2);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(max * f));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label={series.map((s) => s.name).join(", ")}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E5E7EB" strokeWidth="1" />
            <text x={pad.l - 6} y={y(t) + 3} fontSize="10" textAnchor="end" fill="#6B7280">
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, i) =>
          labels.length <= 8 || i % Math.ceil(labels.length / 8) === 0 || i === labels.length - 1 ? (
            <text key={l + i} x={x(i)} y={H - 8} fontSize="10" textAnchor="middle" fill="#6B7280">
              {l}
            </text>
          ) : null
        )}
        {series.map((s) => (
          <g key={s.name}>
            <polyline fill="none" stroke={s.color} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")} />
            {s.values.map((v, i) => (
              <circle key={i} cx={x(i)} cy={y(v)} r="3" fill="#fff" stroke={s.color} strokeWidth="2">
                <title>{`${s.name} · ${labels[i]}: ${v}`}</title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 pt-1">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}

/** Grouped bars per season: matches, wins, goals. */
export function BarChart({ labels, series, height = 200 }: { labels: string[]; series: Series[]; height?: number }) {
  const W = 640;
  const H = height;
  const pad = { l: 34, r: 12, t: 14, b: 28 };
  const max = Math.max(1, ...series.flatMap((s) => s.values));
  const groupW = (W - pad.l - pad.r) / Math.max(labels.length, 1);
  const barW = Math.min(28, (groupW * 0.7) / series.length);
  const y = (v: number) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const ticks = [0, 0.5, 1].map((f) => Math.round(max * f));

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Season performance">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.l} x2={W - pad.r} y1={y(t)} y2={y(t)} stroke="#E5E7EB" />
            <text x={pad.l - 6} y={y(t) + 3} fontSize="10" textAnchor="end" fill="#6B7280">
              {t}
            </text>
          </g>
        ))}
        {labels.map((l, gi) => {
          const gx = pad.l + gi * groupW + (groupW - barW * series.length) / 2;
          return (
            <g key={l}>
              {series.map((s, si) => (
                <rect key={s.name} x={gx + si * barW} y={y(s.values[gi])} width={barW - 3} height={Math.max(0, H - pad.b - y(s.values[gi]))} rx="3" fill={s.color}>
                  <title>{`${s.name} ${l}: ${s.values[gi]}`}</title>
                </rect>
              ))}
              <text x={pad.l + gi * groupW + groupW / 2} y={H - 8} fontSize="10" textAnchor="middle" fill="#6B7280">
                {l}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap justify-center gap-4 pt-1">
        {series.map((s) => (
          <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} /> {s.name}
          </span>
        ))}
      </div>
    </div>
  );
}
