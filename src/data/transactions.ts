// A payment in or out of the wallet, as the app shows it. Built from Horizon (stellar/history.ts).

export type TxKind = "sent" | "received" | "miniapp";

export type Counterparty = { kind: "address"; value: string } | { kind: "app"; value: string; name: string };

export type Transaction = {
  id: string;
  kind: TxKind;
  asset: { code: string; issuer?: string };
  amount: number;
  // In XLM, when this wallet paid it.
  fee: number;
  counterparty: Counterparty;
  date: string;
  memo?: string;
  hash: string;
  createdAccount?: boolean;
};

const DAY = 24 * 60 * 60 * 1000;

export const isOutgoing = (tx: Transaction) => tx.kind === "sent" || tx.kind === "miniapp";

export function dayLabel(iso: string) {
  const date = new Date(iso);
  const today = new Date();
  const start = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diff = Math.round((start(today) - start(date)) / DAY);
  if (diff === 0) return "Today";
  if (diff === 1) return "Yesterday";
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: date.getFullYear() === today.getFullYear() ? undefined : "numeric" });
}

export function timeLabel(iso: string) {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

export function fullDateLabel(iso: string) {
  return new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}
