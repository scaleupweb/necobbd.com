"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import dynamic from "next/dynamic";

// three.js is only loaded on wide screens, after the page is interactive.
const Footballer3D = dynamic(() => import("./Footballer3D").then((m) => m.Footballer3D), { ssr: false });

/**
 * Login intro: a 3D footballer runs in with a ball, pulls the login card into place and then
 * hangs around beside it. On small screens, or for people who prefer reduced motion, the card
 * simply appears. The card is usable straight away in every case.
 */
export function LoginStage({ children }: { children: ReactNode }) {
  const stage = useRef<HTMLDivElement>(null);
  const [show3d, setShow3d] = useState(false);

  useEffect(() => {
    const wide = window.matchMedia("(min-width: 1024px)").matches;
    const calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (wide && !calm) setShow3d(true);
    else stage.current?.setAttribute("data-anim", "go");
  }, []);

  // Called by the footballer the moment he starts pulling.
  const onPull = useCallback(() => stage.current?.setAttribute("data-anim", "go"), []);

  return (
    <div ref={stage} data-anim="pending" className="ls-stage relative">
      {show3d && (
        <Footballer3D
          onPull={onPull}
          className="hidden lg:block absolute bottom-[-18px] right-full mr-1 w-[340px] h-[430px] pointer-events-none select-none [mask-image:linear-gradient(to_right,transparent,black_18%)]"
        />
      )}
      <div className="ls-card relative">{children}</div>
    </div>
  );
}
