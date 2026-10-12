import { getRandomBytes } from "expo-crypto";
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { deriveAccount, normalizePhrase, phraseFromEntropy } from "./stellar";
import type { BackupInfo, Profile } from "./WalletProvider";

// Held in memory only. Nothing is saved until the PIN is set and the wallet is created.
export type Draft = {
  mode: "create" | "restore";
  phrase: string;
  address: string;
  backup: BackupInfo | null;
  profile: Profile | null;
};

type OnboardingValue = {
  draft: Draft | null;
  startNew: () => Promise<Draft>;
  startRestore: (phrase: string) => Promise<Draft>;
  update: (change: Partial<Draft>) => void;
};

const OnboardingContext = createContext<OnboardingValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<Draft | null>(null);

  const startNew = useCallback(async () => {
    const phrase = phraseFromEntropy(getRandomBytes(16));
    const { publicKey } = await deriveAccount(phrase);
    const next: Draft = { mode: "create", phrase, address: publicKey, backup: null, profile: null };
    setDraft(next);
    return next;
  }, []);

  const startRestore = useCallback(async (input: string) => {
    const phrase = normalizePhrase(input);
    const { publicKey } = await deriveAccount(phrase);
    const next: Draft = { mode: "restore", phrase, address: publicKey, backup: null, profile: null };
    setDraft(next);
    return next;
  }, []);

  const update = useCallback((change: Partial<Draft>) => {
    setDraft((current) => (current ? { ...current, ...change } : current));
  }, []);

  const value = useMemo(() => ({ draft, startNew, startRestore, update }), [draft, startNew, startRestore, update]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error("useOnboarding must be used inside OnboardingProvider");
  return value;
}
