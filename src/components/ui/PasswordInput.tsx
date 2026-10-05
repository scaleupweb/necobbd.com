"use client";

import { useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

/**
 * A password field with an eye button to show or hide what was typed.
 * Showing it switches on a gold "flashlight" beam that shines from the eye across the password.
 */
export function PasswordInput({ className = "", ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input {...props} type={show ? "text" : "password"} className={`${className} pr-11 transition-colors ${show ? "!text-slate-950 font-semibold" : ""}`} />
      <span aria-hidden className={`pw-beam ${show ? "pw-beam-on" : ""}`} />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        aria-label={show ? "Hide password" : "Show password"}
        aria-pressed={show}
        title={show ? "Hide password" : "Show password"}
        className={`absolute right-1.5 top-1/2 -translate-y-1/2 z-20 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
          show ? "text-[#a47a22] bg-[#c79a3b]/15 pw-eye-on" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100"
        }`}
      >
        {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
      </button>
    </div>
  );
}
