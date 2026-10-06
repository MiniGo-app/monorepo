import type { MiniApp } from "@/data/miniApps";
import type { Palette } from "@/theme/colors";
import { buildMiniAppPage } from "./demoPage";
import { originOf, type HostedApp } from "./types";

// A catalogue app: its live site when it has one, held to that origin like any URL app; otherwise its bundled page.
export function catalogHostedApp(app: MiniApp, colors: Palette): HostedApp {
  const base = { id: app.id, name: app.name, developer: app.developer, catalog: app };
  const origin = app.url ? originOf(app.url) : null;
  // Live partner sites only over HTTPS: on plain HTTP anyone on the network could replace the page that asks the
  // wallet to sign.
  if (app.url && origin?.startsWith("https://")) return { ...base, origin, source: { uri: app.url } };
  return { ...base, source: { html: buildMiniAppPage(app, colors) } };
}

// Any http(s) URL opened as a mini app: a local dev server or a live site.
export function webHostedApp(url: string, name?: string): HostedApp | null {
  const origin = originOf(url);
  if (!origin) return null;
  const host = origin.replace(/^https?:\/\//, "");
  return { id: `web:${origin}`, name: name || host, developer: host, origin, source: { uri: url.trim() } };
}
