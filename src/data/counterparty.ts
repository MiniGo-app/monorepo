import { shortAddress } from "@/wallet/stellar";
import type { Counterparty, Transaction } from "./transactions";

export function counterpartyName(counterparty: Counterparty, compact = true) {
  if (counterparty.kind === "app") return counterparty.name;
  return compact ? shortAddress(counterparty.value, 4, 4) : shortAddress(counterparty.value, 6, 6);
}

export const txVerb: Record<Transaction["kind"], string> = {
  sent: "Sent",
  received: "Received",
  miniapp: "Mini app payment",
};
