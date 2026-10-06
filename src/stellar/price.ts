import { useEffect, useState } from "react";

// XLM's market price for showing balances in dollars. Testnet XLM has no value; this is for display only.
let cached: { price: number; at: number } | null = null;
const TTL = 5 * 60 * 1000;

async function fetchPrice() {
  if (cached && Date.now() - cached.at < TTL) return cached.price;
  const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=stellar&vs_currencies=usd");
  const body = (await response.json()) as { stellar?: { usd?: number } };
  if (typeof body.stellar?.usd !== "number") throw new Error("No price");
  cached = { price: body.stellar.usd, at: Date.now() };
  return cached.price;
}

const RETRY_MS = 20 * 1000;

export function useXlmPrice() {
  const [price, setPrice] = useState<number | null>(cached?.price ?? null);
  useEffect(() => {
    let alive = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const load = () =>
      fetchPrice().then(
        (p) => alive && setPrice(p),
        // Try again later; the balance shows "—" until then.
        () => {
          if (alive) timer = setTimeout(load, RETRY_MS);
        },
      );
    load();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, []);
  return price;
}
