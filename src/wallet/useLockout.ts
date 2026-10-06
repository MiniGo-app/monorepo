import { useEffect, useState } from "react";
import { useWallet } from "@/wallet/WalletProvider";

// "Try again in 28s" while too many wrong PINs have locked input, otherwise null.
export function useLockout() {
  const { lockedUntil } = useWallet();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (lockedUntil <= Date.now()) return;
    const tick = () => setNow(Date.now());
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 1000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, [lockedUntil]);

  const seconds = Math.ceil((lockedUntil - now) / 1000);
  if (seconds <= 0) return null;
  return `Too many attempts. Try again in ${seconds >= 60 ? `${Math.ceil(seconds / 60)}m` : `${seconds}s`}.`;
}
