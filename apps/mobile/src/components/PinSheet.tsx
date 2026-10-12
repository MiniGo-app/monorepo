import { useWallet } from "@/wallet/WalletProvider";
import { useLockout } from "@/wallet/useLockout";
import { PinPad } from "./PinPad";
import { Sheet } from "./Sheet";

type PinSheetProps = {
  visible: boolean;
  title?: string;
  subtitle?: string;
  onClose: () => void;
  // Called with the PIN once it checks out.
  onVerified?: (pin: string) => void;
  // Replaces the plain PIN check, e.g. to unlock the recovery phrase in the same step.
  verify?: (pin: string) => Promise<boolean>;
};

export function PinSheet({ visible, title = "Enter your PIN", subtitle, onClose, onVerified, verify }: PinSheetProps) {
  const { verifyPin } = useWallet();
  const lockout = useLockout();
  return (
    <Sheet visible={visible} onClose={onClose} tall>
      <PinPad
        key={String(visible)}
        title={title}
        subtitle={subtitle}
        notice={lockout}
        disabled={!!lockout}
        onComplete={async (pin) => {
          if (!(await (verify ?? verifyPin)(pin))) return false;
          onVerified?.(pin);
        }}
      />
    </Sheet>
  );
}
