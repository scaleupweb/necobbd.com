"use client";

import { createContext, useContext } from "react";

export type ClubHub = { club: any; reload: () => Promise<void> };

export const ClubHubContext = createContext<ClubHub | null>(null);

export function useClubHub() {
  const ctx = useContext(ClubHubContext);
  if (!ctx) throw new Error("useClubHub must be used inside the My Club layout");
  return ctx;
}
