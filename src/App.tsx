import { useState } from "react";
import { Header } from "./components/Header";
import { Hero } from "./components/Hero";
import { Showcase } from "./components/Showcase";
import { Dialog } from "./components/Dialog";
import { VideoDialog } from "./components/VideoDialog";

type DialogId = "try" | "how" | null;

export function App() {
  const [openDialog, setOpenDialog] = useState<DialogId>(null);
  const close = () => setOpenDialog(null);

  return (
    <>
      <div className="stage">
        <Header onOpenTry={() => setOpenDialog("try")} />
        <Showcase paused={openDialog !== null} />
        <Hero onOpenTry={() => setOpenDialog("try")} onOpenHow={() => setOpenDialog("how")} />
        <a className="legal" href="privacy.html">
          Privacy
        </a>
      </div>

      <Dialog open={openDialog === "try"} onClose={close} titleId="tryTitle" title="Download MiniGo for Android">
        <p className="dlg-note">This Android build runs on Stellar testnet, where funds have no real value.</p>
        <ol>
          <li>
            On your Android phone, download the <strong>MiniGo app</strong> (an APK file).
          </li>
          <li>Open the file. If Android asks, allow your browser to install apps, then tap Install.</li>
          <li>Open MiniGo, create a wallet and set up your backup in the app.</li>
        </ol>
        <p className="dlg-note dlg-foot">An iPhone build is planned.</p>
        <div className="dlg-actions">
          <a className="btn btn-solid btn-sm" href="https://minigo.app/minigo.apk" download="minigo.apk">
            Download APK
          </a>
          <button className="btn btn-ghost btn-sm" type="button" onClick={close}>
            Close
          </button>
        </div>
      </Dialog>

      <VideoDialog open={openDialog === "how"} onClose={close} />
    </>
  );
}
