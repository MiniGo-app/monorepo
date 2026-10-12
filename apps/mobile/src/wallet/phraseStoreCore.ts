// Where the recovery phrase is stored and what it takes to read it. Kept free of native imports so it can be
// tested in Node; the real backend is phraseBackend.ts.
//
// "device": an item the OS only releases after biometrics, so a bypass of the PIN screen in JavaScript doesn't help.
// "pin-only": a plain Keychain or Keystore item, used where biometrics aren't available (Expo Go, web, none
// enrolled). There the PIN check in JavaScript is the only gate.

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
  deviceProtectionAvailable(): Promise<boolean>;
  plain: KeyValue;
  device: KeyValue;
};

export type ReadFailure =
  // Nothing stored on this device.
  | "missing"
  // The user dismissed the prompt or was locked out of biometrics for now. Trying again is fine.
  | "cancelled"
  // Biometrics or the lock screen changed and the OS won't release the key. The phrase has to be entered again.
  | "invalidated"
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

  async function store(phrase: string): Promise<Tier> {
    await clearAll();
    if (await backend.deviceProtectionAvailable()) {
      try {
        await device.set(DEVICE_PHRASE_KEY, phrase);
        await plain.set(TIER_KEY, "device");
        return "device";
      } catch {
        // Never leave the user without a stored phrase.
        await device.remove(DEVICE_PHRASE_KEY).catch(() => {});
      }
    }
    await plain.set(PHRASE_KEY, phrase);
    await plain.set(TIER_KEY, "pin-only");
    return "pin-only";
  }

  // Keeps the plain copy until the new one reads back.
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

  async function clearAll() {
    await Promise.all([device.remove(DEVICE_PHRASE_KEY).catch(() => {}), plain.remove(PHRASE_KEY).catch(() => {}), plain.remove(TIER_KEY).catch(() => {})]);
  }

  return { tier, store, read, clear: clearAll, canProtect: () => backend.deviceProtectionAvailable() };
}


const keyAccessMessages: Record<ReadFailure, string> = {
  missing: "No wallet on this device",
  cancelled: "Authentication cancelled",
  invalidated: "Your phone's security settings changed, so MiniGo can no longer open your key. Recover access in Settings › Security & PIN.",
  unavailable: "MiniGo couldn't open your key. Try again.",
};

export class KeyAccessError extends Error {
  reason: ReadFailure;
  constructor(reason: ReadFailure) {
    super(keyAccessMessages[reason]);
    this.name = "KeyAccessError";
    this.reason = reason;
  }
}
