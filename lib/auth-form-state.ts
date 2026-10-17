/**
 * Sign-in form state. One reducer so `pending` and `error` cannot disagree: a
 * request clears the error, and only the request still in flight may report a
 * failure.
 */

export type AuthAction = "submit" | "demo";

export type AuthStatus = "idle" | "submitting" | "error";

export type AuthFormState = {
  status: AuthStatus;
  /** The action in flight, so each button can carry its own label. */
  pending: AuthAction | null;
  error: string | null;
};

export type AuthFormEvent =
  | { type: "START"; action: AuthAction }
  | { type: "FAIL"; action: AuthAction; message: string };

export const initialAuthFormState: AuthFormState = {
  status: "idle",
  pending: null,
  error: null,
};

export function authFormReducer(state: AuthFormState, event: AuthFormEvent): AuthFormState {
  switch (event.type) {
    case "START":
      return { status: "submitting", pending: event.action, error: null };
    case "FAIL":
      // A late failure from a request the user has already replaced is dropped:
      // it would otherwise relabel the button they are using now.
      if (state.pending !== event.action) return state;
      return { status: "error", pending: null, error: event.message };
  }
}
