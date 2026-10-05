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
  const [shy, setShy] = useState<"none" | "cover" | "peek">("none");

  // He covers his eyes while the password field has focus, and peeks when it's shown as text.
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const pwInput = () => el.querySelector<HTMLInputElement>('input[autocomplete="current-password"], input[autocomplete="new-password"]');
    const update = () => {
      const input = pwInput();
      if (!input) return setShy("none");
      // Password shown as text → he peeks (even if you click elsewhere while it's shown).
      if (input.type === "text") return setShy("peek");
      // Typing a hidden password (the field or its eye button in use) → he covers his eyes.
      setShy(input.parentElement?.contains(document.activeElement) ? "cover" : "none");
    };
    const later = () => setTimeout(update, 0);
    // the eye button changes the input type; watch for that too
    const mo = new MutationObserver(update);
    const input = pwInput();
    if (input) mo.observe(input, { attributes: true, attributeFilter: ["type"] });
    el.addEventListener("focusin", update);
    el.addEventListener("focusout", later);
    return () => {
      mo.disconnect();
      el.removeEventListener("focusin", update);
      el.removeEventListener("focusout", later);
    };
  }, []);

  // Once the card has arrived, drop its animation entirely: a finished-but-held animation keeps the
  // card in its own stacking layer, which would trap the password flashlight under the dark overlay.
  useEffect(() => {
    const el = stage.current;
    const card = el?.querySelector<HTMLElement>(".ls-card");
    if (!el || !card) return;
    const done = (e: AnimationEvent) => {
      if (e.target === card) el.setAttribute("data-anim", "done");
    };
    card.addEventListener("animationend", done);
    return () => card.removeEventListener("animationend", done);
  }, []);

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
          shy={shy}
          className="ls-3d hidden lg:block absolute bottom-[-18px] right-full mr-1 w-[340px] h-[430px] pointer-events-none select-none [mask-image:linear-gradient(to_right,transparent,black_18%)]"
        />
      )}
      <div className="ls-card relative">{children}</div>
    </div>
  );
}
