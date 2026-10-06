import { isBackupFile, type BackupFile } from "@/wallet/backup";
import { BACKUP_FILE_NAME, type CloudAdapter } from "@/wallet/cloud";

// Google Drive adapter for Android. Files go to the app-private `appDataFolder`, which the user can't
// browse and other apps can't read. `getAccessToken` must return an OAuth token with the
// `https://www.googleapis.com/auth/drive.appdata` scope, e.g. from @react-native-google-signin
// (needs a development build and an OAuth client). Wire it up with:
//   setCloudAdapter(googleDriveAdapter(() => GoogleSignin.getTokens().then((t) => t.accessToken)))
// Not yet exercised against the live API.

const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";

export function googleDriveAdapter(getAccessToken: () => Promise<string>): CloudAdapter {
  const request = async (url: string, init: RequestInit = {}) => {
    const token = await getAccessToken();
    const response = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
    if (!response.ok) throw new Error(`Google Drive request failed (${response.status})`);
    return response;
  };

  const findFileId = async () => {
    const query = encodeURIComponent(`name = '${BACKUP_FILE_NAME}' and trashed = false`);
    const response = await request(`${API}?spaces=appDataFolder&q=${query}&fields=files(id)&pageSize=1`);
    const body = (await response.json()) as { files?: { id: string }[] };
    return body.files?.[0]?.id ?? null;
  };

  return {
    live: true,
    async save(file) {
      const existing = await findFileId();
      const boundary = `minigo-${Date.now()}`;
      const metadata = existing ? {} : { name: BACKUP_FILE_NAME, parents: ["appDataFolder"] };
      const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(file)}\r\n--${boundary}--`;
      await request(existing ? `${UPLOAD}/${existing}?uploadType=multipart` : `${UPLOAD}?uploadType=multipart`, {
        method: existing ? "PATCH" : "POST",
        headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
        body,
      });
    },
    async load(): Promise<BackupFile | null> {
      const id = await findFileId();
      if (!id) return null;
      const parsed: unknown = await (await request(`${API}/${id}?alt=media`)).json();
      return isBackupFile(parsed) ? parsed : null;
    },
    async remove() {
      const id = await findFileId();
      if (id) await request(`${API}/${id}`, { method: "DELETE" });
    },
  };
}
