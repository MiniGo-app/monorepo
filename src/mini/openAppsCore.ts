// Which mini apps are open, most recent first. No React here so the tests can run it in Node.

// Each open app is a live WebView, so this is about memory on low-end phones.
export const MAX_OPEN_APPS = 3;

export type OpenApp = { id: string };
export type OpenAppsState<A extends OpenApp> = { apps: A[]; activeId: string | null };

const toFront = <A extends OpenApp>(apps: A[], app: A) => [app, ...apps.filter((item) => item.id !== app.id)];

// Past the limit the least recently used app closes, preferring one that isn't waiting on the user.
export function launch<A extends OpenApp>(state: OpenAppsState<A>, app: A, waiting: (id: string) => boolean = () => false): { state: OpenAppsState<A>; closed: A | null } {
  const existing = state.apps.find((item) => item.id === app.id);
  let apps = toFront(state.apps, existing ?? app);
  let closed: A | null = null;
  if (apps.length > MAX_OPEN_APPS) {
    const candidates = apps.slice(1);
    closed = [...candidates].reverse().find((item) => !waiting(item.id)) ?? candidates[candidates.length - 1];
    apps = apps.filter((item) => item !== closed);
  }
  return { state: { apps, activeId: app.id }, closed };
}

export function switchTo<A extends OpenApp>(state: OpenAppsState<A>, id: string): OpenAppsState<A> {
  const app = state.apps.find((item) => item.id === id);
  return app ? { apps: toFront(state.apps, app), activeId: id } : state;
}

export const minimize = <A extends OpenApp>(state: OpenAppsState<A>): OpenAppsState<A> => ({ ...state, activeId: null });

export function close<A extends OpenApp>(state: OpenAppsState<A>, id: string): OpenAppsState<A> {
  return { apps: state.apps.filter((item) => item.id !== id), activeId: state.activeId === id ? null : state.activeId };
}
