import type { UseQueryResult } from "@tanstack/react-query";

export type LifecyclePhase = "idle" | "loading" | "refreshing" | "success" | "error";

export function getLifecyclePhase<TData, TError = Error>(
  query: Pick<UseQueryResult<TData, TError>, "status" | "fetchStatus">,
): LifecyclePhase {
  const { status, fetchStatus } = query;

  if (status === "pending" && fetchStatus === "idle") return "idle";
  if (status === "pending" && (fetchStatus === "fetching" || fetchStatus === "paused")) return "loading";
  if (status === "success" && fetchStatus === "fetching") return "refreshing";
  if (status === "success") return "success";
  if (status === "error") return "error";

  return "loading";
}
