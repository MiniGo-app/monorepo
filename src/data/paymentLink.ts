import { cleanAmount, parsePayLink } from "./paymentLinkCore";
import { parseRecipient, type Recipient } from "./recipient";

export type ScannedPayment = { recipient: Recipient; amount?: string; asset?: string; memo?: string };
export type ScanResult = { ok: true; payment: ScannedPayment } | { ok: false; reason: string };

const NOT_A_CODE = "That QR code isn't a Stellar address or payment code.";

// Reads what a payment QR code can carry: a Stellar address or a SEP-0007 `web+stellar:pay` link.
// `asset` comes back as "XLM" or "CODE:ISSUER".
export function parsePaymentCode(raw: string): ScanResult {
  const link = parsePayLink(raw);
  if (link) {
    if (!link.ok) return link;
    const recipient = parseRecipient(link.fields.destination);
    if (recipient?.kind !== "address") return { ok: false, reason: "This payment code's address has a typo." };
    const amount = link.fields.amount ? (cleanAmount(link.fields.amount) ?? undefined) : undefined;
    return { ok: true, payment: { recipient, amount, asset: link.fields.asset, memo: link.fields.memo } };
  }
  const recipient = parseRecipient(raw.trim());
  return recipient?.kind === "address" ? { ok: true, payment: { recipient } } : { ok: false, reason: NOT_A_CODE };
}
