import { formatAmount } from "@/stellar/assets";
import type { Transaction } from "./transactions";

// Notifications come from real account activity: money in, and payments mini apps asked for.

export type NotificationKind = "payment" | "miniapp";

export type AppNotification = { id: string; kind: NotificationKind; title: string; body: string; date: string; txId: string };

const short = (address: string) => `${address.slice(0, 4)}…${address.slice(-4)}`;

export function notificationsFrom(history: Transaction[]): AppNotification[] {
  return history
    .filter((tx) => tx.kind === "received" || tx.kind === "miniapp")
    .slice(0, 30)
    .map((tx) =>
      tx.kind === "received"
        ? {
            id: tx.id,
            kind: "payment" as const,
            title: `You received ${formatAmount(tx.asset.code, tx.amount)}`,
            body: `From ${tx.counterparty.kind === "address" ? short(tx.counterparty.value) : tx.counterparty.name}${tx.memo ? ` · ${tx.memo}` : ""}`,
            date: tx.date,
            txId: tx.id,
          }
        : {
            id: tx.id,
            kind: "miniapp" as const,
            title: `${tx.counterparty.kind === "app" ? tx.counterparty.name : "Mini app"} payment`,
            body: `${formatAmount(tx.asset.code, tx.amount)}${tx.memo ? ` · ${tx.memo}` : ""}`,
            date: tx.date,
            txId: tx.id,
          },
    );
}
