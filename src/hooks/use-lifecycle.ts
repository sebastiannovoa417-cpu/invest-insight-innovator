import type { UseQueryResult } from "@tanstack/react-query";

/**
 * Lifecycle phases for any TanStack Query-backed data hook.
 *
 * idle       → query is disabled / has never been run
 * loading    → first fetch is in-flight (no cached data yet)
 * refreshing → a background re-fetch is running while stale data is shown
 * success    → data is available (may be stale)
 * error      → fetch failed and no usable data is available
 */
export type LifecyclePhase = "idle" | "loading" | "refreshing" | "success" | "error";

/**
 * useLifecycle — derives a single, human-readable lifecycle phase from a
 * TanStack Query result so that every component in the app uses the same
 * language when talking about data state.
 *
 * Usage:
 *   const query = useStocks();
 *   const phase = useLifecycle(query);
 *   // phase === "loading" | "refreshing" | "success" | "error" | "idle"
 */
export function useLifecycle<TData, TError = Error>(
  query: Pick<
    UseQueryResult<TData, TError>,
    "status" | "fetchStatus" | "data" | "error"
  >,
): LifecyclePhase {
  const { status, fetchStatus, data } = query;

  // Query is disabled (e.g. requires auth that is not yet available)
  if (status === "pending" && fetchStatus === "idle") return "idle";

  // First fetch — no data in cache yet
  if (status === "pending" && fetchStatus === "fetching") return "loading";

  // Re-fetching in the background while serving stale data
  if (status === "success" && fetchStatus === "fetching") return "refreshing";

  // Data is available
  if (status === "success") return "success";

  // Fetch failed — no usable data
  if (status === "error") return "error";

  // Fetch is paused (e.g., device is offline)
  if (status === "pending" && fetchStatus === "paused") return "loading";

  // Fallback — treat anything else as still loading
  return "loading";
}
