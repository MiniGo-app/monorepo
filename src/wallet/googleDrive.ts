import { isBackupFile, type BackupFile } from "@/wallet/backup";
import type { CloudAdapter } from "@/wallet/cloud";

// Saves to the hidden appDataFolder. `getAccessToken` needs the drive.appdata scope (see googleAuth.ts).
// Not tried against the live API yet.

const API = "https://www.googleapis.com/drive/v3/files";
const UPLOAD = "https://www.googleapis.com/upload/drive/v3/files";
export const BACKUP_FILE_NAME = "minigo-wallet-backup.json";

export function googleDriveAdapter(getAccessToken: () => Promise<string>, forgetToken?: (token: string) => Promise<void>): CloudAdapter {
  const request = async (url: string, init: RequestInit = {}) => {
    const send = async () => {
      const token = await getAccessToken();
      const response = await fetch(url, { ...init, headers: { ...init.headers, Authorization: `Bearer ${token}` } });
      return { token, response };
    };
    let attempt = await send();
    // A cached token can expire; drop it and try once more with a fresh one.
    if (attempt.response.status === 401 && forgetToken) {
      await forgetToken(attempt.token);
      attempt = await send();
    }
    if (!attempt.response.ok) throw new Error(`Google Drive request failed (${attempt.response.status})`);
    return attempt.response;
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
