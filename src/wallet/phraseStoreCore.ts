// Where the recovery phrase lives, and what it takes to read it. Pure logic over a backend so it can be tested
// without a phone (see test/phraseStore.test.ts); the real backend is phraseBackend.ts.
//
// Two tiers:
//   "device"   The phrase is in an item the OS will only release after the user authenticates with biometrics
//              (iOS Keychain access control biometryCurrentSet; Android Keystore AES key with
//              setUserAuthenticationRequired(true), checked per use through a BiometricPrompt CryptoObject; both are
//              biometrics only, no passcode fallback). A JavaScript-level bypass of the PIN screen does not help:
//              the read itself is what triggers the system prompt, and the OS enforces it.
//   "pin-only" The phrase is in a plain Keychain/Keystore item (encrypted at rest, this device only). The only
//              gate is MiniGo's own PIN check, which is JavaScript. Used when the device can't do the above:
//              no biometrics enrolled, Expo Go, or web preview.
//
// Both keep the OS's protection at rest and are excluded from device backups. The difference is what stops code
// running inside the app from reading the phrase.

export const PHRASE_KEY = "minigo.phrase"; // the original slot: plain item
export const DEVICE_PHRASE_KEY = "minigo.phrase.device"; // biometric-gated item
export const TIER_KEY = "minigo.phrase.tier";

export type Tier = "device" | "pin-only";

export type KeyValue = {
  get(key: string, prompt?: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  remove(key: string): Promise<void>;
};

export type PhraseBackend = {
  /** Can this runtime create biometric-gated items right now? False in Expo Go, on web, or with no biometrics enrolled. */
  deviceProtectionAvailable(): Promise<boolean>;
  plain: KeyValue;
  /** Reading prompts the user; the OS enforces it. */
  device: KeyValue;
};

export type ReadFailure =
  // Nothing stored on this device.
  | "missing"
  // The user dismissed the prompt or was locked out of biometrics for now. Trying again is fine.
  | "cancelled"
  // The OS no longer releases the key: biometrics were added/removed or the lock screen changed. The wallet's
  // address is still known; signing needs the phrase to be entered again (recover()).
  | "invalidated"
  // Any other error from the secure store. Nothing was changed.
  | "unavailable";

export type PhraseRead = { ok: true; phrase: string; tier: Tier } | { ok: false; reason: ReadFailure };

export const isCancel = (error: unknown) =>
  /cancel|user_cancel|lockout|too many attempts|not authenticated|authentication failed/i.test(error instanceof Error ? error.message : String(error));

export function createPhraseStore(backend: PhraseBackend) {
  const { plain, device } = backend;

  async function tier(): Promise<Tier | "missing"> {
    const marker = await plain.get(TIER_KEY);
    if (marker === "device") return "device";
    // Wallets made before tiers existed have the phrase in the plain slot and no marker.
    return (await plain.get(PHRASE_KEY)) ? "pin-only" : "missing";
  }

  /** Puts a phrase in the strongest place this device offers. Returns where it went. */
  async function store(phrase: string): Promise<Tier> {
    await clearAll();
    if (await backend.deviceProtectionAvailable()) {
      try {
        await device.set(DEVICE_PHRASE_KEY, phrase);
        await plain.set(TIER_KEY, "device");
        return "device";
      } catch {
        // Fall through to the plain slot; never leave the user without a stored phrase.
        await device.remove(DEVICE_PHRASE_KEY).catch(() => {});
      }
    }
    await plain.set(PHRASE_KEY, phrase);
    await plain.set(TIER_KEY, "pin-only");
    return "pin-only";
  }

  /** Moves a phrase from the plain slot into the biometric-gated one, keeping the plain copy until the new one reads back. */
  async function upgrade(phrase: string, prompt: string): Promise<PhraseRead> {
    try {
      await device.set(DEVICE_PHRASE_KEY, phrase);
      const back = await device.get(DEVICE_PHRASE_KEY, prompt);
      if (back !== phrase) throw new Error("readback mismatch");
      await plain.set(TIER_KEY, "device");
      await plain.remove(PHRASE_KEY);
      return { ok: true, phrase, tier: "device" };
    } catch (error) {
      await device.remove(DEVICE_PHRASE_KEY).catch(() => {});
      // Dismissing the prompt must not turn into "read it without authentication".
      if (isCancel(error)) return { ok: false, reason: "cancelled" };
      return { ok: true, phrase, tier: "pin-only" };
    }
  }

  /** Reads the phrase. In the device tier this is where the user is asked to authenticate. */
  async function read(prompt: string): Promise<PhraseRead> {
    const current = await tier();
    if (current === "missing") return { ok: false, reason: "missing" };
    if (current === "device") {
      try {
        const phrase = await device.get(DEVICE_PHRASE_KEY, prompt);
        return phrase ? { ok: true, phrase, tier: "device" } : { ok: false, reason: "invalidated" };
      } catch (error) {
        return { ok: false, reason: isCancel(error) ? "cancelled" : "unavailable" };
      }
    }
    const phrase = await plain.get(PHRASE_KEY);
    if (!phrase) return { ok: false, reason: "missing" };
    return (await backend.deviceProtectionAvailable()) ? upgrade(phrase, prompt) : { ok: true, phrase, tier: "pin-only" };
  }

  /** Removes everything, including an item the OS has invalidated. */
  async function clearAll() {
    await Promise.all([device.remove(DEVICE_PHRASE_KEY).catch(() => {}), plain.remove(PHRASE_KEY).catch(() => {}), plain.remove(TIER_KEY).catch(() => {})]);
  }

  return { tier, store, read, clear: clearAll, canProtect: () => backend.deviceProtectionAvailable() };
}

export type PhraseStore = ReturnType<typeof createPhraseStore>;

const keyAccessMessages: Record<ReadFailure, string> = {
  missing: "No wallet on this device",
  cancelled: "Authentication cancelled",
  invalidated: "Your phone's security settings changed, so MiniGo can no longer open your key. Recover access in Settings › Security & PIN.",
  unavailable: "MiniGo couldn't open your key. Try again.",
};

/** Thrown when the signing key can't be produced; `reason` says why so the UI can offer the right next step. */
export class KeyAccessError extends Error {
  reason: ReadFailure;
  constructor(reason: ReadFailure) {
    super(keyAccessMessages[reason]);
    this.name = "KeyAccessError";
    this.reason = reason;
  }
}
