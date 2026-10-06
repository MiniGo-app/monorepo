// The apps on the roll. The first six are the catalogue in the MiniGo app (minigo/src/data/miniApps.ts), with the
// app's own one-line descriptions. Swap and Tickets are examples of what could sit beside them. "Your app" is the
// seat left for whoever builds the next one.
const PAPER = "#EFEBE2";
const DARK = "#141414";

const disc = (fill: string, glyph: string) =>
  `<svg class="ico" viewBox="-30 -30 60 60" aria-hidden="true"><circle r="30" fill="${fill}"/>${glyph}</svg>`;
const line = (d: string, width = 3) =>
  `<path d="${d}" fill="none" stroke="${PAPER}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

export interface MiniApp {
  name: string;
  detail: string;
  /** Raw, trusted SVG markup for the row icon. */
  icon: string;
}

export const APPS: MiniApp[] = [
  {
    name: "Data Hub",
    detail: "Bundles for every network",
    icon: disc(DARK, `<rect x="-10" y="-16" width="20" height="32" rx="4" fill="none" stroke="${PAPER}" stroke-width="3"/><circle cx="0" cy="10" r="1.8" fill="${PAPER}"/>`),
  },
  {
    name: "GameBox",
    detail: "Play quick challenges",
    icon: disc(DARK, `<rect x="-15" y="-9" width="30" height="18" rx="9" fill="none" stroke="${PAPER}" stroke-width="3"/>${line("M-8 -3v6M-11 0h6", 2.4)}<circle cx="7" cy="-2" r="1.8" fill="${PAPER}"/><circle cx="11" cy="2" r="1.8" fill="${PAPER}"/>`),
  },
  {
    name: "HealthConnect",
    detail: "Doctors and medicine, on demand",
    icon: disc("#1B4DDB", `<path d="M-4 -14h8v10h10v8h-10v10h-8v-10h-10v-8h10z" fill="#fff"/>`),
  },
  {
    name: "Lagos Transport",
    detail: "Bus and rail top-ups",
    icon: disc("#0F2F8F", `<path d="M-14 12C-4 12 -4 -4 4 -4S14 -14 14 -14" fill="none" stroke="#FF8A1F" stroke-width="4" stroke-linecap="round"/><circle cx="-14" cy="12" r="4" fill="#FF8A1F"/><circle cx="14" cy="-14" r="4" fill="#fff"/>`),
  },
  {
    name: "Market Run",
    detail: "Local deals near you",
    icon: disc(DARK, `${line("M-12 -6h24l-2 20h-20z")}${line("M-6 -6v-4a6 6 0 0 1 12 0v4")}`),
  },
  {
    name: "PowerUp",
    detail: "Electricity in seconds",
    icon: disc(DARK, `${line("M-9 -8A13 13 0 1 0 9 -8", 3.2)}${line("M0 -16v13", 3.2)}`),
  },
  {
    name: "Swap",
    detail: "Trade one token for another",
    icon: disc(DARK, `${line("M-12 -6h22M4 -13l7 7-7 7")}${line("M12 8h-22M-4 1l-7 7 7 7")}`),
  },
  {
    name: "Tickets",
    detail: "Events and shows, in USDC",
    icon: disc(DARK, `<path d="M-14 -9H14V-4A4 4 0 0 0 14 4V9H-14V4A4 4 0 0 0 -14 -4Z" fill="none" stroke="${PAPER}" stroke-width="3" stroke-linejoin="round"/>${line("M-4 -5v10", 2.4)}`),
  },
  {
    name: "Your app",
    detail: "[what it does]",
    icon: `<svg class="ico" viewBox="-30 -30 60 60" aria-hidden="true"><circle r="28" fill="none" stroke="${DARK}" stroke-width="2.4" stroke-dasharray="5 5"/><path d="M0 -10v20M-10 0h20" stroke="${DARK}" stroke-width="3" stroke-linecap="round"/></svg>`,
  },
];
