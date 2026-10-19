"use client";

import { Toaster } from "react-hot-toast";

/** Global toast container (mounted once in the root layout). */
export function Toasts() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerStyle={{ top: 76 }}
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: "14px",
          background: "#0B0C0F",
          color: "#fff",
          fontSize: "13px",
          fontWeight: 600,
          padding: "10px 14px",
          boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
        },
        success: { iconTheme: { primary: "#10B981", secondary: "#0B0C0F" } },
        error: { duration: 5000, iconTheme: { primary: "#F43F5E", secondary: "#0B0C0F" } },
      }}
    />
  );
}
