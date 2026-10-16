export type AsyncStatus = "idle" | "loading" | "success" | "error";

export type AsyncState<T> = {
  status: AsyncStatus;
  data: T | undefined;
  error: Error | null;
};

export type AsyncAction<T> =
  | { type: "START" }
  | { type: "SUCCESS"; data: T }
  | { type: "ERROR"; error: Error }
  | { type: "SET_DATA"; data: T | undefined };

export const initialAsyncState = <T>(): AsyncState<T> => ({
  status: "idle",
  data: undefined,
  error: null,
});

// Events leave `data` in place on failure and on start, so a refetch keeps the
// last successful value on screen instead of blanking it.
export function asyncReducer<T>(state: AsyncState<T>, action: AsyncAction<T>): AsyncState<T> {
  switch (action.type) {
    case "START":
      return { status: "loading", data: state.data, error: null };
    case "SUCCESS":
      return { status: "success", data: action.data, error: null };
    case "ERROR":
      return { status: "error", data: state.data, error: action.error };
    case "SET_DATA":
      return { ...state, data: action.data };
  }
}
