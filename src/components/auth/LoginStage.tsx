import type { ReactNode } from "react";

/**
 * Login intro: a footballer in the site's black-and-gold kit runs in dribbling a ball,
 * reaches out and pulls the login card into place, then stands beside it (breathing, with
 * a wave). Pure CSS + SVG; the card is usable straight away and motion is skipped for
 * people who prefer reduced motion. The footballer only appears on wide screens.
 */
export function LoginStage({ children }: { children: ReactNode }) {
  return (
    <div className="ls-stage relative">
      {/* Footballer */}
      <div aria-hidden className="ls-runner hidden lg:block absolute bottom-0 right-full mr-3 w-[150px] h-[215px] pointer-events-none select-none">
        <svg viewBox="0 0 150 215" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="ls-gold" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#F7DC8B" />
              <stop offset="1" stopColor="#C79A3B" />
            </linearGradient>
            <linearGradient id="ls-kit" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#23252c" />
              <stop offset="1" stopColor="#0B0C0F" />
            </linearGradient>
            <radialGradient id="ls-skin" cx="40%" cy="35%" r="70%">
              <stop offset="0" stopColor="#D49A66" />
              <stop offset="1" stopColor="#A86F3D" />
            </radialGradient>
            <radialGradient id="ls-ballg" cx="35%" cy="30%" r="70%">
              <stop offset="0" stopColor="#ffffff" />
              <stop offset="1" stopColor="#cfd3d9" />
            </radialGradient>
          </defs>

          {/* ground shadow */}
          <ellipse cx="80" cy="208" rx="44" ry="4.5" fill="#0B0C0F" opacity="0.13" />

          <g className="ls-body">
            {/* back arm */}
            <g className="ls-arm-b">
              <rect x="57" y="72" width="13" height="22" rx="6.5" fill="#15161a" />
              <rect x="58.5" y="90" width="10" height="26" rx="5" fill="#A86F3D" />
              <circle cx="63.5" cy="118" r="5.5" fill="#A86F3D" />
            </g>
            {/* back leg */}
            <g className="ls-leg-b">
              <rect x="60" y="136" width="13" height="24" rx="6" fill="#A86F3D" />
              <rect x="60" y="157" width="13" height="38" rx="5" fill="#C79A3B" />
              <path d="M58 193 h18 a6 6 0 0 1 6 6 v4 h-24 z" fill="#0B0C0F" />
            </g>

            {/* shorts */}
            <path d="M52 119 C68 125 88 125 104 119 L106 141 L81 143 L78 134 L75 143 L50 141 Z" fill="#1b1c21" />
            <path d="M52 119 C68 125 88 125 104 119" stroke="url(#ls-gold)" strokeWidth="2.5" fill="none" />
            {/* jersey */}
            <path d="M54 76 C57 64 99 64 102 76 L104 121 C88 127 68 127 52 121 Z" fill="url(#ls-kit)" />
            <path d="M55 80 L58 120" stroke="url(#ls-gold)" strokeWidth="3" strokeLinecap="round" opacity="0.85" />
            <path d="M68 66 Q78 75 88 66" stroke="url(#ls-gold)" strokeWidth="3" fill="none" strokeLinecap="round" />
            <text x="72" y="105" textAnchor="middle" fontSize="18" fontWeight="900" fill="url(#ls-gold)" fontFamily="Arial Black, Arial, sans-serif">
              10
            </text>

            {/* neck + head */}
            <rect x="72" y="54" width="11" height="12" rx="4" fill="#A86F3D" />
            <circle cx="78" cy="38" r="19" fill="url(#ls-skin)" />
            <circle cx="66" cy="42" r="4" fill="#B07A45" />
            <path d="M59 40 C58 21 70 15 82 16 C96 17 100 28 97 36 C92 29 84 27 76 29 C69 31 63 35 59 40 Z" fill="#141518" />
            <path d="M83 33 q4 -2.5 8 0" stroke="#141518" strokeWidth="2" fill="none" strokeLinecap="round" />
            <circle cx="87" cy="39.5" r="2.4" fill="#141518" />
            <circle cx="87.8" cy="38.7" r="0.7" fill="#fff" />
            <path d="M85 48 q4 2.5 8 -1" stroke="#6b4022" strokeWidth="1.8" fill="none" strokeLinecap="round" />

            {/* front leg */}
            <g className="ls-leg-f">
              <rect x="78" y="136" width="14" height="24" rx="6" fill="#C08552" />
              <rect x="78" y="157" width="14" height="38" rx="5" fill="url(#ls-gold)" />
              <rect x="78" y="160" width="14" height="3" fill="#0B0C0F" opacity="0.35" />
              <path d="M76 193 h21 a7 7 0 0 1 7 7 v3 h-28 z" fill="#0B0C0F" />
            </g>
            {/* front arm */}
            <g className="ls-arm-f">
              <rect x="88" y="72" width="14" height="22" rx="7" fill="#1d1e24" />
              <rect x="88" y="89" width="14" height="3.5" rx="1.5" fill="url(#ls-gold)" />
              <rect x="89.5" y="92" width="11" height="26" rx="5.5" fill="#C08552" />
              <circle cx="95" cy="120" r="6" fill="#C08552" />
            </g>
          </g>

          {/* ball */}
          <g className="ls-ball">
            <circle cx="124" cy="194" r="12" fill="url(#ls-ballg)" stroke="#0B0C0F" strokeWidth="1.4" />
            <path d="M124 187 l5.5 4 l-2 6.5 h-7 l-2 -6.5 z" fill="#0B0C0F" />
            <path d="M124 182.5 v4.5 M129.5 191 l4.5 -1.8 M127.5 197.5 l2.8 4.5 M120.5 197.5 l-2.8 4.5 M118.5 191 l-4.5 -1.8" stroke="#0B0C0F" strokeWidth="1.2" />
          </g>
        </svg>
      </div>

      <div className="ls-card relative">{children}</div>
    </div>
  );
}
