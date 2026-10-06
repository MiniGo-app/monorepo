import AsyncStorage from "@react-native-async-storage/async-storage";
import { Keypair, type Asset } from "@stellar/stellar-base";
import * as LocalAuthentication from "expo-local-authentication";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { isWalletError } from "@minigo/wallet-sdk/core/errors.ts";
import {
  buildChangeTrust,
  buildPayment,
  fundWithFriendbot,
  loadAccount,
  submitTransaction,
  type AccountState,
} from "@minigo/wallet-sdk/core/horizon.ts";
import type { Transaction } from "@/data/transactions";
import { fetchHistory, labelAppPayments, type AppNote } from "@/stellar/history";
import { NETWORK } from "@/stellar/network";
import type { CloudProviderId } from "@/wallet/cloud";
import { checkPin, hashPin } from "@/wallet/pin";
import { phraseStore } from "@/wallet/phraseStore";
import { KeyAccessError, type Tier } from "@/wallet/phraseStoreCore";
import { deriveAccount, isValidPhrase, normalizePhrase } from "@/wallet/stellar";
import { vault } from "@/wallet/vault";

export type Profile = { name: string; email: string; phone: string };

export type BackupInfo = { method: CloudProviderId; at: string; live: boolean } | { method: "manual"; at: string };

export type AutoLock = "immediately" | "1m" | "5m";

export type Settings = {
  biometrics: boolean;
  autoLock: AutoLock;
  notifications: { payments: boolean; miniApps: boolean; product: boolean };
};

export type ConnectedApp = { id: string; name: string; origin?: string; connectedAt: string };

type WalletData = {
  address: string;
  profile: Profile;
  backup: BackupInfo | null;
  settings: Settings;
  connectedApps: ConnectedApp[];
  /** Transaction hash → the mini app that asked for it, so history can say so. */
  appNotes: { [hash: string]: AppNote };
  readNotifications: string[];
};

/** Live state of the account on the Stellar network. */
export type Chain = {
  status: "loading" | "ready" | "error";
  account: AccountState | null;
  history: Transaction[];
  error?: string;
  updatedAt?: number;
};

export type WalletStatus = "loading" | "onboarding" | "locked" | "unlocked";

export type NewWallet = { phrase: string; address: string; profile: Profile; pin: string; backup: BackupInfo | null };

export type SendParams = { to: string; asset: Asset; amount: string; memo?: string; app?: AppNote };

const DATA_KEY = "minigo-wallet";
const ATTEMPTS_KEY = "minigo-pin-attempts";
const PIN_KEY = "minigo.pin";
const MAX_ATTEMPTS = 5;
// In the device-protected tier the derived key is kept this long after the user authenticated, so a burst of
// signatures (a mini app making several requests) isn't a prompt each. It is dropped on lock and backgrounding.
const DEVICE_KEY_TTL_MS = 60_000;
const POLL_MS = 15_000;
const autoLockMs: Record<AutoLock, number> = { immediately: 0, "1m": 60_000, "5m": 300_000 };

const defaultSettings: Settings = {
  biometrics: false,
  autoLock: "1m",
  notifications: { payments: true, miniApps: true, product: false },
};

type Attempts = { count: number; until: number };

const message = (error: unknown) => (isWalletError(error) ? error.message : "Couldn't reach Stellar. Check your connection and try again.");

type WalletValue = {
  status: WalletStatus;
  data: WalletData | null;
  chain: Chain;
  lockedUntil: number;
  biometricsAvailable: boolean;
  createWallet: (wallet: NewWallet) => Promise<void>;
  unlock: (pin: string) => Promise<boolean>;
  unlockWithBiometrics: () => Promise<boolean>;
  lock: () => void;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (current: string, next: string) => Promise<boolean>;
  /** PIN, then the device's own authentication where the phrase is device-protected. Null if either is refused. */
  revealPhrase: (pin: string) => Promise<string | null>;
  /** How the recovery phrase is protected on this device (see SECURITY_REVIEW.md). */
  keyProtection: Tier | "unknown";
  /** True when the OS stopped releasing the key (biometrics or lock screen changed). Signing needs recoverAccess(). */
  needsKeyRecovery: boolean;
  /** Enter the recovery phrase again to re-secure the key. Resolves false if it isn't this wallet's phrase. */
  recoverAccess: (phrase: string) => Promise<boolean>;
  updateProfile: (profile: Profile) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  setBackup: (backup: BackupInfo) => void;
  connectApp: (app: Omit<ConnectedApp, "connectedAt">) => void;
  disconnectApp: (id: string) => void;
  markNotificationsRead: (ids: string[]) => void;
  signOut: () => Promise<void>;
  // Network
  /** Reloads balances, and history if anything changed. `force` reloads history regardless (pull to refresh). */
  refresh: (force?: boolean) => Promise<void>;
  /**
   * The signing key. Call only after the user approved the action: with device protection this is where the
   * system asks for biometrics. Throws KeyAccessError.
   */
  getKeypair: (reason?: string) => Promise<Keypair>;
  fundTestnet: () => Promise<void>;
  changeTrust: (asset: Asset, remove?: boolean) => Promise<string>;
  send: (params: SendParams) => Promise<{ hash: string }>;
  noteAppPayment: (hash: string, note: AppNote) => void;
};

const WalletContext = createContext<WalletValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<WalletStatus>("loading");
  const [data, setData] = useState<WalletData | null>(null);
  const [chain, setChain] = useState<Chain>({ status: "loading", account: null, history: [] });
  const [attempts, setAttempts] = useState<Attempts>({ count: 0, until: 0 });
  // The latest count, for PIN checks that overlap (the state value in a callback can be a render behind).
  const attemptsRef = useRef(attempts);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const keypairRef = useRef<Keypair | null>(null);
  const keypairTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const keypairLoading = useRef<Promise<Keypair> | null>(null);
  const [keyProtection, setKeyProtection] = useState<Tier | "unknown">("unknown");
  const [needsKeyRecovery, setNeedsKeyRecovery] = useState(false);
  // System authentication prompts (Face ID, fingerprint) make the app "inactive" for a moment. That isn't the user
  // leaving, so it must not start the auto-lock clock or drop the key mid-operation.
  const promptDepth = useRef(0);
  const promptEndedAt = useRef(0);
  const duringPrompt = useCallback(<T,>(run: () => Promise<T>) => {
    promptDepth.current++;
    return run().finally(() => {
      promptDepth.current--;
      promptEndedAt.current = Date.now();
    });
  }, []);
  const dataRef = useRef<WalletData | null>(null);

  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  useEffect(() => {
    (async () => {
      const [raw, pin, storedAttempts] = await Promise.all([
        AsyncStorage.getItem(DATA_KEY),
        vault.get(PIN_KEY),
        AsyncStorage.getItem(ATTEMPTS_KEY),
      ]);
      if (storedAttempts) setAttempts(JSON.parse(storedAttempts) as Attempts);
      phraseStore
        .tier()
        .then((tier) => setKeyProtection(tier === "missing" ? "unknown" : tier))
        .catch(() => {});
      if (raw && pin) {
        const stored = JSON.parse(raw) as Partial<WalletData>;
        setData({ appNotes: {}, readNotifications: [], connectedApps: [], ...stored } as WalletData);
        setStatus("locked");
      } else {
        setStatus("onboarding");
      }
    })().catch(() => setStatus("onboarding"));

    if (Platform.OS !== "web") {
      Promise.all([LocalAuthentication.hasHardwareAsync(), LocalAuthentication.isEnrolledAsync()])
        .then(([hardware, enrolled]) => setBiometricsAvailable(hardware && enrolled))
        .catch(() => {});
    }
  }, []);

  // Persist everything except secrets whenever it changes.
  useEffect(() => {
    if (data) AsyncStorage.setItem(DATA_KEY, JSON.stringify(data)).catch(() => {});
  }, [data]);

  const dropKeypair = useCallback(() => {
    keypairRef.current = null;
    if (keypairTimer.current) clearTimeout(keypairTimer.current);
    keypairTimer.current = null;
  }, []);

  const lockNow = useCallback(() => {
    dropKeypair();
    setStatus((current) => (current === "unlocked" ? "locked" : current));
  }, [dropKeypair]);

  // Auto-lock after the app has been in the background longer than the chosen delay.
  const autoLock = data?.settings.autoLock ?? "1m";
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (next) => {
      if (next === "background" || next === "inactive") {
        if (promptDepth.current > 0 || Date.now() - promptEndedAt.current < 1500) return;
        backgroundedAt.current ??= Date.now();
        dropKeypair();
      } else if (next === "active") {
        const since = backgroundedAt.current;
        backgroundedAt.current = null;
        if (since !== null && Date.now() - since >= autoLockMs[autoLock]) lockNow();
      }
    });
    return () => subscription.remove();
  }, [autoLock, lockNow, dropKeypair]);

  // ---- Network state
  // Polled every 15 s. The account is one small request; history (50 payments joined with their transactions) is
  // much heavier, so it is fetched again only when the account has changed since, or when asked (`force`, e.g.
  // pull to refresh). Nothing changed means no new state, so the screens don't re-render either.
  const chainRef = useRef(chain);
  useEffect(() => {
    chainRef.current = chain;
  }, [chain]);
  const refresh = useCallback(async (force = false) => {
    const current = dataRef.current;
    if (!current) return;
    try {
      const account = await loadAccount(NETWORK, current.address);
      const previous = chainRef.current;
      const unchanged =
        !force &&
        previous.status === "ready" &&
        previous.account?.exists === account.exists &&
        (!account.exists || (previous.account?.exists && previous.account.lastModifiedLedger === account.lastModifiedLedger && previous.account.baseReserve === account.baseReserve));
      if (unchanged) return;
      const history = await fetchHistory(current.address);
      setChain({ status: "ready", account, history, updatedAt: Date.now() });
    } catch (error) {
      setChain((prev) => ({ ...prev, status: prev.account ? "ready" : "error", error: message(error) }));
    }
  }, []);

  const address = data?.address;
  useEffect(() => {
    if (status !== "unlocked" || !address) return;
    refresh();
    const timer = setInterval(() => {
      if (AppState.currentState === "active") refresh();
    }, POLL_MS);
    return () => clearInterval(timer);
  }, [status, address, refresh]);

  useEffect(() => {
    attemptsRef.current = attempts;
  }, [attempts]);

  const saveAttempts = useCallback(async (next: Attempts) => {
    attemptsRef.current = next;
    setAttempts(next);
    await AsyncStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  // Wrong PINs: after five, each further miss locks input for longer (30s, 1m, 2m, …).
  const verifyPin = useCallback(
    async (pin: string) => {
      const current = attemptsRef.current;
      if (Date.now() < current.until) return false;
      // The attempt is counted, and the count saved, before the PIN is checked. Counting only after a wrong answer
      // would let someone force-close the app mid-check and keep guessing without ever reaching the lockout.
      const count = current.count + 1;
      await saveAttempts({ count, until: count >= MAX_ATTEMPTS ? Date.now() + 30_000 * 2 ** (count - MAX_ATTEMPTS) : 0 });
      const stored = await vault.get(PIN_KEY);
      const ok = !!stored && (await checkPin(pin, stored));
      if (ok) await saveAttempts({ count: 0, until: 0 });
      return ok;
    },
    [saveAttempts],
  );

  const unlock = useCallback(
    async (pin: string) => {
      const ok = await verifyPin(pin);
      if (ok) setStatus("unlocked");
      return ok;
    },
    [verifyPin],
  );

  const unlockWithBiometrics = useCallback(async () => {
    if (!biometricsAvailable || !data?.settings.biometrics) return false;
    const result = await duringPrompt(() =>
      LocalAuthentication.authenticateAsync({ promptMessage: "Unlock MiniGo", cancelLabel: "Use PIN", disableDeviceFallback: true }),
    );
    if (result.success) setStatus("unlocked");
    return result.success;
  }, [biometricsAvailable, data?.settings.biometrics, duringPrompt]);

  const createWallet = useCallback(async ({ phrase, address: newAddress, profile, pin, backup }: NewWallet) => {
    setKeyProtection(await phraseStore.store(phrase));
    setNeedsKeyRecovery(false);
    await vault.set(PIN_KEY, await hashPin(pin));
    await AsyncStorage.removeItem(ATTEMPTS_KEY);
    dropKeypair();
    setAttempts({ count: 0, until: 0 });
    setChain({ status: "loading", account: null, history: [] });
    setData({
      address: newAddress,
      profile,
      backup,
      settings: defaultSettings,
      connectedApps: [],
      appNotes: {},
      readNotifications: [],
    });
    setStatus("unlocked");
  }, [dropKeypair]);

  const changePin = useCallback(
    async (current: string, next: string) => {
      if (!(await verifyPin(current))) return false;
      await vault.set(PIN_KEY, await hashPin(next));
      return true;
    },
    [verifyPin],
  );

  // Reading the phrase: with device protection the OS asks for biometrics as part of the read. Without it (Expo Go,
  // no biometrics enrolled) the only gate is MiniGo's own PIN check, which is JavaScript, so where the device has a
  // lock screen we also ask for it as defence in depth. That extra prompt is a boolean the app trusts, not a key
  // the OS withholds; see SECURITY_REVIEW.md.
  const readPhrase = useCallback(
    async (reason: string) => {
      const read = await duringPrompt(() => phraseStore.read(reason));
      if (!read.ok) {
        if (read.reason === "invalidated") setNeedsKeyRecovery(true);
        throw new KeyAccessError(read.reason);
      }
      setKeyProtection(read.tier);
      return read;
    },
    [duringPrompt],
  );

  const revealPhrase = useCallback(
    async (pin: string) => {
      if (!(await verifyPin(pin))) return null;
      if ((await phraseStore.tier()) === "pin-only" && (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE) {
        const result = await duringPrompt(() => LocalAuthentication.authenticateAsync({ promptMessage: "Show your recovery phrase" }));
        if (!result.success) return null;
      }
      try {
        return (await readPhrase("Show your recovery phrase")).phrase;
      } catch (error) {
        if (error instanceof KeyAccessError && error.reason === "cancelled") return null;
        throw error;
      }
    },
    [verifyPin, readPhrase, duringPrompt],
  );

  const getKeypair = useCallback(
    async (reason = "Approve with your device") => {
      if (keypairRef.current) return keypairRef.current;
      // A second request that arrives while the first is waiting on the prompt shares its answer.
      keypairLoading.current ??= (async () => {
        const { phrase, tier } = await readPhrase(reason);
        const { secretSeed, publicKey } = await deriveAccount(phrase);
        const keypair = Keypair.fromRawEd25519Seed(secretSeed as never);
        if (keypair.publicKey() !== publicKey || publicKey !== dataRef.current?.address) throw new Error("Key doesn't match this wallet");
        keypairRef.current = keypair;
        // Device tier: keep it briefly. PIN-only: until lock, as it was before (nothing the OS enforces to re-ask).
        if (tier === "device") keypairTimer.current = setTimeout(dropKeypair, DEVICE_KEY_TTL_MS);
        return keypair;
      })().finally(() => {
        keypairLoading.current = null;
      });
      return keypairLoading.current;
    },
    [readPhrase, dropKeypair],
  );

  // Deriving the key from the phrase takes a moment on a phone. Where reading the phrase needs no prompt (PIN-only),
  // do it right after unlocking so the first payment doesn't wait on it. With device protection nothing is read
  // until the user approves something, so there is no prompt at unlock and no key sitting in memory.
  useEffect(() => {
    if (status !== "unlocked" || keyProtection !== "pin-only") return;
    // A wallet that could be upgraded is upgraded on its first approved action, not here, so unlocking never prompts.
    phraseStore
      .canProtect()
      .then((canProtect) => (canProtect ? undefined : getKeypair()))
      .catch(() => {});
  }, [status, keyProtection, getKeypair]);

  // Enter the phrase again after the OS invalidated the key (biometrics or lock screen changed).
  const recoverAccess = useCallback(
    async (input: string) => {
      if (!isValidPhrase(input)) return false;
      const phrase = normalizePhrase(input);
      const { publicKey } = await deriveAccount(phrase);
      if (publicKey !== dataRef.current?.address) return false;
      dropKeypair();
      setKeyProtection(await phraseStore.store(phrase));
      setNeedsKeyRecovery(false);
      return true;
    },
    [dropKeypair],
  );

  const update = useCallback((change: (current: WalletData) => WalletData) => {
    setData((current) => (current ? change(current) : current));
  }, []);

  const noteAppPayment = useCallback(
    (hash: string, note: AppNote) => {
      update((current) => ({ ...current, appNotes: { ...current.appNotes, [hash]: note } }));
      if (dataRef.current) dataRef.current = { ...dataRef.current, appNotes: { ...dataRef.current.appNotes, [hash]: note } };
    },
    [update],
  );

  const fundTestnet = useCallback(async () => {
    const current = dataRef.current;
    if (!current) return;
    await fundWithFriendbot(NETWORK, current.address);
    await refresh();
  }, [refresh]);

  const changeTrust = useCallback(
    async (asset: Asset, remove = false) => {
      const current = dataRef.current;
      if (!current) throw new Error("No wallet");
      const tx = await buildChangeTrust(NETWORK, current.address, asset, remove);
      tx.sign(await getKeypair());
      const { hash } = await submitTransaction(NETWORK, tx);
      await refresh();
      return hash;
    },
    [getKeypair, refresh],
  );

  const send = useCallback(
    async ({ to, asset, amount, memo, app }: SendParams) => {
      const current = dataRef.current;
      if (!current) throw new Error("No wallet");
      const plan = await buildPayment(NETWORK, { source: current.address, to, asset, amount, memo });
      plan.tx.sign(await getKeypair());
      const { hash } = await submitTransaction(NETWORK, plan.tx);
      if (app) noteAppPayment(hash, app);
      await refresh();
      return { hash };
    },
    [getKeypair, noteAppPayment, refresh],
  );

  const signOut = useCallback(async () => {
    await Promise.all([phraseStore.clear(), vault.remove(PIN_KEY), AsyncStorage.multiRemove([DATA_KEY, ATTEMPTS_KEY])]);
    dropKeypair();
    setNeedsKeyRecovery(false);
    setKeyProtection("unknown");
    // `data` stays in memory until the next wallet replaces it, so screens that are unmounting after the
    // guard flips never see it missing. Nothing persists it again: it only changes through a wallet.
    setStatus("onboarding");
  }, [dropKeypair]);

  // Mini app payments are labelled here rather than when fetched, so a note that lands after a fetch shows.
  const appNotes = data?.appNotes;
  const labelledChain = useMemo(
    () => (appNotes ? { ...chain, history: labelAppPayments(chain.history, appNotes) } : chain),
    [chain, appNotes],
  );

  const value = useMemo<WalletValue>(
    () => ({
      status,
      data,
      chain: labelledChain,
      lockedUntil: attempts.until,
      biometricsAvailable,
      createWallet,
      unlock,
      unlockWithBiometrics,
      lock: lockNow,
      verifyPin,
      changePin,
      revealPhrase,
      keyProtection,
      needsKeyRecovery,
      recoverAccess,
      updateProfile: (profile) => update((current) => ({ ...current, profile })),
      updateSettings: (settings) => update((current) => ({ ...current, settings: { ...current.settings, ...settings } })),
      setBackup: (backup) => update((current) => ({ ...current, backup })),
      connectApp: (app) =>
        update((current) => ({
          ...current,
          connectedApps: [
            { ...app, connectedAt: new Date().toISOString() },
            ...current.connectedApps.filter((item) => item.id !== app.id),
          ],
        })),
      disconnectApp: (id) =>
        update((current) => ({ ...current, connectedApps: current.connectedApps.filter((item) => item.id !== id) })),
      markNotificationsRead: (ids) =>
        update((current) => ({ ...current, readNotifications: [...new Set([...current.readNotifications, ...ids])].slice(-200) })),
      signOut,
      refresh,
      getKeypair,
      fundTestnet,
      changeTrust,
      send,
      noteAppPayment,
    }),
    [
      status,
      data,
      labelledChain,
      attempts.until,
      biometricsAvailable,
      createWallet,
      unlock,
      unlockWithBiometrics,
      lockNow,
      verifyPin,
      changePin,
      revealPhrase,
      keyProtection,
      needsKeyRecovery,
      recoverAccess,
      update,
      signOut,
      refresh,
      getKeypair,
      fundTestnet,
      changeTrust,
      send,
      noteAppPayment,
    ],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet() {
  const value = useContext(WalletContext);
  if (!value) throw new Error("useWallet must be used inside WalletProvider");
  return value;
}

// For screens behind the unlocked guard, where wallet data always exists.
export function useWalletData() {
  const { data } = useWallet();
  if (!data) throw new Error("Wallet data is only available while unlocked");
  return data;
}

/** Live balances and history for the unlocked wallet. */
export function useChain() {
  return useWallet().chain;
}

export { message as errorMessage };
