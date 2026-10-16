import { expect, it } from "vite-plus/test";

import { asyncReducer, initialAsyncState } from "@/lib/async-state";

it("idle has no data and no error", () => {
  expect(initialAsyncState<number>()).toEqual({ status: "idle", data: undefined, error: null });
});

it("START moves to loading and clears a previous error", () => {
  const failed = asyncReducer(initialAsyncState<number>(), {
    type: "ERROR",
    error: new Error("boom"),
  });
  const loading = asyncReducer(failed, { type: "START" });
  expect(loading.status).toBe("loading");
  expect(loading.error).toBeNull();
});

it("SUCCESS stores data and clears the error", () => {
  const loading = asyncReducer(initialAsyncState<number>(), { type: "START" });
  const done = asyncReducer(loading, { type: "SUCCESS", data: 42 });
  expect(done).toEqual({ status: "success", data: 42, error: null });
});

it("ERROR keeps the last data so a failed refetch does not blank the view", () => {
  const withData = asyncReducer(initialAsyncState<number>(), { type: "SUCCESS", data: 7 });
  const errored = asyncReducer(withData, { type: "ERROR", error: new Error("nope") });
  expect(errored.status).toBe("error");
  expect(errored.data).toBe(7);
  expect(errored.error?.message).toBe("nope");
});

it("SET_DATA changes only data, leaving status and error untouched", () => {
  const errored = asyncReducer(initialAsyncState<number>(), {
    type: "ERROR",
    error: new Error("nope"),
  });
  const patched = asyncReducer(errored, { type: "SET_DATA", data: 5 });
  expect(patched.data).toBe(5);
  expect(patched.status).toBe("error");
  expect(patched.error?.message).toBe("nope");
});
