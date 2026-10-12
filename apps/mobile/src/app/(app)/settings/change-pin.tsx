import { useRouter } from "expo-router";
import { useState } from "react";
import { PinPad } from "@/components/PinPad";
import { StackScreen } from "@/components/StackScreen";
import { useToast } from "@/components/Toast";
import { isWeakPin } from "@/wallet/pin";
import { useLockout } from "@/wallet/useLockout";
import { useWallet } from "@/wallet/WalletProvider";

type Step = "current" | "new" | "confirm";

export default function ChangePinScreen() {
  const router = useRouter();
  const toast = useToast();
  const { verifyPin, changePin } = useWallet();
  const lockout = useLockout();
  const [step, setStep] = useState<Step>("current");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [notice, setNotice] = useState<string | null>(null);

  const titles: Record<Step, string> = { current: "Enter your current PIN", new: "Choose a new PIN", confirm: "Confirm your new PIN" };

  return (
    <StackScreen title="Change PIN" scroll={false}>
      <PinPad
        key={step}
        title={titles[step]}
        notice={step === "current" ? lockout : notice}
        disabled={step === "current" && !!lockout}
        onComplete={async (pin) => {
          if (step === "current") {
            if (!(await verifyPin(pin))) return false;
            setCurrent(pin);
            setStep("new");
            return;
          }
          if (step === "new") {
            if (isWeakPin(pin)) return "Too easy to guess. Try another PIN.";
            if (pin === current) return "That's your current PIN.";
            setNotice(null);
            setNext(pin);
            setStep("confirm");
            return;
          }
          if (pin !== next) {
            setNotice("PINs didn't match. Choose a new PIN again.");
            setStep("new");
            return;
          }
          await changePin(current, pin);
          toast("PIN changed");
          router.back();
        }}
      />
    </StackScreen>
  );
}
