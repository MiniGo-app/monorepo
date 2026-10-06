import * as SecureStore from "expo-secure-store";

// Device-only secrets (recovery phrase, PIN hash) live in the Keychain / Keystore and are never
// migrated to another device by OS backups; the encrypted cloud backup is the way to move a wallet.
const options: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const vault = {
  get: (key: string) => SecureStore.getItemAsync(key, options),
  set: (key: string, value: string) => SecureStore.setItemAsync(key, value, options),
  remove: (key: string) => SecureStore.deleteItemAsync(key, options),
};
