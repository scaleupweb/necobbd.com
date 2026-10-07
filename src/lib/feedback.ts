"use client";

// Shared UI feedback: toast notifications (react-hot-toast) and confirm /
// prompt dialogs (SweetAlert2) styled to match the site. Replaces the
// browser's native alert(), confirm() and prompt().
import toast from "react-hot-toast";
import Swal from "sweetalert2";

export { toast };

const base = {
  buttonsStyling: false,
  reverseButtons: true,
  focusCancel: true,
  customClass: {
    popup: "!rounded-3xl !p-6 !font-sans",
    title: "!text-lg !font-black !text-slate-950",
    htmlContainer: "!text-sm !text-slate-600",
    actions: "!gap-2 !mt-5",
    confirmButton: "px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-black hover:bg-zinc-800",
    cancelButton: "px-5 py-2.5 rounded-xl text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200",
    input: "!rounded-xl !text-sm !border-slate-200 !shadow-none focus:!border-black",
  },
};

/** Ask the user to confirm an action. Resolves true when confirmed. */
export async function confirmDialog(opts: { title: string; text?: string; confirmText?: string; cancelText?: string; danger?: boolean }) {
  const res = await Swal.fire({
    ...base,
    icon: opts.danger ? "warning" : "question",
    iconColor: opts.danger ? "#E11D48" : "#111111",
    title: opts.title,
    text: opts.text,
    showCancelButton: true,
    confirmButtonText: opts.confirmText || "Confirm",
    cancelButtonText: opts.cancelText || "Cancel",
    customClass: {
      ...base.customClass,
      confirmButton: opts.danger
        ? "px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-700"
        : base.customClass.confirmButton,
    },
  });
  return res.isConfirmed;
}

/** Ask for a single value. Resolves the text, or null when cancelled. */
export async function promptDialog(opts: { title: string; text?: string; value?: string; placeholder?: string; inputType?: "text" | "number"; confirmText?: string }) {
  const res = await Swal.fire({
    ...base,
    title: opts.title,
    text: opts.text,
    input: opts.inputType || "text",
    inputValue: opts.value ?? "",
    inputPlaceholder: opts.placeholder,
    showCancelButton: true,
    confirmButtonText: opts.confirmText || "Save",
    inputValidator: (v: string) => (!String(v).trim() ? "Please enter a value" : undefined),
  });
  return res.isConfirmed ? String(res.value) : null;
}

const FB_LINK = /^https?:\/\/([a-z0-9-]+\.)*(facebook\.com|fb\.com|fb\.watch|fb\.me)\//i;

/** Ask a club for its Facebook registration post before applying. Resolves the link, or null when cancelled. */
export async function postLinkDialog(opts: { title: string; text?: string; confirmText?: string }) {
  const res = await Swal.fire({
    ...base,
    title: opts.title,
    text: opts.text,
    input: "url",
    inputPlaceholder: "https://facebook.com/…",
    showCancelButton: true,
    confirmButtonText: opts.confirmText || "Submit registration",
    inputValidator: (v: string) => (FB_LINK.test(String(v).trim()) ? undefined : "Paste the Facebook post link (facebook.com/…)"),
  });
  return res.isConfirmed ? String(res.value).trim() : null;
}

/** Show a message that needs acknowledging (e.g. a one-time password). */
export async function infoDialog(opts: { title: string; text?: string; html?: string; icon?: "success" | "info" | "warning" | "error" }) {
  await Swal.fire({ ...base, icon: opts.icon || "info", iconColor: opts.icon === "success" ? "#10B981" : undefined, title: opts.title, text: opts.text, html: opts.html, confirmButtonText: "OK" });
}
