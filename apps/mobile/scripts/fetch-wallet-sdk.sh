#!/usr/bin/env bash
# The app imports the wallet SDK's sources from ../minigo-wallet-sdk (see metro.config.js and tsconfig.json).
# Locally that folder is a checkout of the SDK repo. EAS builds this repo on its own, so before installing
# dependencies it fetches the SDK there at the commit below. Bump SDK_COMMIT to build against a newer SDK.
set -euo pipefail

SDK_REPO="https://github.com/MiniGo-app/minigo-wallet-sdk.git"
SDK_COMMIT="${MINIGO_WALLET_SDK_COMMIT:-57dda87d0d523f64f05465dde73fcedcd28a8e34}"
SDK_DIR="$(cd "$(dirname "$0")/.." && pwd)/../minigo-wallet-sdk"

if [ -d "$SDK_DIR/src" ]; then
  echo "Wallet SDK already at $SDK_DIR, leaving it as is."
  exit 0
fi

echo "Fetching the wallet SDK at $SDK_COMMIT into $SDK_DIR"
git init -q "$SDK_DIR"
git -C "$SDK_DIR" fetch -q --depth 1 "$SDK_REPO" "$SDK_COMMIT"
git -C "$SDK_DIR" checkout -q FETCH_HEAD
