// No app imports, so the tests can run this in Node. backup.ts re-exports it.

// The sealed file sits in the cloud where it can be guessed at offline, so short passwords can't be made safe.
export const MIN_PASSWORD_LENGTH = 12;

// 64 MB of memory per guess, which a low-end phone can run in JS. The total work matches OWASP's scrypt minimum.
// Older backups keep the settings stored in their file.
export const KDF = { N: 2 ** 16, r: 8, p: 2 } as const;

export type Kdf = { name: "scrypt"; N: number; r: number; p: number; salt: string };

// The file's scrypt settings come from the cloud, so they're bounded. Otherwise a tampered file could ask for
// gigabytes of memory and freeze the phone during restore.
const MAX_N = 2 ** 17;
const isPowerOfTwo = (n: number) => Number.isInteger(n) && n > 0 && (n & (n - 1)) === 0;

export function hasSafeKdfParams(kdf: Kdf | undefined): kdf is Kdf {
  return (
    !!kdf &&
    kdf.name === "scrypt" &&
    isPowerOfTwo(kdf.N) &&
    kdf.N >= 2 ** 14 &&
    kdf.N <= MAX_N &&
    kdf.r === 8 &&
    Number.isInteger(kdf.p) &&
    kdf.p >= 1 &&
    kdf.p <= 2 &&
    typeof kdf.salt === "string" &&
    kdf.salt.length >= 22 &&
    kdf.salt.length <= 64
  );
}

export type PasswordScore = 0 | 1 | 2 | 3 | 4;
export type PasswordStrength = { score: PasswordScore; label: string; acceptable: boolean };

// Common passwords and keyboard runs. Not a dictionary: the minimum length does most of the work.
const WEAK_PATTERNS = [/^[0-9]+$/, /(.)\1{3,}/i, /password/i, /qwert/i, /asdf/i, /1234|2345|3456|4567|5678|6789/, /letmein|admin|welcome|iloveyou|monkey|dragon/i];

// A rough estimate, on the low side, to steer people toward a longer passphrase.
function estimateBits(password: string): number {
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const pool = [26, 52, 62, 95][Math.max(0, classes - 1)] ?? 26;
  const unique = new Set(password).size;
  const effectiveLength = (password.length + unique) / 2;
  return effectiveLength * Math.log2(pool);
}

// Accepted at MIN_PASSWORD_LENGTH characters and "Fair" (about 60 bits) or better.
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: "", acceptable: false };
  if (password.length < MIN_PASSWORD_LENGTH) return { score: 0, label: `At least ${MIN_PASSWORD_LENGTH} characters`, acceptable: false };
  // Long passphrases are fine even with a weak pattern somewhere in them.
  if (WEAK_PATTERNS.some((re) => re.test(password)) && password.length < 20) {
    return { score: 1, label: "Too easy to guess. Try a few random words", acceptable: false };
  }
  const bits = estimateBits(password);
  if (bits < 45) return { score: 1, label: "Too easy to guess. Try a few random words", acceptable: false };
  if (bits < 60) return { score: 2, label: "Fair. Longer is safer", acceptable: true };
  if (bits < 80) return { score: 3, label: "Good", acceptable: true };
  return { score: 4, label: "Strong", acceptable: true };
}
