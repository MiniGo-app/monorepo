import type { MiniApp } from "@/data/miniApps";
import type { Palette } from "@/theme/colors";
import { buildMiniAppPage } from "./demoPage";
import { originOf, type HostedApp } from "./types";

// A catalogue app runs its live site when it has one, otherwise its bundled page.
export function catalogHostedApp(app: MiniApp, colors: Palette): HostedApp {
  const base = { id: app.id, name: app.name, developer: app.developer, catalog: app };
  const origin = app.url ? originOf(app.url) : null;
  // Over plain HTTP anyone on the network could swap the page that asks the wallet to sign.
  if (app.url && origin?.startsWith("https://")) return { ...base, origin, source: { uri: app.url } };
  return { ...base, source: { html: buildMiniAppPage(app, colors) } };
}

export function webHostedApp(url: string, name?: string): HostedApp | null {
  const origin = originOf(url);
  if (!origin) return null;
  const host = origin.replace(/^https?:\/\//, "");
  return { id: `web:${origin}`, name: name || host, developer: host, origin, source: { uri: url.trim() } };
}
