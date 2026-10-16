import { useReducer } from "react";
import { toast } from "sonner";

import { asyncReducer, initialAsyncState } from "@/lib/async-state";

const useFetch = <A extends unknown[], R>(
  cb: (...args: A) => Promise<R>,
  // Kept as a shape rather than an interface so callers see exactly what the hook returns.
): {
  data: R | undefined;
  loading: boolean;
  error: Error | null;
  fn: (...args: A) => Promise<R | undefined>;
  setData: (data: R | undefined) => void;
} => {
  // The state machine lives in lib/async-state.ts; this hook only dispatches into it,
  // so the transitions stay testable without React.
  const [state, dispatch] = useReducer(asyncReducer<R>, initialAsyncState<R>());

  const fn = async (...args: A) => {
    dispatch({ type: "START" });
    try {
      const data = await cb(...args);
      dispatch({ type: "SUCCESS", data });
      return data;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      dispatch({ type: "ERROR", error: err });
      toast.error(err.message);
      return undefined;
    }
  };

  return {
    data: state.data,
    loading: state.status === "loading",
    error: state.error,
    fn,
    setData: (data: R | undefined) => dispatch({ type: "SET_DATA", data }),
  };
};

export default useFetch;
