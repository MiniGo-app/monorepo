// SEP-0007 `web+stellar:pay` links, as far as MiniGo can honour them. Pure (no app imports) so it can be tested in
// plain Node (test/paymentLink.test.ts). paymentLink.ts adds the address check.
//
// A payment code is someone telling the wallet what to send. Anything MiniGo can't send exactly as asked is refused
// with a reason, never quietly changed: a USDC request must not become an XLM payment, and an exchange deposit
// that needs a numeric memo must not go out with a text one (the exchange couldn't credit it).

export type PaymentFields = { destination: string; amount?: string; asset: string; memo?: string };
export type PayLink = { ok: true; fields: PaymentFields } | { ok: false; reason: string };

const PREFIX = "web+stellar:pay?";
const ACCOUNT = /^G[A-Z2-7]{55}$/;
const AMOUNT = /^\d+(\.\d{1,7})?$/;
const CODE = /^[A-Za-z0-9]{1,12}$/;

function query(text: string): Record<string, string> | null {
  const params: Record<string, string> = {};
  try {
    for (const pair of text.split("&")) {
      const [key, value = ""] = pair.split("=");
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, " "));
    }
  } catch {
    return null; // malformed %-escapes
  }
  return params;
}

/** Null when `raw` isn't a pay link at all (it may still be a plain address). */
export function parsePayLink(raw: string): PayLink | null {
  const text = raw.trim();
  if (!text.toLowerCase().startsWith(PREFIX)) return null;
  const params = query(text.slice(PREFIX.length));
  if (!params) return { ok: false, reason: "This payment code is damaged. Ask for a new one." };

  const destination = (params.destination ?? "").trim().toUpperCase();
  if (!ACCOUNT.test(destination)) return { ok: false, reason: "This payment code doesn't say who to pay." };

  let amount: string | undefined;
  if (params.amount !== undefined && params.amount !== "") {
    if (!AMOUNT.test(params.amount) || !(Number(params.amount) > 0)) return { ok: false, reason: "The amount in this payment code isn't valid." };
    amount = params.amount;
  }

  let asset = "XLM";
  const code = params.asset_code?.trim();
  if (code) {
    if (!CODE.test(code)) return { ok: false, reason: "The asset in this payment code isn't valid." };
    const issuer = params.asset_issuer?.trim().toUpperCase();
    if (issuer) {
      if (!ACCOUNT.test(issuer)) return { ok: false, reason: `This payment code names an invalid issuer for ${code}.` };
      asset = `${code}:${issuer}`;
    } else if (code.toUpperCase() !== "XLM") {
      // Anyone can issue a token with any code, so a code alone doesn't say which asset is meant.
      return { ok: false, reason: `This payment code asks for ${code} but doesn't say who issued it.` };
    }
  }

  const memoType = (params.memo_type ?? "MEMO_TEXT").trim().toUpperCase();
  let memo: string | undefined;
  if (params.memo !== undefined && params.memo !== "") {
    if (memoType !== "MEMO_TEXT") {
      return { ok: false, reason: "This payment code needs a kind of memo MiniGo can't send yet. Sending without it could lose the payment." };
    }
    if (new TextEncoder().encode(params.memo).length > 28) return { ok: false, reason: "The memo in this payment code is too long." };
    memo = params.memo;
  }

  return { ok: true, fields: { destination, amount, asset, memo } };
}

/** "0012.500" → "12.5". Plain decimal text for amounts, never "1e-7". Null if it isn't an amount. */
export function cleanAmount(text: string): string | null {
  const match = /^0*(\d*)(?:\.(\d*))?$/.exec(text.trim());
  if (!match || text.trim() === "" || text.trim() === ".") return null;
  const whole = match[1] || "0";
  const fraction = (match[2] ?? "").slice(0, 7).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole;
}

/** Whole stroops (0.0000001). Balances, reserves and fees are all whole stroops; anything finer is float noise. */
export const toStroops = (value: number) => Math.round(value * 1e7);

/**
 * A balance as plain decimal text (for "Max"). Not Math.floor: 0.3 * 1e7 is 2999999.9999999995 in floating point,
 * and flooring that would offer 0.2999999.
 */
export function floorAmount(value: number): string {
  const stroops = toStroops(value);
  if (!(stroops > 0)) return "0";
  return cleanAmount((stroops / 1e7).toFixed(7)) ?? "0";
}
