import type { HostResponse } from "@minigo/wallet-sdk/protocol.ts";
import type { HostedApp } from "./types";

export type MiniAppFrameProps = {
  app: HostedApp;
  backgroundColor: string;
  // A raw message from the page's `window.mini` provider. Resolves with the answer to send back, or null
  // when the message isn't a wallet request (it is then ignored).
  onRequest: (raw: unknown) => Promise<HostResponse | null>;
};
