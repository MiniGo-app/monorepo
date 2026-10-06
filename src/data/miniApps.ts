import {
  ArrowLeftRight,
  Coins,
  HandHeart,
  HeartPulse,
  Landmark,
  Percent,
  PiggyBank,
  TrainFront,
  TrendingUp,
  type LucideIcon,
} from "lucide-react-native";
import type { ImageSourcePropType } from "react-native";

export type MiniAppCategory = "Finance" | "Social" | "Rewards";

export type MiniApp = {
  id: string;
  name: string;
  shortName: string;
  detail: string;
  category: MiniAppCategory;
  developer: string;
  // Shown when there is no image or logo.
  icon: LucideIcon;
  // Partner artwork with padding around its own squircle; scaled up to crop it.
  image?: ImageSourcePropType;
  // The site's own icon, saved from it and already sized to fill the frame.
  logo?: ImageSourcePropType;
  // Live site to load. Without one the app runs a bundled demo page.
  url?: string;
  // For sites that switch to a WalletConnect-only connect flow on phones (judged by user agent and touch), which
  // MiniGo can't answer: present a desktop browser so the site uses the injected Freighter instead.
  desktopMode?: boolean;
};

export const miniApps: MiniApp[] = [
  {
    id: "healthconnect",
    name: "HealthConnect",
    shortName: "Health",
    detail: "Doctors and medicine, on demand",
    category: "Social",
    developer: "HealthConnect",
    icon: HeartPulse,
    image: require("../../assets/partners/healthconnect.png"),
  },
  {
    id: "lagos-transport",
    name: "Lagos Transport",
    shortName: "Transport",
    detail: "Bus and rail top-ups",
    category: "Rewards",
    developer: "Lagos Transport",
    icon: TrainFront,
    image: require("../../assets/partners/lagos-transport.png"),
  },
  // Live Stellar apps, loaded from their own sites. Each connects through the Freighter-compatible provider.
  {
    id: "blend",
    name: "Blend",
    shortName: "Blend",
    detail: "Lend and borrow on Stellar",
    category: "Finance",
    developer: "Blend Capital",
    icon: Landmark,
    logo: require("../../assets/partners/blend.png"),
    url: "https://mainnet.blend.capital",
  },
  {
    id: "aquarius",
    name: "Aquarius",
    shortName: "Aquarius",
    detail: "Swap and earn from liquidity",
    category: "Finance",
    developer: "Aquarius",
    icon: ArrowLeftRight,
    logo: require("../../assets/partners/aquarius.png"),
    url: "https://aqua.network",
  },
  {
    id: "soroswap",
    name: "Soroswap",
    shortName: "Soroswap",
    detail: "Swap tokens at the best price",
    category: "Finance",
    developer: "Soroswap Finance",
    icon: ArrowLeftRight,
    logo: require("../../assets/partners/soroswap.png"),
    url: "https://app.soroswap.finance",
  },
  {
    id: "defindex",
    name: "DeFindex",
    shortName: "DeFindex",
    detail: "Yield vaults for your savings",
    category: "Finance",
    developer: "PaltaLabs",
    icon: PiggyBank,
    logo: require("../../assets/partners/defindex.png"),
    url: "https://app.defindex.io",
  },
  {
    id: "stellar-defi-hub",
    name: "Stellar DeFi Hub",
    shortName: "DeFi Hub",
    detail: "Farm rewards across Stellar DeFi",
    category: "Finance",
    developer: "Stellar DeFi Hub",
    icon: TrendingUp,
    logo: require("../../assets/partners/stellar-defi-hub.png"),
    url: "https://stellardefihub.com",
  },
  {
    id: "upshift",
    name: "Upshift",
    shortName: "Upshift",
    detail: "Managed yield vaults",
    category: "Finance",
    developer: "Upshift",
    icon: TrendingUp,
    logo: require("../../assets/partners/upshift.png"),
    url: "https://app.upshift.finance",
  },
  {
    id: "templar",
    name: "Templar",
    shortName: "Templar",
    detail: "Borrow against your crypto",
    category: "Finance",
    developer: "Templar Protocol",
    icon: Landmark,
    logo: require("../../assets/partners/templar.png"),
    url: "https://app.templarfi.org",
  },
  {
    id: "phoenix",
    name: "Phoenix",
    shortName: "Phoenix",
    detail: "Swap and provide liquidity",
    category: "Finance",
    developer: "Phoenix",
    icon: ArrowLeftRight,
    logo: require("../../assets/partners/phoenix.png"),
    url: "https://app.phoenix-hub.io",
  },
  {
    id: "fxdao",
    name: "FxDAO",
    shortName: "FxDAO",
    detail: "Mint stablecoins against XLM",
    category: "Finance",
    developer: "FxDAO",
    icon: Coins,
    logo: require("../../assets/partners/fxdao.png"),
    url: "https://app.fxdao.io",
  },
  {
    id: "huma",
    name: "Huma",
    shortName: "Huma",
    detail: "Yield from real-world payments",
    category: "Finance",
    developer: "Huma Finance",
    icon: Percent,
    logo: require("../../assets/partners/huma.png"),
    url: "https://app.huma.finance",
  },
  {
    id: "spectra",
    name: "Spectra",
    shortName: "Spectra",
    detail: "Lock in a fixed yield",
    category: "Finance",
    developer: "Spectra",
    icon: Percent,
    logo: require("../../assets/partners/spectra.png"),
    url: "https://app.spectra.finance",
  },
  {
    id: "alula",
    name: "Alula",
    shortName: "Alula",
    detail: "Lend and borrow",
    category: "Finance",
    developer: "Alula",
    icon: Landmark,
    logo: require("../../assets/partners/alula.png"),
    url: "https://app.alula.finance",
  },
  {
    id: "vaquita",
    name: "Vaquita",
    shortName: "Vaquita",
    detail: "Savings goals that earn",
    category: "Finance",
    developer: "Vaquita",
    icon: PiggyBank,
    logo: require("../../assets/partners/vaquita.png"),
    url: "https://app.vaquita.fi",
  },
  {
    id: "fundable",
    name: "Fundable",
    shortName: "Fundable",
    detail: "Payouts, payroll and payment streams",
    category: "Finance",
    developer: "Fundable",
    icon: Coins,
    logo: require("../../assets/partners/fundable.png"),
    url: "https://stellar.fundable.finance",
    desktopMode: true,
  },
  {
    id: "the-give-hub",
    name: "The Give Hub",
    shortName: "Give Hub",
    detail: "Donate to verified causes",
    category: "Social",
    developer: "The Give Hub",
    icon: HandHeart,
    logo: require("../../assets/partners/the-give-hub.png"),
    url: "https://app.thegivehub.com",
  },
];

export const featuredAppId = "healthconnect";
export const recentAppIds = ["healthconnect", "lagos-transport", "soroswap", "blend"];

export function getMiniApp(id: string | undefined) {
  return miniApps.find((app) => app.id === id);
}

export function getMiniApps(ids: string[]) {
  return ids.map(getMiniApp).filter((app): app is MiniApp => Boolean(app));
}
