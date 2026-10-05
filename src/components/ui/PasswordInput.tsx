"use client";

import { useEffect, useRef, useState, type InputHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";

/**
 * A password field with an eye button to show or hide what was typed.
 * Showing it dims the page and shines a gold "flashlight" beam from the eye across the password;
 * the beam swings a little toward the mouse.
 */
export function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  const beam = useRef<HTMLSpanElement>(null);
  const eye = useRef<HTMLButtonElement>(null);
  useEffect(() => setMounted(true), []);

  // While the light is on, <main> is lifted over the navbar so the dark layer covers the whole page
  // and the field can sit above it. Esc turns the light off again.
  useEffect(() => {
    if (!show) return;
    document.documentElement.classList.add("pw-lit");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShow(false);
    // Tilt the beam toward the pointer: up when it's above the eye, down when below (max ±6°, so the password stays lit).
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const r = eye.current?.getBoundingClientRect();
        if (!r || !beam.current) return;
        const dx = r.left + r.width / 2 - e.clientX;
        const dy = r.top + r.height / 2 - e.clientY;
        const deg = (Math.atan2(dy, Math.max(Math.abs(dx), 120)) * 180) / Math.PI;
        beam.current.style.setProperty("--pw-tilt", `${Math.max(-6, Math.min(6, deg * 0.3)).toFixed(2)}deg`);
      });
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointermove", onMove);
    return () => {
      document.documentElement.classList.remove("pw-lit");
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointermove", onMove);
      cancelAnimationFrame(frame);
      beam.current?.style.setProperty("--pw-tilt", "0deg");
    };
  }, [show]);

  return (
    <div className="relative" style={show ? { zIndex: 61 } : undefined}>
      {mounted && createPortal(<div aria-hidden className={`pw-dark ${show ? "pw-dark-on" : ""}`} />, document.querySelector("main") || document.body)}
      <input
        {...props}
        type={show ? "text" : "password"}
        className={`${className} pr-11 transition-colors duration-300 ${show ? "pw-input-lit" : ""}`}
      />
      <span ref={beam} aria-hidden className={`pw-beam ${show ? "pw-beam-on" : ""}`} />
      <button
        ref={eye}
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        title={show ? "Hide password" : "Show password"}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          show ? "text-[#f5d27a] bg-[#c79a3b]/20 pw-eye-on" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
        }`}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
