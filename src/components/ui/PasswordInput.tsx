"use client";

import { useEffect, useState, type InputHTMLAttributes } from "react";
import { createPortal } from "react-dom";
import { Eye, EyeOff } from "lucide-react";

/**
 * A password field with an eye button to show or hide what was typed.
 * Showing it dims the page and shines a gold "flashlight" beam from the eye across the password.
 */
export function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  // While the light is on, <main> is lifted over the navbar so the dark layer covers the whole page
  // and the field can sit above it. Esc turns the light off again.
  useEffect(() => {
    if (!show) return;
    document.documentElement.classList.add("pw-lit");
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setShow(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.classList.remove("pw-lit");
      window.removeEventListener("keydown", onKey);
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
      <span aria-hidden className={`pw-beam ${show ? "pw-beam-on" : ""}`} />
      <button
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
