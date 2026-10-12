import type { MiniApp } from "@/data/miniApps";

// A catalogue app or any URL opened from the developer screen.
export type HostedApp = {
  // The catalogue id, or `web:<origin>` for URL apps.
  id: string;
  name: string;
  developer: string;
  catalog?: MiniApp;
  // URL apps only. Wallet requests are only accepted from this origin.
  origin?: string;
  source: { html: string } | { uri: string };
};

export function originOf(url: string) {
  const match = /^(https?:\/\/[^/?#]+)/i.exec(url.trim());
  return match ? match[1].toLowerCase() : null;
}
