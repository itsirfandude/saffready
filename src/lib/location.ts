export type LocationState = "idle" | "loading" | "ready" | "error" | "permission-denied" | "timeout" | "unsupported";

export function locationFailureState(code: number): Extract<LocationState, "error" | "permission-denied" | "timeout"> {
  if (code === 1) return "permission-denied";
  if (code === 3) return "timeout";
  return "error";
}
