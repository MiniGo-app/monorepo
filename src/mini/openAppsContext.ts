import { createContext, useContext } from "react";
import type { HostedApp } from "./types";

// Separate from OpenApps.tsx so the host can use it without importing the provider that renders it.
export type OpenAppsValue = {
  apps: HostedApp[];
  activeId: string | null;
  waiting: Record<string, number>;
  launch: (app: HostedApp) => void;
  switchTo: (id: string) => void;
  minimize: () => void;
  close: (id: string) => void;
  openSwitcher: () => void;
  setWaiting: (id: string, count: number) => void;
};

export const OpenAppsContext = createContext<OpenAppsValue | null>(null);

export function useOpenApps() {
  const value = useContext(OpenAppsContext);
  if (!value) throw new Error("useOpenApps must be used inside OpenAppsProvider");
  return value;
}
