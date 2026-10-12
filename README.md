# MiniGo

MiniGo is a Stellar testnet wallet with mini apps. This repository contains the mobile app, landing page and wallet SDK for the hackathon submission.

## Projects

| Path | Purpose |
| --- | --- |
| `apps/mobile` | Expo wallet for Android and iOS |
| `apps/landing` | Public landing page |
| `packages/wallet-sdk` | Mini app provider, Wallets Kit module and extension |

## Run locally

Use Node 22 or newer. From this folder:

```bash
npm install
npm run build:sdk
npm run dev:mobile
```

In another terminal, run `npm run dev:landing` for the landing page. Run `npm run check` for the workspace checks. Each project folder has its own README.
