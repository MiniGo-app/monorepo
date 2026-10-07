import { getRandomBytes } from "expo-crypto";
import { useRef, useState } from "react";
import { Linking, StyleSheet } from "react-native";
import { WebView, type WebViewMessageEvent, type WebViewProps } from "react-native-webview";
import { gateBridgeMessage, nonceScript } from "@minigo/wallet-sdk/bridge-gate.ts";
import { inpageProvider } from "./inpage.generated";
import type { MiniAppFrameProps } from "./MiniAppFrame.types";
import { originOf } from "./types";

// The provider is injected into the main frame only, with a secret nonce. Messages from iframes come through
// the same channel and the URL that comes with them can't be trusted, so the gate drops anything without it.

const newNonce = () => Array.from(getRandomBytes(24), (byte) => byte.toString(16).padStart(2, "0")).join("");

const DESKTOP_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
// Some sites treat touch plus a narrow screen as a phone too.
const noTouchPoints = "Object.defineProperty(Navigator.prototype,'maxTouchPoints',{get:function(){return 0}});";

// On Android the WebView hands a page the camera without asking once MiniGo has camera permission, which it does
// for QR codes. The real block is native: patches/react-native-webview+13.16.1.patch refuses every frame's camera
// and microphone request. This also refuses them in the page, so the page gets a clear error. See SECURITY_REVIEW.md.
const noMediaCapture =
  "(function(){var no=function(){return Promise.reject(new DOMException('Camera and microphone are not available in MiniGo mini apps.','NotAllowedError'))};" +
  "if(window.MediaDevices&&MediaDevices.prototype){try{Object.defineProperty(MediaDevices.prototype,'getUserMedia',{value:no,configurable:false});Object.defineProperty(MediaDevices.prototype,'getDisplayMedia',{value:no,configurable:false})}catch(e){}}" +
  "try{Object.defineProperty(Navigator.prototype,'getUserMedia',{value:undefined,configurable:false});Object.defineProperty(Navigator.prototype,'webkitGetUserMedia',{value:undefined,configurable:false})}catch(e){}})();";

export function MiniAppFrame({ app, backgroundColor, onRequest }: MiniAppFrameProps) {
  const webView = useRef<WebView>(null);
  const desktopMode = app.catalog?.desktopMode === true;
  const [nonce] = useState(newNonce);
  const [injected] = useState(() => noMediaCapture + (desktopMode ? noTouchPoints : "") + nonceScript(nonce) + inpageProvider);

  const handleMessage = (event: WebViewMessageEvent) => {
    const verdict = gateBridgeMessage(event.nativeEvent.data, originOf(event.nativeEvent.url), { nonce, appOrigin: app.origin });
    if (!verdict.ok) return;
    onRequest(verdict.raw).then((response) => {
      if (response) webView.current?.injectJavaScript(`window.__minigoHostResponse && window.__minigoHostResponse(${JSON.stringify(response)}); true;`);
    });
  };

  // Bundled pages stay put, URL apps stay on their origin and other links open in the browser. Iframes may load
  // since they never get the nonce.
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
