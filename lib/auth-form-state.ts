export type AuthAction = "submit" | "demo" | "resend";

export type AuthStatus = "idle" | "submitting" | "error" | "awaiting-verification";

export type AuthFormState = {
  status: AuthStatus;
  pending: AuthAction | null;
  error: string | null;
};

export type AuthFormEvent =
  | { type: "START"; action: AuthAction }
  | { type: "FAIL"; action: AuthAction; message: string }
  | { type: "AWAITING" }
  | { type: "RESEND_START" }
  | { type: "RESEND_SENT" };

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
      if (state.pending !== event.action) return state;
      return { status: "error", pending: null, error: event.message };
    case "AWAITING":
      return { status: "awaiting-verification", pending: null, error: null };
    case "RESEND_START":
      return { ...state, pending: "resend" };
    case "RESEND_SENT":
      return { ...state, pending: null };
  }
}
