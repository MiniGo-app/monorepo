import { getRandomBytes } from "expo-crypto";
import { useRef, useState } from "react";
import { Linking, StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";
import { gateBridgeMessage, nonceScript } from "@minigo/wallet-sdk/bridge-gate.ts";
import { inpageProvider } from "./inpage.generated";
import type { MiniAppFrameProps } from "./MiniAppFrame.types";
import { originOf } from "./types";

// The SDK's provider (`window.mini`, SEP-43, plus the Freighter fallback) is injected before the page's own
// scripts. It posts requests through ReactNativeWebView; answers go back through window.__minigoHostResponse.
//
// Who is talking? A WebView delivers messages from the page and from every iframe inside it through one channel,
// and `event.nativeEvent.url` is not a reliable sender identity (on Android's fallback path it is the top-level
// URL for all frames). So the provider is injected into the main frame only, together with a secret nonce, and
// the gate below accepts a request only if it carries that nonce. See SECURITY_REVIEW.md and
// test-malicious-frame/.

const newNonce = () => Array.from(getRandomBytes(24), (byte) => byte.toString(16).padStart(2, "0")).join("");

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
// Touch plus a narrow screen also reads as a phone to those sites.
const noTouchPoints = "Object.defineProperty(Navigator.prototype,'maxTouchPoints',{get:function(){return 0}});";

// Mini apps get no camera or microphone. On Android, react-native-webview hands a page the camera without asking
// as soon as MiniGo itself holds the camera permission (it does, for scanning QR codes), so a page in a mini app
// could switch it on silently. This refuses those requests in the page. It covers the page's own scripts, not a
// page that deliberately reaches around it through a fresh iframe; see SECURITY_REVIEW.md.
const noMediaCapture =
  "(function(){var no=function(){return Promise.reject(new DOMException('Camera and microphone are not available in MiniGo mini apps.','NotAllowedError'))};" +
  "if(window.MediaDevices&&MediaDevices.prototype){try{Object.defineProperty(MediaDevices.prototype,'getUserMedia',{value:no,configurable:false});Object.defineProperty(MediaDevices.prototype,'getDisplayMedia',{value:no,configurable:false})}catch(e){}}" +
  "try{Object.defineProperty(Navigator.prototype,'getUserMedia',{value:undefined,configurable:false});Object.defineProperty(Navigator.prototype,'webkitGetUserMedia',{value:undefined,configurable:false})}catch(e){}})();";

export function MiniAppFrame({ app, backgroundColor, onRequest }: MiniAppFrameProps) {
  const webView = useRef<WebView>(null);
  const desktopMode = app.catalog?.desktopMode === true;
  // One per WebView instance; only the main frame ever receives it.
  const [nonce] = useState(newNonce);
  const [injected] = useState(() => noMediaCapture + (desktopMode ? noTouchPoints : "") + nonceScript(nonce) + inpageProvider);

  const handleMessage = (event: WebViewMessageEvent) => {
    const verdict = gateBridgeMessage(event.nativeEvent.data, originOf(event.nativeEvent.url), { nonce, appOrigin: app.origin });
    if (!verdict.ok) return;
    onRequest(verdict.raw).then((response) => {
      // JSON.stringify keeps the values inert.
      if (response) webView.current?.injectJavaScript(`window.__minigoHostResponse && window.__minigoHostResponse(${JSON.stringify(response)}); true;`);
    });
  };

  // Bundled pages stay put; URL apps may move around their own origin, and other links open in the browser.
  // Frames inside the page (iOS reports them here too) are allowed to load: they get no provider and no nonce, so
  // they can't reach the wallet, and only the top-level page is ever sent to the browser or blocked. about: and
  // data: pages are how a bundled page loads; a URL app has no reason to replace itself with one.
  const allowLoad = ({ url, isTopFrame }: Parameters<NonNullable<WebViewProps["onShouldStartLoadWithRequest"]>>[0]) => {
    if (isTopFrame === false) return true;
    if (!app.origin && /^(about|data):/i.test(url)) return true;
    if (app.origin && originOf(url) === app.origin) return true;
    if (/^https?:/i.test(url)) Linking.openURL(url).catch(() => {});
    return false;
  };

  return (
    <WebView
      ref={webView}
      accessibilityLabel={app.name}
      source={app.source}
      userAgent={desktopMode ? DESKTOP_USER_AGENT : undefined}
      originWhitelist={["*"]}
      onShouldStartLoadWithRequest={allowLoad}
      injectedJavaScriptBeforeContentLoaded={injected}
      injectedJavaScriptBeforeContentLoadedForMainFrameOnly
      injectedJavaScriptForMainFrameOnly
      onMessage={handleMessage}
      setSupportMultipleWindows={false}
      mediaCapturePermissionGrantType="deny"
      geolocationEnabled={false}
      allowsInlineMediaPlayback
      style={[styles.webView, { backgroundColor }]}
    />
  );
}

const styles = StyleSheet.create({
  webView: { flex: 1 },
});
