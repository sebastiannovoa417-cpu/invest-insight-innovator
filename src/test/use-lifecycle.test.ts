import { describe, it, expect } from "vitest";
import { useLifecycle, type LifecyclePhase } from "@/hooks/use-lifecycle";
import { renderHook } from "@testing-library/react";

type QueryStub = {
  status: "pending" | "success" | "error";
  fetchStatus: "idle" | "fetching" | "paused";
  data: unknown;
  error: unknown;
};

function run(stub: QueryStub): LifecyclePhase {
  const { result } = renderHook(() => useLifecycle(stub));
  return result.current;
}

describe("useLifecycle", () => {
  it("returns 'idle' when query is disabled (pending + idle)", () => {
    expect(run({ status: "pending", fetchStatus: "idle", data: undefined, error: null })).toBe("idle");
  });

  it("returns 'loading' when first fetch is in-flight (pending + fetching)", () => {
    expect(run({ status: "pending", fetchStatus: "fetching", data: undefined, error: null })).toBe("loading");
  });

  it("returns 'refreshing' when background refetch is happening (success + fetching)", () => {
    expect(run({ status: "success", fetchStatus: "fetching", data: [1, 2], error: null })).toBe("refreshing");
  });

  it("returns 'success' when data is available and no refetch in-flight", () => {
    expect(run({ status: "success", fetchStatus: "idle", data: [1, 2], error: null })).toBe("success");
  });

  it("returns 'error' when status is error", () => {
    expect(run({ status: "error", fetchStatus: "idle", data: undefined, error: new Error("oops") })).toBe("error");
  });

  it("returns 'loading' for any unrecognized combination (safe fallback)", () => {
    // success but data is null — treated as still loading
    expect(run({ status: "success", fetchStatus: "idle", data: null, error: null })).toBe("loading");
  });
});
