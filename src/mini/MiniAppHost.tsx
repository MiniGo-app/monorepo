import { ChevronDown, Ellipsis, ExternalLink, RefreshCw, Unplug, X } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Linking, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { TOO_MANY_PENDING, externalError, userRejected } from "@minigo/wallet-sdk/core/errors.ts";
import { handleRequest, type ApprovalRequest, type HostContext } from "@minigo/wallet-sdk/host.ts";
import { ConnectSheet } from "@/components/ConnectSheet";
import { HostedAppIcon } from "@/components/HostedAppIcon";
import { ListCard } from "@/components/ListCard";
import { PaymentSheet } from "@/components/PaymentSheet";
import { Row } from "@/components/Row";
import { Sheet } from "@/components/Sheet";
import { SignSheet } from "@/components/SignSheet";
import { Text } from "@/components/Text";
import { useToast } from "@/components/Toast";
import { formatAmount } from "@/stellar/assets";
import { NETWORK } from "@/stellar/network";
import { useTheme } from "@/theme/ThemeProvider";
import { KeyAccessError } from "@/wallet/phraseStoreCore";
import { useWallet, useWalletData } from "@/wallet/WalletProvider";
import { MiniAppFrame } from "./MiniAppFrame";
import { useOpenApps } from "./openAppsContext";
import type { HostedApp } from "./types";

const SPLASH_MS = 1200;
const SLOW_METHODS = ["requestPayment", "signTransaction", "signAuthEntry", "signMessage"];

const methodOf = (raw: unknown) => {
  try {
    const data = typeof raw === "string" ? JSON.parse(raw) : raw;
    return typeof data?.method === "string" ? (data.method as string) : undefined;
  } catch {
    return undefined;
  }
};

type Approval = { request: ApprovalRequest; resolve: (approved: boolean) => void };

// Runs a mini app and answers its wallet requests with the SDK's host (the same code the browser extension
// uses): permission per app, validation, the user's approval, signing and submitting to the network.
// It stays mounted while minimized or while another app is on screen (see OpenApps.tsx); `active` says whether it
// is the one on screen. Approval sheets only ever show for the app on screen.
export function MiniAppHost({ app, active }: { app: HostedApp; active: boolean }) {
  const { colors } = useTheme();
  const toast = useToast();
  const insets = useSafeAreaInsets();
  const { close, minimize, openSwitcher, setWaiting } = useOpenApps();
  const { connectApp, disconnectApp, getKeypair, noteAppPayment, refresh } = useWallet();
  const { address, connectedApps } = useWalletData();
  const connected = connectedApps.some((item) => item.id === app.id);
  const [loading, setLoading] = useState(true);
  const [frameKey, setFrameKey] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [approval, setApproval] = useState<Approval | null>(null);
  // Requests that are being checked, signed or sent (so the wallet can say it's busy instead of looking idle).
  const [working, setWorking] = useState(0);
  const queue = useRef<Approval[]>([]);
  // Requests already in flight read the live connection state, not the one from when they arrived.
  const connectedRef = useRef(connected);
  const activeRef = useRef(active);

  useEffect(() => {
    connectedRef.current = connected;
  }, [connected]);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), SPLASH_MS);
    const pending = queue.current;
    return () => {
      clearTimeout(timer);
      // Closing the app declines whatever it was still asking for.
      pending.splice(0).forEach((item) => item.resolve(false));
    };
  }, []);

  // One approval on screen at a time; the rest wait their turn.
  const decide = (approved: boolean) => {
    const current = queue.current.shift();
    current?.resolve(approved);
    setApproval(queue.current[0] ?? null);
    setWaiting(app.id, queue.current.length);
  };

  const context: HostContext = {
    network: NETWORK,
    address: async () => address,
    // The user has approved by now; with device protection the system asks for biometrics here. A refusal or a
    // key the phone no longer opens becomes an answer the mini app (and the toast below) can act on.
    keypair: async () => {
      try {
        return await getKeypair(`Approve for ${app.name}`);
      } catch (error) {
        if (error instanceof KeyAccessError) throw error.reason === "cancelled" ? userRejected() : externalError(error.message);
        throw error;
      }
    },
    isAllowed: async () => connectedRef.current,
    allow: async () => {
      if (connectedRef.current) return;
      connectedRef.current = true;
      connectApp({ id: app.id, name: app.name, origin: app.origin });
      toast(`${app.name} connected to your wallet`);
    },
    approve: (request) =>
      new Promise<boolean>((resolve) => {
        // A second connect prompt that queued up behind an approved one has nothing left to ask.
        if (request.kind === "connect" && connectedRef.current) return resolve(true);
        queue.current.push({ request, resolve });
        if (queue.current.length === 1) setApproval(queue.current[0]);
        setWaiting(app.id, queue.current.length);
        // An app in the background can ask, but it waits until the user switches to it.
        if (!activeRef.current && queue.current.length === 1) toast(`${app.name} is waiting for your approval`);
      }),
    onPayment: ({ hash, amount, assetCode }) => {
      noteAppPayment(hash, { appId: app.id, appName: app.name });
      toast(`Paid ${formatAmount(assetCode, Number(amount))}`);
      refresh();
    },
  };

  // Catalogue apps are known by id; URL apps by their origin, which the frame has already checked.
  const onRequest = async (raw: unknown) => {
    const method = methodOf(raw);
    const slow = method !== undefined && SLOW_METHODS.includes(method);
    if (slow) setWorking((count) => count + 1);
    try {
      const response = await handleRequest(context, app.origin ?? `app:${app.id}`, raw);
      // The mini app hears every outcome, but only a decline is silent here: anything else the user should see
      // in the wallet too, since the page may not say.
      // A site that floods requests is refused quietly: it already has prompts waiting, and toasting each refusal
      // would let it spam the wallet's UI instead.
      if (slow && response?.error && response.error.code !== -4 && response.error.ext?.[0] !== TOO_MANY_PENDING) {
        toast(response.error.ext?.[0] && response.error.code === -3 ? response.error.ext[0] : response.error.message);
      }
      return response;
    } finally {
      if (slow) setWorking((count) => count - 1);
    }
  };

  const request = approval?.request ?? null;

  return (
    <View style={[styles.screen, { backgroundColor: colors.bg, paddingTop: insets.top + 8 }]}>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel={`Close ${app.name}`} onPress={() => close(app.id)} style={[styles.pill, styles.close, { borderColor: colors.line }]}>
          <X size={16} color={colors.ink} strokeWidth={2} />
          <Text weight="medium" size={14}>
            Close
          </Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${app.name}, switch app`}
          onPress={openSwitcher}
          style={styles.titleButton}
        >
          <HostedAppIcon app={app} size={22} radius={6} glyphSize={14} />
          <Text weight="semibold" tracking={-0.01} numberOfLines={1} style={styles.shrink}>
            {app.name}
          </Text>
          <ChevronDown size={14} color={colors.muted} strokeWidth={2.2} />
        </Pressable>

        <View style={[styles.pill, { borderColor: colors.line }]}>
          <Pressable accessibilityRole="button" accessibilityLabel="Minimize" onPress={minimize} style={styles.minimize}>
            <ChevronDown size={17} color={colors.ink} strokeWidth={2} />
          </Pressable>
          <Pressable accessibilityRole="button" accessibilityLabel="More options" onPress={() => setMenuOpen(true)} style={styles.more}>
            <Ellipsis size={17} color={colors.ink} strokeWidth={2} />
          </Pressable>
        </View>
      </View>

      <View style={[styles.frame, { backgroundColor: colors.frame, borderColor: colors.line, marginBottom: Math.max(insets.bottom, 12) }]}>
        <MiniAppFrame
          key={frameKey}
          app={app}
          backgroundColor={app.catalog?.id === "healthconnect" ? colors.partner.bg : colors.frame}
          onRequest={onRequest}
        />
        {loading && <Splash app={app} />}
        {working > 0 && !approval && (
          <View pointerEvents="none" style={styles.workingWrap}>
            <View accessibilityLiveRegion="polite" style={[styles.working, { backgroundColor: colors.primary }]}>
              <ActivityIndicator size="small" color={colors.onPrimary} />
              <Text size={13} weight="medium" color={colors.onPrimary}>
                Working on it…
              </Text>
            </View>
          </View>
        )}
      </View>

      <ConnectSheet app={app} visible={active && request?.kind === "connect"} onCancel={() => decide(false)} onConnect={() => decide(true)} />
      <PaymentSheet app={app} request={active && request?.kind === "payment" ? request : null} onDecline={() => decide(false)} onApprove={() => decide(true)} />
      <SignSheet
        app={app}
        request={active && request && request.kind !== "connect" && request.kind !== "payment" ? request : null}
        onDecline={() => decide(false)}
        onApprove={() => decide(true)}
      />

      <Sheet visible={active && menuOpen} onClose={() => setMenuOpen(false)}>
        <View style={styles.menuHead}>
          <HostedAppIcon app={app} size={40} radius={12} glyphSize={18} />
          <View style={styles.shrink}>
            <Text weight="semibold">{app.name}</Text>
            <Text size={12.5} color={colors.muted} numberOfLines={1}>
              {app.origin ?? `By ${app.developer}`}
            </Text>
          </View>
        </View>
        <ListCard>
          <Row
            icon={RefreshCw}
            label="Reload"
            chevron={false}
            onPress={() => {
              setMenuOpen(false);
              setFrameKey((key) => key + 1);
            }}
          />
          {connected && (
            <Row
              icon={Unplug}
              label="Disconnect wallet"
              chevron={false}
              onPress={() => {
                setMenuOpen(false);
                disconnectApp(app.id);
                toast(`${app.name} disconnected`);
              }}
            />
          )}
          {"uri" in app.source && (
            <Row
              icon={ExternalLink}
              label="Open in browser"
              chevron={false}
              onPress={() => {
                setMenuOpen(false);
                if ("uri" in app.source) Linking.openURL(app.source.uri).catch(() => {});
              }}
            />
          )}
        </ListCard>
      </Sheet>
    </View>
  );
}

function Splash({ app }: { app: HostedApp }) {
  const { colors } = useTheme();
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(progress, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    loop.start();
    return () => loop.stop();
  }, [progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-52, 120] });

  return (
    <View
      accessibilityLabel={`Opening ${app.name}`}
      accessibilityState={{ busy: true }}
      style={[StyleSheet.absoluteFill, styles.splash, { backgroundColor: colors.frame }]}
    >
      <View style={styles.splashCenter}>
        <HostedAppIcon app={app} size={88} radius={24} glyphSize={36} />
        <Text weight="semibold" size={17} tracking={-0.01} style={styles.splashName}>
          {app.name}
        </Text>
        <View style={[styles.track, { backgroundColor: colors.line }]}>
          <Animated.View style={[styles.bar, { backgroundColor: colors.ink, transform: [{ translateX }] }]} />
        </View>
      </View>
      <Text size={12.5} color={colors.muted} style={styles.credit}>
        Built by{" "}
        <Text weight="semibold" size={12.5} color={colors.label}>
          {app.developer}
        </Text>
        {"\n"}Provided under their terms and conditions
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  shrink: { flexShrink: 1 },
  header: { paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  pill: { height: 40, borderRadius: 999, borderWidth: 1, flexDirection: "row", alignItems: "center" },
  close: { paddingLeft: 12, paddingRight: 14, gap: 6 },
  titleButton: { flexShrink: 1, flexDirection: "row", alignItems: "center", gap: 7 },
  minimize: { height: "100%", justifyContent: "center", paddingLeft: 12, paddingRight: 6 },
  more: { height: "100%", justifyContent: "center", paddingLeft: 6, paddingRight: 12 },
  frame: { flex: 1, marginHorizontal: 10, marginTop: 14, borderRadius: 28, borderWidth: 1, overflow: "hidden" },
  workingWrap: { position: "absolute", left: 0, right: 0, bottom: 16, alignItems: "center" },
  working: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 10 },
  splash: { justifyContent: "space-between" },
  splashCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  splashName: { marginTop: 16 },
  track: { marginTop: 14, width: 120, height: 4, borderRadius: 2, overflow: "hidden" },
  bar: { width: 52, height: 4, borderRadius: 2 },
  credit: { paddingBottom: 28, textAlign: "center", lineHeight: 20 },
  menuHead: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 8, paddingBottom: 4 },
});
