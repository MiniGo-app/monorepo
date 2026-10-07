import { useEffect, useEffectEvent, useRef } from "react";
import { acceptWebFrameMessage } from "@minigo/wallet-sdk/bridge-gate.ts";
import { inpageProvider } from "./inpage.generated";
import type { MiniAppFrameProps } from "./MiniAppFrame.types";

// On web a mini app runs in an iframe. Bundled pages get the provider prepended and run sandboxed. URL apps
// include examples/mini-app/public/minigo.js from the SDK themselves and must post from their own origin.
export function MiniAppFrame({ app, backgroundColor, onRequest }: MiniAppFrameProps) {
  const frame = useRef<HTMLIFrameElement>(null);
  const handleRequest = useEffectEvent(onRequest);
  const origin = app.origin;

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const target = frame.current?.contentWindow;
      if (!target || !acceptWebFrameMessage(event, target, origin)) return;
      handleRequest(event.data).then((response) => {
        if (response) target.postMessage(JSON.stringify(response), origin ?? "*");
      });
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [origin]);

  const style = { flex: 1, width: "100%", height: "100%", border: 0, backgroundColor };

  if ("uri" in app.source) {
    return (
      <iframe
        ref={frame}
        title={app.name}
        src={app.source.uri}
        sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        style={style}
      />
    );
  }

  return (
    <iframe
      ref={frame}
      title={app.name}
      srcDoc={app.source.html.replace("<head>", () => `<head><script>${inpageProvider}</script>`)}
      sandbox="allow-scripts"
      style={style}
    />
  );
}
