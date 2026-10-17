import { expect, it } from "vite-plus/test";

import { type AuthFormState, authFormReducer, initialAuthFormState } from "@/lib/auth-form-state";

const submit = (state: AuthFormState) =>
  authFormReducer(state, { type: "START", action: "submit" });
const demo = (state: AuthFormState) => authFormReducer(state, { type: "START", action: "demo" });

it("starts idle with nothing pending and no error", () => {
  expect(initialAuthFormState).toEqual({ status: "idle", pending: null, error: null });
});

it("marks the action in flight and clears the previous error", () => {
  const failed = authFormReducer(initialAuthFormState, {
    type: "FAIL",
    action: "submit",
    message: "Invalid credentials",
  });
  expect(submit(failed)).toEqual({
    status: "submitting",
    pending: "submit",
    error: null,
  });
});

it("keeps the two buttons distinguishable while submitting", () => {
  expect(demo(initialAuthFormState).pending).toBe("demo");
  expect(submit(initialAuthFormState).pending).toBe("submit");
});

it("clears pending and records the message on failure", () => {
  const next = authFormReducer(submit(initialAuthFormState), {
    type: "FAIL",
    action: "submit",
    message: "Sign in failed",
  });
  expect(next).toEqual({ status: "error", pending: null, error: "Sign in failed" });
});

// The double click this reducer exists for: the second request's failure must
// not relabel the button the first request already re-enabled.
it("drops a failure from an action that is no longer the pending one", () => {
  const state = submit(initialAuthFormState);
  expect(
    authFormReducer(state, { type: "FAIL", action: "demo", message: "Demo is unavailable" }),
  ).toBe(state);
});

it("returns the error state to idle on the next request", () => {
  const failed = authFormReducer(submit(initialAuthFormState), {
    type: "FAIL",
    action: "submit",
    message: "nope",
  });
  expect(demo(failed)).toEqual({ status: "submitting", pending: "demo", error: null });
});
