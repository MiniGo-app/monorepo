import Constants, { ExecutionEnvironment } from "expo-constants";
import * as SecureStore from "expo-secure-store";
import type { PhraseBackend } from "./phraseStoreCore";

// Both slots stay on this device and are left out of OS backups.
const plainOptions: SecureStore.SecureStoreOptions = { keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY };
const deviceOptions = (prompt?: string): SecureStore.SecureStoreOptions => ({
  // The item stops opening if the enrolled biometrics change, on iOS and Android.
  requireAuthentication: true,
  authenticationPrompt: prompt,
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
});

export const phraseBackend: PhraseBackend = {
  // Expo Go can't create authenticated items.
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
