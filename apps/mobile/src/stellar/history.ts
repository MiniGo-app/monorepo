import type { Transaction } from "@/data/transactions";
import { NETWORK } from "./network";

// Payments in and out, newest first, with each transaction joined in for the memo and fee. Mini app payments are
// labelled at render time by `labelAppPayments`.

export type AppNote = { appId: string; appName: string };

type Record = {
  id: string;
  type: string;
  created_at: string;
  transaction_hash: string;
  transaction_successful?: boolean;
  from?: string;
  to?: string;
  funder?: string;
  account?: string;
  starting_balance?: string;
  amount?: string;
  asset_type?: string;
  asset_code?: string;
  asset_issuer?: string;
  source_amount?: string;
  source_asset_type?: string;
  source_asset_code?: string;
  source_asset_issuer?: string;
  transaction?: { memo?: string; memo_type?: string; fee_charged?: string; source_account?: string };
};

const assetOf = (type?: string, code?: string, issuer?: string) => (type === "native" || !type ? { code: "XLM" } : { code: code ?? "?", issuer });

async function fetchWithRetry(url: string) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fetch(url);
    } catch (error) {
      // Brief network drops are common on phones.
      if (attempt >= 2) throw error;
      await new Promise((resolve) => setTimeout(resolve, 400 * 3 ** attempt));
    }
  }
}

export async function fetchHistory(address: string, limit = 50): Promise<Transaction[]> {
  const response = await fetchWithRetry(`${NETWORK.networkUrl}/accounts/${address}/payments?order=desc&limit=${limit}&join=transactions`);
  if (response.status === 404) return [];
  if (!response.ok) throw new Error("Couldn't load history");
  const records = ((await response.json()) as { _embedded: { records: Record[] } })._embedded.records;

  const out: Transaction[] = [];
  for (const r of records) {
    if (r.transaction_successful === false) continue;
    let incoming: boolean;
    let other: string | undefined;
    let amount: string | undefined;
    let asset: Transaction["asset"];
    if (r.type === "create_account") {
      incoming = r.account === address;
      other = incoming ? r.funder : r.account;
      amount = r.starting_balance;
      asset = { code: "XLM" };
    } else if (r.type === "payment") {
      incoming = r.to === address;
      other = incoming ? r.from : r.to;
      amount = r.amount;
      asset = assetOf(r.asset_type, r.asset_code, r.asset_issuer);
    } else if (r.type === "path_payment_strict_send" || r.type === "path_payment_strict_receive") {
      incoming = r.to === address && r.from !== address;
      other = incoming ? r.from : r.to;
      amount = incoming ? r.amount : r.source_amount;
      asset = incoming ? assetOf(r.asset_type, r.asset_code, r.asset_issuer) : assetOf(r.source_asset_type, r.source_asset_code, r.source_asset_issuer);
    } else {
      continue;
    }
    if (!other || !amount) continue;
    const tx = r.transaction;
    out.push({
      id: r.id,
      kind: incoming ? "received" : "sent",
      asset,
      amount: Number(amount),
      fee: !incoming && tx?.fee_charged ? Number(tx.fee_charged) / 1e7 : 0,
      counterparty: { kind: "address", value: other },
      date: r.created_at,
      memo: tx?.memo_type === "text" || tx?.memo_type === "id" ? tx.memo : undefined,
      hash: r.transaction_hash,
      createdAccount: r.type === "create_account" && !incoming,
    });
  }
  return out;
}

export function labelAppPayments(history: Transaction[], notes: { [hash: string]: AppNote }): Transaction[] {
  return history.map((tx) => {
    const note = tx.kind === "sent" ? notes[tx.hash] : undefined;
    return note ? { ...tx, kind: "miniapp", counterparty: { kind: "app", value: note.appId, name: note.appName } } : tx;
  });
}
