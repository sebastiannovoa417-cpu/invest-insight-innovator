import { describe, it, expect } from "vitest";
import { getLifecyclePhase, type LifecyclePhase } from "@/hooks/use-lifecycle";

type QueryStub = {
  status: "pending" | "success" | "error";
  fetchStatus: "idle" | "fetching" | "paused";
  data: unknown;
  error: unknown;
};

function run(stub: QueryStub): LifecyclePhase {
  return getLifecyclePhase(stub);
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

  it("returns 'success' when status is success even if data is null (isEmpty is QueryGuard's job)", () => {
    expect(run({ status: "success", fetchStatus: "idle", data: null, error: null })).toBe("success");
  });

  it("returns 'loading' when fetch is paused (e.g. device offline)", () => {
    expect(run({ status: "pending", fetchStatus: "paused", data: undefined, error: null })).toBe("loading");
  });
});
