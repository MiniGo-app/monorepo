import { scryptAsync } from "@noble/hashes/scrypt.js";
import { AESEncryptionKey, AESSealedData, aesDecryptAsync, aesEncryptAsync, getRandomBytes } from "expo-crypto";
import { fromBase64, fromUtf8, toBase64, utf8 } from "@/wallet/bytes";
import { normalizePhrase } from "@/wallet/stellar";
import { KDF, MIN_PASSWORD_LENGTH, hasSafeKdfParams, passwordStrength } from "@/wallet/backupPolicy";

export { KDF, MIN_PASSWORD_LENGTH, hasSafeKdfParams, passwordStrength };
export type { PasswordScore, PasswordStrength } from "@/wallet/backupPolicy";

// The phrase is sealed with AES-256-GCM under a key stretched from the backup password with scrypt.

export type BackupFile = {
  app: "minigo";
  version: 1;
  address: string;
  createdAt: string;
  kdf: { name: "scrypt"; N: number; r: number; p: number; salt: string };
  cipher: "AES-256-GCM";
  payload: string;
};


const associatedData = (file: Pick<BackupFile, "version" | "address">) =>
  utf8(`minigo-backup-v${file.version}:${file.address}`);

// From 0 to 1. scrypt in JS is slow on purpose, so the UI shows progress.
export type Progress = (fraction: number) => void;

async function deriveKey(password: string, salt: Uint8Array, params: { N: number; r: number; p: number }, onProgress?: Progress) {
  const bytes = await scryptAsync(utf8(password.normalize("NFKD")), salt, { ...params, dkLen: 32, onProgress });
  return AESEncryptionKey.import(bytes);
}

export async function sealBackup(phrase: string, password: string, address: string, onProgress?: Progress): Promise<BackupFile> {
  if (password.normalize("NFKD").length < MIN_PASSWORD_LENGTH) throw new Error(`Backup password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
  const salt = getRandomBytes(16);
  const key = await deriveKey(password, salt, KDF, onProgress);
  const header = { version: 1 as const, address };
  const sealed = await aesEncryptAsync(utf8(normalizePhrase(phrase)), key, { additionalData: associatedData(header) });
  return {
    app: "minigo",
    ...header,
    createdAt: new Date().toISOString(),
    kdf: { name: "scrypt", ...KDF, salt: toBase64(salt) },
    cipher: "AES-256-GCM",
    payload: (await sealed.combined("base64")) as string,
  };
}

export class WrongPasswordError extends Error {
  constructor() {
    super("That password doesn't open this backup.");
  }
}

export async function openBackup(file: BackupFile, password: string, onProgress?: Progress) {
  if (!hasSafeKdfParams(file.kdf)) throw new Error("This backup uses settings MiniGo doesn't accept.");
  const key = await deriveKey(password, fromBase64(file.kdf.salt), file.kdf, onProgress);
  try {
    const plain = await aesDecryptAsync(AESSealedData.fromCombined(file.payload), key, {
      additionalData: associatedData(file),
    });
    return fromUtf8(plain);
  } catch {
    throw new WrongPasswordError();
  }
}

export function isBackupFile(value: unknown): value is BackupFile {
  const file = value as BackupFile | null;
  return (
    !!file &&
    file.app === "minigo" &&
    file.version === 1 &&
    typeof file.address === "string" &&
    typeof file.payload === "string" &&
    hasSafeKdfParams(file.kdf)
  );
}
