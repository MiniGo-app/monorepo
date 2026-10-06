import { useState } from "react";
import { SvgFilters } from "./components/SvgFilters";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Paper } from "./components/Paper";
import { Dialog } from "./components/Dialog";
import { APPS } from "./data/apps";

type DialogId = "try" | "how" | null;

export function App() {
  const [openDialog, setOpenDialog] = useState<DialogId>(null);
  const close = () => setOpenDialog(null);

  return (
    <>
      <SvgFilters />

      <div className="stage">
        <Paper />
        <Header onOpenTry={() => setOpenDialog("try")} />
        <Hero onOpenTry={() => setOpenDialog("try")} onOpenHow={() => setOpenDialog("how")} />

        {/* The roll is decoration for sighted users; screen readers get the same list as plain text. */}
        <ul className="sr">
          {APPS.filter((app) => app.name !== "Your app").map((app) => (
            <li key={app.name}>
              {app.name}: {app.detail}
            </li>
          ))}
        </ul>
      </div>

      <Dialog open={openDialog === "try"} onClose={close} titleId="tryTitle" title="Try MiniGo on testnet">
        <p className="dlg-note">MiniGo runs on Stellar's test network, so everything in it is free test money.</p>
        <ol>
          <li>
            Install <strong>Expo Go</strong> on your phone.
          </li>
          <li>
            Get the code, then in the <code>minigo</code> folder run <code>npm install</code> and{" "}
            <code>npx expo start</code>.
          </li>
          <li>Scan the QR code with Expo Go, and create a wallet.</li>
        </ol>
        <div className="dlg-actions">
          <a className="btn btn-solid btn-sm" href="https://github.com/MiniGo-app" rel="noopener">
            Open the repo
          </a>
          <button className="btn btn-ghost btn-sm" type="button" onClick={close}>
            Close
          </button>
        </div>
      </Dialog>

      <Dialog open={openDialog === "how"} onClose={close} titleId="howTitle" title="How MiniGo works">
        <ol>
          <li>
            <strong>Create a wallet.</strong> No seed phrase to write down: your keys are backed up for you,
            encrypted with a password only you know.
          </li>
          <li>
            <strong>Add what you need.</strong> Hold XLM, USDC or any token you trust and open mini apps from the
            same place.
          </li>
          <li>
            <strong>Pay and sign inside apps.</strong> Every payment and signature asks for your PIN, so an app
            never moves your money on its own.
          </li>
        </ol>
        <div className="dlg-actions">
          <button className="btn btn-solid btn-sm" type="button" onClick={() => setOpenDialog("try")}>
            Try it on testnet
          </button>
          <button className="btn btn-ghost btn-sm" type="button" onClick={close}>
            Close
          </button>
        </div>
      </Dialog>
    </>
  );
}
