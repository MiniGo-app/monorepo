import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

// The OAuth web client from the MiniGo Google Cloud project. Google needs it to hand the app an access token; the
// Android client (package app.minigo.wallet and its signing key's SHA-1) is matched by Google, not set here.
const WEB_CLIENT_ID = "239911896721-15u7ksqev7t6jhsacbk408jmu8eg07ri.apps.googleusercontent.com";
// Only MiniGo's own hidden folder in Drive; it can't see the user's other files.
const DRIVE_APPDATA = "https://www.googleapis.com/auth/drive.appdata";

// Google sign-in is native code, so it runs in Android builds but not in Expo Go or the web preview.
export const googleSignInAvailable =
  Platform.OS === "android" && Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

// A sign-in problem the user can act on; its message is shown as is.
export class CloudSignInError extends Error {}

type GoogleSignInModule = typeof import("@react-native-google-signin/google-signin");
let loaded: GoogleSignInModule | null = null;

// Loaded on first use: importing it where the native module is missing would crash the app.
function google(): GoogleSignInModule {
  if (!loaded) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- a top-level import would crash Expo Go
    loaded = require("@react-native-google-signin/google-signin") as GoogleSignInModule;
    loaded.GoogleSignin.configure({ webClientId: WEB_CLIENT_ID, scopes: [DRIVE_APPDATA] });
  }
  return loaded;
}

/** A Drive access token, signing in first if needed: silently with the account used last time, otherwise by asking. */
export async function driveAccessToken(): Promise<string> {
  const { GoogleSignin, isSuccessResponse, isErrorWithCode, statusCodes } = google();
  try {
    if (!GoogleSignin.getCurrentUser() && (await GoogleSignin.signInSilently()).type !== "success") {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      if (!isSuccessResponse(await GoogleSignin.signIn())) throw new CloudSignInError("Google sign-in was cancelled.");
    }
    // An account that signed in without granting Drive access is asked for it now.
    if (!GoogleSignin.getCurrentUser()?.scopes.includes(DRIVE_APPDATA)) {
      const added = await GoogleSignin.addScopes({ scopes: [DRIVE_APPDATA] });
      if (!added || !isSuccessResponse(added)) throw new CloudSignInError("MiniGo needs access to its Google Drive folder to back up.");
    }
    return (await GoogleSignin.getTokens()).accessToken;
  } catch (error) {
    if (error instanceof CloudSignInError) throw error;
    if (isErrorWithCode(error) && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      throw new CloudSignInError("Backing up to Google Drive needs Google Play services on this phone.");
    }
    throw error;
  }
}

/** Drops a token Drive rejected, so the next `driveAccessToken` gets a fresh one. */
export async function forgetDriveToken(token: string) {
  await google().GoogleSignin.clearCachedAccessToken(token).catch(() => {});
}

/** Forgets the signed-in Google account, so the next backup or restore asks which account to use. */
export async function signOutOfGoogle() {
  if (!googleSignInAvailable) return;
  await google().GoogleSignin.signOut().catch(() => {});
}
