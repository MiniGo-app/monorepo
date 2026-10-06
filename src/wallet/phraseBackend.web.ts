import type { PhraseBackend } from "./phraseStoreCore";
import { vault } from "./vault";

// Web preview only: no secure hardware, so the phrase is in localStorage. Never ship the wallet on web with this.
const unsupported = async (): Promise<never> => {
  throw new Error("Device-protected storage is not available on web");
};

export const phraseBackend: PhraseBackend = {
  deviceProtectionAvailable: async () => false,
  plain: { get: (key) => vault.get(key), set: (key, value) => vault.set(key, value), remove: (key) => vault.remove(key) },
  device: { get: unsupported, set: unsupported, remove: async () => {} },
};
