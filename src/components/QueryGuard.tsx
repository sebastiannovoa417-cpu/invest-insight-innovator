import { ReactNode } from "react";
import { Loader2, AlertTriangle, Inbox } from "lucide-react";
import type { UseQueryResult } from "@tanstack/react-query";
import { useLifecycle } from "@/hooks/use-lifecycle";

interface QueryGuardProps<TData, TError = Error> {
  /** The TanStack Query result object from any useQuery() call */
  query: Pick<UseQueryResult<TData, TError>, "status" | "fetchStatus" | "data" | "error">;
  /** Rendered when data is ready. Receives the resolved (non-null) data. */
  children: (data: TData) => ReactNode;
  /** Rendered while the first fetch is in-flight. Defaults to a spinner. */
  loadingFallback?: ReactNode;
  /** Rendered when the fetch has failed and no data is available. Defaults to an error card. */
  errorFallback?: ReactNode | ((error: TError | null) => ReactNode);
  /** Rendered when data is an empty array / null / undefined after a successful fetch. */
  emptyFallback?: ReactNode;
  /** Called to determine whether the data should be treated as "empty". */
  isEmpty?: (data: TData) => boolean;
  /** Label shown in the default loading spinner */
  loadingLabel?: string;
}

function DefaultLoading({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 p-8 text-muted-foreground text-sm">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span>{label ?? "Loading…"}</span>
    </div>
  );
}

function DefaultError({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-destructive/30 bg-card p-8 text-center">
      <AlertTriangle className="w-6 h-6 text-destructive opacity-70" />
      <p className="text-sm font-medium text-destructive">Failed to load data</p>
      {message && (
        <p className="font-mono text-xs text-muted-foreground break-all">{message}</p>
      )}
    </div>
  );
}

function DefaultEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-card p-8 text-center">
      <Inbox className="w-6 h-6 text-muted-foreground opacity-40" />
      <p className="text-sm text-muted-foreground">No data available yet.</p>
    </div>
  );
}

function defaultIsEmpty<T>(data: T): boolean {
  if (data === null || data === undefined) return true;
  if (Array.isArray(data)) return data.length === 0;
  return false;
}

/**
 * QueryGuard — a render-children wrapper that maps a TanStack Query result
 * to the appropriate UI state using the app's lifecycle pattern.
 *
 * Lifecycle phases handled:
 *   idle / loading  → loadingFallback
 *   error           → errorFallback
 *   success + empty → emptyFallback
 *   success         → children(data)
 *   refreshing      → children(data)  (background refresh; existing UI stays visible)
 *
 * @example
 * <QueryGuard query={useStocks()} loadingLabel="Loading stocks…">
 *   {(stocks) => <StockTable stocks={stocks} />}
 * </QueryGuard>
 */
export function QueryGuard<TData, TError extends { message?: string } = Error>({
  query,
  children,
  loadingFallback,
  errorFallback,
  emptyFallback,
  isEmpty = defaultIsEmpty,
  loadingLabel,
}: QueryGuardProps<TData, TError>) {
  const phase = useLifecycle(query);

  if (phase === "idle" || phase === "loading") {
    return <>{loadingFallback ?? <DefaultLoading label={loadingLabel} />}</>;
  }

  if (phase === "error") {
    const errMsg = (query.error as { message?: string } | null)?.message;
    if (typeof errorFallback === "function") {
      return <>{errorFallback(query.error as TError | null)}</>;
    }
    return <>{errorFallback ?? <DefaultError message={errMsg} />}</>;
  }

  // phase === "success" or "refreshing"
  const data = query.data as TData;

  if (isEmpty(data)) {
    return <>{emptyFallback ?? <DefaultEmpty />}</>;
  }

  return <>{children(data)}</>;
}
