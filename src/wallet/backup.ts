import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync } from "expo-crypto";
import { fromBase64, fromUtf8, utf8 } from "@/wallet/bytes";
import { normalizePhrase } from "@/wallet/stellar";

// The backup is the recovery phrase sealed with AES-256-GCM under the app's own key, with the wallet address bound
// in. It sits in MiniGo's private folder in the user's Google Drive (on the device until a cloud is available), so
// restoring needs no password. A file taken out of Drive is unreadable without MiniGo, but the key ships inside the
// app, so anyone who can sign in to the Google account can restore it: an accepted risk (SECURITY_REVIEW.md item 6).

export type BackupFile = {
  app: "minigo";
  version: 2;
  address: string;
  createdAt: string;
  cipher: "AES-256-GCM";
  payload: string;
};

// Changing it makes every existing backup unreadable.
const APP_BACKUP_KEY = "Nl9ffPGeShS0EVB9l3pzmXzHqExkMUpMgcKYxetedeE=";
const appBackupKey = () => AESEncryptionKey.import(fromBase64(APP_BACKUP_KEY));
const associatedData = (file: { version: number; address: string }) => utf8(`minigo-backup-v${file.version}:${file.address}`);

export async function sealBackup(phrase: string, address: string): Promise<BackupFile> {
  const header = { version: 2 as const, address };
  const sealed = await aesEncryptAsync(utf8(normalizePhrase(phrase)), await appBackupKey(), { additionalData: associatedData(header) });
  return {
    app: "minigo",
    ...header,
    createdAt: new Date().toISOString(),
    cipher: "AES-256-GCM",
    payload: (await sealed.combined("base64")) as string,
  };
}

export async function openBackup(file: BackupFile): Promise<string> {
  const plain = await aesDecryptAsync(AESSealedData.fromCombined(file.payload), await appBackupKey(), {
    additionalData: associatedData(file),
  });
  return fromUtf8(plain);
}

export function isBackupFile(value: unknown): value is BackupFile {
  const file = value as Partial<BackupFile> | null;
  return !!file && file.app === "minigo" && file.version === 2 && typeof file.address === "string" && typeof file.payload === "string";
}
