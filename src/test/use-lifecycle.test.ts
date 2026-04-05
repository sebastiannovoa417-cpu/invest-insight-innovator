import { describe, it, expect } from "vitest";
import { getLifecyclePhase, type LifecyclePhase } from "@/hooks/lifecycle";

type QueryStub = { status: "pending" | "success" | "error"; fetchStatus: "idle" | "fetching" | "paused" };

function run(stub: QueryStub): LifecyclePhase {
  return getLifecyclePhase(stub);
}

describe("getLifecyclePhase", () => {
  it("returns idle when pending + idle", () => {
    expect(run({ status: "pending", fetchStatus: "idle" })).toBe("idle");
  });

  it("returns loading when pending + fetching", () => {
    expect(run({ status: "pending", fetchStatus: "fetching" })).toBe("loading");
  });

  it("returns loading when pending + paused", () => {
    expect(run({ status: "pending", fetchStatus: "paused" })).toBe("loading");
  });

  it("returns refreshing when success + fetching", () => {
    expect(run({ status: "success", fetchStatus: "fetching" })).toBe("refreshing");
  });

  it("returns success when success + idle", () => {
    expect(run({ status: "success", fetchStatus: "idle" })).toBe("success");
  });

  it("returns error when error", () => {
    expect(run({ status: "error", fetchStatus: "idle" })).toBe("error");
  });
});
