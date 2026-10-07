import type { HostResponse } from "@minigo/wallet-sdk/protocol.ts";
import type { HostedApp } from "./types";

export type MiniAppFrameProps = {
  app: HostedApp;
  backgroundColor: string;
  // Resolves with the answer to send back, or null to ignore the message.
  onRequest: (raw: unknown) => Promise<HostResponse | null>;
};
