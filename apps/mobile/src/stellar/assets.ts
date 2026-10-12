import { Asset } from "@stellar/stellar-base";
import { USDC_ISSUER } from "@minigo/wallet-sdk/core/assets.ts";
import type { AccountState } from "@minigo/wallet-sdk/core/horizon.ts";
import { NETWORK } from "./network";

// XLM always, plus every trustline.

export type WalletAsset = {
  // "XLM" or "CODE:ISSUER", used in routes.
  key: string;
  code: string;
  issuer?: string;
  name: string;
  detail: string;
  balance: number;
  isNative: boolean;
};

export const USDC = new Asset("USDC", USDC_ISSUER[NETWORK.network]);

export const keyOf = (asset: Asset) => (asset.isNative() ? "XLM" : `${asset.getCode()}:${asset.getIssuer()}`);

export function assetFromKey(key: string): Asset | null {
  if (key === "XLM") return Asset.native();
  const [code, issuer] = key.split(":");
  try {
    return code && issuer ? new Asset(code, issuer) : null;
  } catch {
    return null;
  }
}

const short = (issuer: string) => `${issuer.slice(0, 4)}…${issuer.slice(-4)}`;

export function describeAsset(asset: Asset): Pick<WalletAsset, "name" | "detail"> {
  if (asset.isNative()) return { name: "XLM", detail: "Stellar Lumens" };
  if (asset.equals(USDC)) return { name: "USDC", detail: "USD Coin · Circle" };
  return { name: asset.getCode(), detail: `Issued by ${short(asset.getIssuer())}` };
}

export function walletAssets(account: AccountState | null): WalletAsset[] {
  const balances = account?.exists ? account.balances : [{ asset: Asset.native(), balance: "0" }];
  return balances
    .map(({ asset, balance }) => ({
      key: keyOf(asset),
      code: asset.isNative() ? "XLM" : asset.getCode(),
      issuer: asset.isNative() ? undefined : asset.getIssuer(),
      ...describeAsset(asset),
      balance: Number(balance),
      isNative: asset.isNative(),
    }))
    .sort((a, b) => (a.isNative ? -1 : b.isNative ? 1 : a.code === "USDC" ? -1 : b.code === "USDC" ? 1 : a.code.localeCompare(b.code)));
}

const number = (value: number, max = 7) =>
  value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: Math.max(2, max) });

// "1,250.50 XLM": up to 7 decimals, trailing zeros past 2 trimmed.
export function formatAmount(code: string, amount: number) {
  return `${number(amount, 7)} ${code}`;
}

export function formatUsd(amount: number) {
  return `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// USDC at par, XLM at the market price.
export function usdValue(asset: Pick<WalletAsset, "isNative" | "code" | "issuer" | "balance">, xlmPrice: number | null) {
  if (asset.isNative) return xlmPrice === null ? null : asset.balance * xlmPrice;
  if (asset.code === "USDC" && asset.issuer === USDC.getIssuer()) return asset.balance;
  return null;
}
