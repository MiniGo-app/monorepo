import { TESTNET } from "@minigo/wallet-sdk/core/network.ts";

// MiniGo runs on Stellar testnet for now. Everything network-specific reads from here.
export const NETWORK = TESTNET;
export const isTestnet = NETWORK.network === "TESTNET";

export const explorerTxUrl = (hash: string) => `${NETWORK.explorerUrl}/tx/${hash}`;
export const explorerAccountUrl = (address: string) => `${NETWORK.explorerUrl}/account/${address}`;
export const CIRCLE_FAUCET_URL = "https://faucet.circle.com";
