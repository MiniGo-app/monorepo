import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { isBackupFile, type BackupFile } from "@/wallet/backup";
import { driveAccessToken, forgetDriveToken, googleSignInAvailable } from "@/wallet/googleAuth";
import { googleDriveAdapter } from "@/wallet/googleDrive";

// Google Drive's hidden app folder on Android, iCloud on iOS.
export type CloudProviderId = "google-drive" | "icloud";

export const cloudProvider: { id: CloudProviderId; name: string } =
  Platform.OS === "ios" ? { id: "icloud", name: "iCloud" } : { id: "google-drive", name: "Google Drive" };

export type CloudAdapter = {
  // False while the backup only stays on this device.
  live: boolean;
  save: (file: BackupFile) => Promise<void>;
  load: () => Promise<BackupFile | null>;
  remove: () => Promise<void>;
};

// Used where Google sign-in can't run (Expo Go, the web preview) and on iOS until iCloud is set up. It keeps the same
// encrypted file on the device.
const SIMULATED_KEY = "minigo-simulated-cloud-backup";
const simulatedAdapter: CloudAdapter = {
  live: false,
  save: (file) => AsyncStorage.setItem(SIMULATED_KEY, JSON.stringify(file)),
  load: async () => {
    const raw = await AsyncStorage.getItem(SIMULATED_KEY);
    if (!raw) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isBackupFile(parsed) ? parsed : null;
    } catch {
      return null;
    }
  },
  remove: () => AsyncStorage.removeItem(SIMULATED_KEY),
};

let adapter = googleSignInAvailable ? googleDriveAdapter(driveAccessToken, forgetDriveToken) : simulatedAdapter;

export function setCloudAdapter(next: CloudAdapter) {
  adapter = next;
}

export const cloud = {
  get live() {
    return adapter.live;
  },
  save: (file: BackupFile) => adapter.save(file),
  load: () => adapter.load(),
  remove: () => adapter.remove(),
};
