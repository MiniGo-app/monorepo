import assert from "node:assert/strict";
import { test } from "node:test";
import { MAX_OPEN_APPS, close, launch, minimize, switchTo, type OpenAppsState } from "../src/mini/openAppsCore.ts";

type App = { id: string; version?: number };
const empty: OpenAppsState<App> = { apps: [], activeId: null };
const ids = (state: OpenAppsState<App>) => state.apps.map((app) => app.id);

test("launching opens the app on screen, most recent first", () => {
  let state = launch(empty, { id: "a" }).state;
  state = launch(state, { id: "b" }).state;
  assert.deepEqual(ids(state), ["b", "a"]);
  assert.equal(state.activeId, "b");
});

test("launching an open app brings back the running instance instead of a new one", () => {
  let state = launch(empty, { id: "a", version: 1 }).state;
  state = launch(state, { id: "b" }).state;
  state = launch(state, { id: "a", version: 2 }).state;
  assert.deepEqual(ids(state), ["a", "b"]);
  assert.equal(state.apps[0].version, 1);
});

test(`past ${MAX_OPEN_APPS} apps the least recently used one closes`, () => {
  let state = empty;
  for (const id of ["a", "b", "c"]) state = launch(state, { id }).state;
  state = switchTo(state, "a");
  const result = launch(state, { id: "d" });
  assert.equal(result.closed?.id, "b");
  assert.deepEqual(ids(result.state), ["d", "a", "c"]);
});

test("an app waiting for the user's approval is closed last", () => {
  let state = empty;
  for (const id of ["a", "b", "c"]) state = launch(state, { id }).state;
  const result = launch(state, { id: "d" }, (id) => id === "a");
  assert.equal(result.closed?.id, "b");
  const allWaiting = launch(state, { id: "d" }, () => true);
  assert.equal(allWaiting.closed?.id, "a");
});

test("minimize hides the app but keeps it open; close removes it", () => {
  let state = launch(launch(empty, { id: "a" }).state, { id: "b" }).state;
  state = minimize(state);
  assert.equal(state.activeId, null);
  assert.deepEqual(ids(state), ["b", "a"]);
  state = switchTo(state, "a");
  assert.equal(state.activeId, "a");
  state = close(state, "b");
  assert.deepEqual(ids(state), ["a"]);
  assert.equal(state.activeId, "a");
  state = close(state, "a");
  assert.deepEqual(state, { apps: [], activeId: null });
});

test("switching to an app that isn't open changes nothing", () => {
  const state = launch(empty, { id: "a" }).state;
  assert.equal(switchTo(state, "zzz"), state);
});
