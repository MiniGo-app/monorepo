// Backup password policy and KDF parameters. No dependencies (no expo-crypto, no @/ imports) so it can be unit
// tested in plain Node (test/backup.test.ts); backup.ts re-exports everything here.

// A passphrase of several words, not a password. Short passwords can't be made safe: the sealed file sits in the
// cloud, so an attacker guesses offline, and scrypt only adds a fixed cost per guess.
export const MIN_PASSWORD_LENGTH = 12;

// scrypt work parameters for NEW backups. 128·N·r = 64 MB of memory per guess (safe to run in JS on a low-end
// phone), and N·r·p matches OWASP's scrypt minimum (2^17, r=8, p=1) in total work at half the peak memory. Old
// backups keep the parameters stored in their own file (hasSafeKdfParams accepts the earlier settings).
export const KDF = { N: 2 ** 16, r: 8, p: 2 } as const;

export type Kdf = { name: "scrypt"; N: number; r: number; p: number; salt: string };

// The backup file comes from the cloud, so its scrypt settings are untrusted input. Without bounds, a tampered
// file could ask for gigabytes of memory (scrypt needs 128·N·r bytes) and freeze the phone at restore. Accept
// only settings MiniGo has used or would plausibly use; the ceiling (2^17, r=8, p=2 → 128 MB) caps the memory.
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

// A few of the most common passwords and keyboard runs, so an otherwise "long enough" guess like "password1234"
// or "qwertyuiop12" is still called out. Not a full dictionary — the length requirement does most of the work.
const WEAK_PATTERNS = [/^[0-9]+$/, /(.)\1{3,}/i, /password/i, /qwert/i, /asdf/i, /1234|2345|3456|4567|5678|6789/, /letmein|admin|welcome|iloveyou|monkey|dragon/i];

// Rough base-2 entropy: log2(charset size) per character, minus a penalty for a weak pattern. Deliberately
// conservative — it guides the user toward a longer passphrase rather than scoring precisely.
function estimateBits(password: string): number {
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const pool = [26, 52, 62, 95][Math.max(0, classes - 1)] ?? 26;
  const unique = new Set(password).size;
  // Repeated characters add little; count effective length as somewhere between unique and total.
  const effectiveLength = (password.length + unique) / 2;
  return effectiveLength * Math.log2(pool);
}

/**
 * Scores a candidate backup password. `acceptable` gates submission: a password must be at least
 * MIN_PASSWORD_LENGTH characters AND reach "Fair" (≈60 bits of estimated entropy) to be accepted.
 */
export function passwordStrength(password: string): PasswordStrength {
  if (password.length === 0) return { score: 0, label: "", acceptable: false };
  if (password.length < MIN_PASSWORD_LENGTH) return { score: 0, label: `At least ${MIN_PASSWORD_LENGTH} characters`, acceptable: false };
  // A recognised weak pattern (a common word, a digit run, a repeat) caps the score, unless the passphrase is long
  // enough that the rest of it carries the entropy on its own.
  if (WEAK_PATTERNS.some((re) => re.test(password)) && password.length < 20) {
    return { score: 1, label: "Too easy to guess — try a few random words", acceptable: false };
  }
  const bits = estimateBits(password);
  if (bits < 45) return { score: 1, label: "Too easy to guess — try a few random words", acceptable: false };
  if (bits < 60) return { score: 2, label: "Fair — longer is safer", acceptable: true };
  if (bits < 80) return { score: 3, label: "Good", acceptable: true };
  return { score: 4, label: "Strong", acceptable: true };
}
