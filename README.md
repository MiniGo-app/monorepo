# MiniGo

A Stellar wallet for phones, built with Expo, with mini apps that run inside it. It runs on Stellar testnet for now.

## Setup

The app imports the wallet SDK from source, so clone both repos side by side:

```bash
git clone https://github.com/MiniGo-app/minigo-app
git clone https://github.com/MiniGo-app/minigo-wallet-sdk
cd minigo-app
npm install
npx expo start          # scan the QR code with Expo Go
npx expo start --web    # browser preview
```

Expo Go runs everything except Google Drive backup and the phone-protected recovery phrase, which need a development build (`eas build --profile development --platform android`).

EAS builds this repo on its own, so `scripts/fetch-wallet-sdk.sh` (the `eas-build-pre-install` hook) clones the public SDK repo next to it at the commit pinned in that script. Bump the pin when the app needs a newer SDK.

## Checks

```bash
npm run typecheck
npm run lint
npm test
```

## What works

Everything runs against Stellar testnet (`src/stellar/network.ts`).

| Works | Not yet |
| --- | --- |
| 12-word recovery phrase made on the phone, with the Stellar key derived by SEP-0005 | Mainnet |
| Balances and history from Horizon, refreshed every 15 seconds and on pull to refresh | Sending to an email or phone number |
| XLM, USDC and any trustline asset sent from the phone, creating the recipient's account when needed | Payment links |
| Adding and removing assets (trustlines) | iCloud backup (on iOS the encrypted file stays on the device for now) |
| Test funds from Friendbot and a link to Circle's USDC faucet | Push notifications |
| Encrypted backup, PIN with lockout, auto-lock and biometrics | Real pages for the catalogue apps that don't have a live site |
| Mini apps that connect, pay and sign, each approved with the PIN | |

The dollar total on Home uses XLM's market price from CoinGecko and counts USDC at $1. Testnet coins have no real value.

## Screens

- Onboarding (`src/app/onboarding/`): welcome, backup (Google Drive on Android, iCloud on iOS or writing the phrase down), your details, a PIN and optional biometrics. Restore works from the backup and its password or from the phrase.
- Lock (`src/app/lock.tsx`): PIN or biometrics. Five wrong PINs lock input for 30 seconds, doubling after that. Forgot PIN removes the wallet and goes to restore.
- App (`src/app/(app)/`): Home, Send, Mini apps and Profile tabs, activity, notifications, receive, assets, the send flow and a QR scanner for addresses and SEP-0007 payment links.
- Settings (`src/app/(app)/settings/`): profile, security and PIN, recovery and backup, connected apps, notifications, appearance and help, plus a developer screen in development builds.

## Keys

The recovery phrase is kept in a Keychain or Keystore item that the OS only releases after biometrics, where the phone supports it. Otherwise (Expo Go, web, no biometrics enrolled) it is a plain device-only item behind the PIN. The derived key is dropped after 60 seconds, on lock and when the app goes to the background. If biometrics change and the OS stops releasing the key, Settings › Security & PIN › Recover signing access re-secures it from the phrase. See `src/wallet/phraseStoreCore.ts`.

## Cloud backup

The backup is a small JSON file (`src/wallet/backup.ts`): the phrase sealed with AES-256-GCM under a key stretched from the backup password with scrypt, with the address bound in. Only that file leaves the phone.

`src/wallet/cloud.ts` stores it through an adapter:

- Android builds (development or release): Google Drive. `src/wallet/googleAuth.ts` signs in with `@react-native-google-signin/google-signin` and asks only for the `drive.appdata` scope, MiniGo's hidden folder in the user's own Drive. `src/wallet/googleDrive.ts` saves, loads and deletes the file there. The sign-in happens the first time someone backs up or restores; if a restore finds no backup, the account is signed out so trying again asks for another one.
- Expo Go, the web preview and iOS: the file stays on the device. Google sign-in is native code that Expo Go can't run, and iCloud needs a container entitlement and a native module behind the same `CloudAdapter` interface.

Google setup lives in the MiniGo Google Cloud project: the Drive API, the consent screen (published, `drive.appdata` only) and two OAuth clients. The web client's ID is in `googleAuth.ts`. The Android client is matched by Google from the package name `app.minigo.wallet` and the SHA-1 of the signing key, so any build signed with a different key (for example a local debug build) needs its own Android client in the project. The library's Expo config plugin isn't in `app.json`: without options it switches to Firebase setup, and with options it only configures iOS. Add it with an `iosUrlScheme` once there is an iOS client.

scrypt runs in JS and takes a few seconds on a phone, so the buttons show progress.

## Stellar on React Native

Stellar's libraries need Node's `Buffer`, and on Hermes a sliced Buffer comes back as a plain `Uint8Array`, which broke every transaction the phone sent. `src/polyfills.ts` installs a Buffer whose slices stay Buffers, and `metro.config.js` makes the Stellar packages use their Node builds on native so the one polyfill covers them.

## Mini apps

Mini apps get the same wallet as the browser extension, from the SDK:

- `src/mini/inpage.generated.ts` is the SDK's provider, written by `npm run build` in the SDK. It is injected before a mini app's own scripts, so `window.mini` is there from the start. It also answers `@stellar/freighter-api`.
- `src/mini/MiniAppHost.tsx` passes each request to the SDK's `handleRequest` with the address, the key and the approval sheets.

```js
await window.mini.requestAccess();
await window.mini.getNetwork();
await window.mini.requestPayment({ to, amount: "5", asset: "XLM", memo });
await window.mini.signMessage("Sign in to example.com");
```

Every call resolves. Failures come back as `{ error: { code, message } }`, with `-3` for a bad request and `-4` for a decline.

A WebView also delivers messages from iframes in the page, so `MiniAppFrame` injects the provider into the main frame only with a secret nonce and drops requests without it. URL mini apps can only reach the wallet from their own origin and links to other sites open in the browser.

Open mini apps stay running in a layer above the screens (`src/mini/OpenApps.tsx`), up to three at a time.

## Trying a mini app

Start the example mini app from the SDK:

```bash
cd ../minigo-wallet-sdk/examples/mini-app && npm start
```

With the app running from `npx expo start`, open Mini apps > Developer > Test Mini App, or enter any URL under Profile > Developer. Both are hidden in production builds. The phone and the computer need to be on the same Wi-Fi.

## Layout

- `src/app/`: routes
- `src/components/`: shared UI, including the connect, payment and signing sheets
- `src/wallet/`: keys, backup, PIN, secure storage and the wallet state
- `src/stellar/`: network settings, assets, history and the XLM price
- `src/mini/`: the mini app frames, host and open apps layer
- `src/data/`: transactions, notifications, the mini app catalogue and QR parsing
- `src/theme/`: colours and the theme provider
