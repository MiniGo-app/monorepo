import type { MiniApp } from "@/data/miniApps";

// A mini app as the host runs it: one from the catalogue (served from a bundled page for now) or any
// URL opened from the developer screen.
export type HostedApp = {
  // Catalogue id, or `web:<origin>` for URL apps.
  id: string;
  name: string;
  developer: string;
  catalog?: MiniApp;
  // Set for URL apps; wallet requests are only accepted from this origin.
  origin?: string;
  source: { html: string } | { uri: string };
};

export function originOf(url: string) {
  const match = /^(https?:\/\/[^/?#]+)/i.exec(url.trim());
  return match ? match[1].toLowerCase() : null;
}
