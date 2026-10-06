import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type { PhraseBackend } from "./phraseStoreCore";

// Native backend. Both slots are Keychain / Keystore items that stay on this device and are left out of OS
// backups; the encrypted cloud backup is how a wallet moves.
const plainOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const deviceOptions = (prompt?: string): SecureStore.SecureStoreOptions => ({
  // iOS: access control biometryCurrentSet, so items stop opening if the enrolled biometrics change.
  // Android: a Keystore key that needs user authentication, invalidated when enrollment changes.
  requireAuthentication: true,
  authenticationPrompt: prompt,
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
});

export const phraseBackend: PhraseBackend = {
  // Expo Go can't create authenticated items; a development or production build can.
  deviceProtectionAvailable: async () =>
    Constants.executionEnvironment !== ExecutionEnvironment.StoreClient && SecureStore.canUseBiometricAuthentication(),
  plain: {
    get: (key) => SecureStore.getItemAsync(key, plainOptions),
    set: (key, value) => SecureStore.setItemAsync(key, value, plainOptions),
    remove: (key) => SecureStore.deleteItemAsync(key, plainOptions),
  },
  device: {
    get: (key, prompt) => SecureStore.getItemAsync(key, deviceOptions(prompt)),
    set: (key, value) => SecureStore.setItemAsync(key, value, deviceOptions()),
    remove: (key) => SecureStore.deleteItemAsync(key, deviceOptions()),
  },
};
