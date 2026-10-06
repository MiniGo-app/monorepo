// Web preview only: browsers have no secure enclave, so secrets fall back to localStorage. Never ship
// the wallet on web with this.
const prefix = "minigo-dev-vault:";

export const vault = {
  get: async (key: string) => {
    try {
      return localStorage.getItem(prefix + key);
    } catch {
      return null;
    }
  },
  set: async (key: string, value: string) => {
    localStorage.setItem(prefix + key, value);
  },
  remove: async (key: string) => {
    try {
      localStorage.removeItem(prefix + key);
    } catch {}
  },
};
