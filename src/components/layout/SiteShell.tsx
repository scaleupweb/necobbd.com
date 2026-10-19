"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Public site chrome (navbar, footer, mobile nav). The admin panel renders without it. */
export function SiteShell({
  navbar,
  footer,
  bottomNav,
  announcement,
  children,
}: {
  navbar: ReactNode;
  footer: ReactNode;
  bottomNav: ReactNode;
  announcement: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) {
    return <main className="flex-1 relative">{children}</main>;
  }

  return (
    <>
      {navbar}
      <main className="flex-1 relative z-10 pt-16 pb-20 md:pb-0">
        {announcement}
        {children}
      </main>
      {footer}
      {bottomNav}
    </>
  );
}
