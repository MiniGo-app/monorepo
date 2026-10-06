# MiniGo mobile

The MiniGo wallet as an Expo (React Native) app in the monochrome Ink design: sign-up with a cloud backup, a PIN-locked wallet on **Stellar testnet** holding XLM, USDC and any asset added by trustline, sending to Stellar addresses and mini apps that run in a WebView with the `window.mini` wallet from [`../minigo-wallet-sdk`](../minigo-wallet-sdk).

## Run it

```bash
npm install
npx expo start          # then scan the QR code with Expo Go
npx expo start --web    # browser preview
```

Everything used is in Expo Go (WebView, camera, SecureStore, biometrics, crypto), so no development build is needed yet.

Before committing: `npx expo lint` and `npx tsc --noEmit`.

## What's real and what's demo

Everything below runs against **Stellar testnet** (`src/stellar/network.ts`); switching networks is a one-line change there.

| Real | Not yet |
| --- | --- |
| 12-word recovery phrase (BIP-39) made on the phone; Stellar key derived from it (SEP-0005, checked against the SEP test vectors) | Mainnet |
| Balances and history from Horizon, refreshed every 15s and on pull-to-refresh | Sending to an email or phone number (the Send screen says "coming soon") |
| Payments signed on the phone and submitted to Stellar: XLM (creating the recipient's account if needed, min. 1 XLM), USDC, any trustline asset; memo up to 28 bytes | Payment links |
| Assets are trustlines: add USDC (Circle's testnet issuer) or any `CODE` + issuer, remove at zero balance; each reserves 0.5 XLM | Where the backup file goes: stored on the device until cloud sign-in is set up (below) |
| Test funds: Friendbot (10,000 XLM) from Home or Receive; a link to Circle's faucet for test USDC | Push notifications (the in-app list is built from real incoming and mini app payments) |
| Backup encrypted on the phone (scrypt + AES-256-GCM); phrase in a biometric-gated Keychain / Keystore item on devices that support it (PIN hash in the Keychain / Keystore); PIN lockout; auto-lock; biometrics | Mini app pages for the catalogue apps (stand-ins until partners host their own) |
| Mini apps: connect, `getNetwork`, payments, `signTransaction`, `signAuthEntry`, `signMessage` (SEP-53), each approved with the PIN; payments land on testnet | |

The dollar total on Home uses XLM's market price (CoinGecko) and counts USDC at $1. Testnet coins have no real value; the price is for display.

## Screens

- **Onboarding** (`src/app/onboarding/`): welcome → back up (Google Drive on Android, iCloud on iOS or write the phrase down and pass a 3-word check) → about you (name, email, optional phone) → create and confirm a PIN → optional biometrics. Restore works from the cloud backup with its password, or from a typed phrase.
- **Lock** (`src/app/lock.tsx`): PIN or biometrics; five wrong PINs lock input for 30s, doubling after that. *Forgot PIN* removes the wallet from the phone and goes to restore.
- **App** (`src/app/(app)/`): Home, Send, Mini apps and Profile tabs; activity history and transaction details (with a Stellar Expert link); notifications; receive (QR code, test funds); manage assets (trustlines) and asset details; send flow (recipient → amount → review → PIN → done) and a QR scanner that reads addresses, SEP-0007 `web+stellar:pay` links.
- **Settings** (`src/app/(app)/settings/`): edit profile, security & PIN (change PIN, biometrics, auto-lock), recovery & backup (back up again, show phrase behind the PIN), connected apps, notification preferences, appearance (System / Light / Dark with previews), help and a developer screen in dev builds.

The root layout shows exactly one of onboarding, the lock screen or the app, using Expo Router protected routes keyed on the wallet status.

## Key protection

The recovery phrase is stored in a Keychain / Keystore item that the OS releases only after biometrics when the device supports it (development or production build with biometrics enrolled), and in a plain device-only item otherwise (Expo Go, no biometrics, web preview). Signing asks the OS for biometrics once after the user approves; the derived key is dropped after 60 s, on lock and on backgrounding. If the OS invalidates the key (biometrics changed), **Settings › Security & PIN › Recover signing access** re-secures it from the recovery phrase. See `src/wallet/phraseStoreCore.ts` and [`../SECURITY_REVIEW.md`](../SECURITY_REVIEW.md) for exactly what each platform enforces.

## Cloud backup

> **Not implemented yet; a planned production task.** What follows describes the encrypted file and the adapter interface that real Google Drive / iCloud sign-in will plug into. Today the file stays on the device.

The backup is a small JSON file (`src/wallet/backup.ts`): the phrase sealed with AES-256-GCM under a key stretched from the user's backup password with scrypt (N=2¹⁵, r=8). The address is bound in as associated data. Only this file leaves the phone; MiniGo never sees the phrase or the password.

`src/wallet/cloud.ts` picks the provider by platform and stores through an adapter. Until real sign-in is configured, the adapter keeps the encrypted file on the device, and Recovery & backup says so. To go live:

- **Android / Google Drive**: add Google Sign-In (e.g. `@react-native-google-signin/google-signin`) with the `drive.appdata` scope and an OAuth client, then call `setCloudAdapter(googleDriveAdapter(getAccessToken))`. The Drive REST calls are in `src/wallet/googleDrive.ts` (not yet exercised against the live API).
- **iOS / iCloud**: needs an iCloud container entitlement and a native module for iCloud Documents or key-value storage, behind the same `CloudAdapter` interface.

Both need a development build (`npx expo run:android|ios` or `eas build --profile development`).

scrypt runs in JavaScript. It took about 0.3s in a desktop browser; on a phone's Hermes engine expect several seconds, so the buttons show progress. If that's too slow on low-end Android, swap in a native scrypt.

## Stellar on React Native (Hermes)

Stellar's libraries build transactions in Node's `Buffer`, which React Native doesn't have, and Hermes (its JavaScript engine) slices a Buffer into a plain `Uint8Array`. On the phone that made every transaction print as `0,0,0,2,…` instead of base64, so Stellar rejected it as malformed ("Stellar rejected the transaction"), while browsers and Node worked. Two things prevent it:

- `src/polyfills.ts` (imported first in `src/app/_layout.tsx`) installs the `buffer` package as the global `Buffer` and keeps slices as Buffers.
- `metro.config.js` makes the `@stellar/*` packages use their normal builds on native, not the pre-bundled browser builds, which carry private copies of `Buffer` that can't be patched from outside.

The SDK also makes transaction text from raw bytes (`minigo-wallet-sdk/src/core/encode.ts`) instead of trusting `Buffer.toString`. `minigo-wallet-sdk/test/hermes/run.mjs` builds the app's Android bundle, runs it in the real Hermes engine and in Node and requires identical output (hashes, signed XDR, signatures, memo and asset parsing). Run it after upgrading `@stellar/stellar-base`, `buffer`, Expo or React Native.

## Mini app wallet

Mini apps get the same wallet as the MiniGo browser extension, from [`../minigo-wallet-sdk`](../minigo-wallet-sdk):

- **In the page:** `src/mini/inpage.generated.ts` is the SDK's embedded provider (built by `npm run build` there). It's injected with `injectedJavaScriptBeforeContentLoaded`, so `window.mini` exists before a mini app's own scripts run. It follows SEP-43, and also answers `@stellar/freighter-api`: no real Freighter exists inside MiniGo, so Freighter-based dApps and Stellar Wallets Kit's Freighter module work unchanged.
- **In the app:** `src/mini/MiniAppHost.tsx` hands each message to the SDK's `handleRequest` (`minigo-wallet-sdk/src/host.ts`) with a context that supplies the address, the key (after approval), the per-app connection and the approval sheets (`ConnectSheet`, `PaymentSheet`, `SignSheet`, each ending in the PIN).

```js
await window.mini.requestAccess();   // connect sheet → { address }
await window.mini.getNetwork();      // { network: "TESTNET", networkPassphrase, … }
await window.mini.requestPayment({ to, amount: "5", asset: "XLM", memo });  // review + PIN → { hash }, on testnet
await window.mini.signMessage("Sign in to …");  // review + PIN → { signedMessage, signerAddress }
// Every call resolves; failures come back as { error: { code, message } } (-3 invalid, -4 declined).
```

Inside the app a WebView also delivers messages from iframes in the page, and the URL that comes with a message is not a reliable sender identity on every platform, so `MiniAppFrame` injects the provider with a secret nonce into the **main frame only** and accepts requests only if they carry it (`minigo-wallet-sdk/src/bridge-gate.ts`, tested by `../test-malicious-frame`).

The host never trusts the page: it validates every parameter, refuses requests for another network or signer before asking the user and nothing is signed without the PIN. URL mini apps may only talk to the wallet from their own origin, and links to other sites open in the browser. On web, catalogue pages run in a sandboxed iframe with the provider prepended; URL apps include `test-mini-app/public/minigo.js`, the same provider over `postMessage`.

The SDK sources are imported directly (`@minigo/wallet-sdk/*` in `tsconfig.json`, and `metro.config.js` watches the folder), so there's nothing to publish or link.

## Testing a mini app

`../test-mini-app` is a separate site that exercises the calls on testnet, including error cases:

```bash
cd ../test-mini-app && npm start
```

Then, with the app running from `npx expo start` (development mode), open **Mini apps → Developer → Test Mini App**, or **Profile → Developer** to open any URL (localhost or a live site). These entries are hidden in production builds. The app uses your computer's address (from Metro's host) so a phone on the same Wi-Fi can reach it; set `EXPO_PUBLIC_TEST_MINI_APP_URL` to point elsewhere. Plain `http://` works in Expo Go; a development build on Android needs cleartext traffic allowed, or serve the test app over HTTPS.

## Checks

```bash
npm run typecheck   # tsc --noEmit
npx expo lint
npm test            # unit tests (node --test): the phrase store's tiers, upgrade and recovery
```

Typecheck and lint work from a clean checkout: `@stellar/stellar-base` is declared here and mapped in `tsconfig.json`, so SDK sources resolve it from this app's `node_modules`.

## Layout

- `src/app/` – routes (Expo Router).
- `src/components/` – shared UI: buttons, stack headers, rows, sheets, PIN pad, QR code, transaction rows, the connect, payment and signing sheets.
- `src/wallet/` – keys (`stellar.ts`), backup encryption, cloud adapters, vault and phrase store (SecureStore), PIN and the wallet state provider.
- `src/stellar/` – network settings, assets, history from Horizon, the XLM price.
- `src/mini/` – the injected provider, WebView / iframe frames, the mini app host and stand-in pages.
- `src/data/` – transaction and notification shapes, the mini app catalogue, recipient and QR code parsing.
- `src/theme/` – palettes and the theme provider.
