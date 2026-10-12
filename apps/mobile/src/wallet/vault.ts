import * as SecureStore from "expo-secure-store";

// Kept in the Keychain or Keystore on this device only. The encrypted cloud backup is how a wallet moves.
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const vault = {
  get: (key: string) => SecureStore.getItemAsync(key, options),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value, options),
  remove: (key: string) => SecureStore.deleteItemAsync(key, options),
};
