import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryGuard } from "@/components/QueryGuard";

type QueryStub<TData> = {
  status: "pending" | "success" | "error";
  fetchStatus: "idle" | "fetching" | "paused";
  data: TData | undefined;
  error: Error | null;
};

describe("QueryGuard rendering", () => {
  it("refreshing: renders children with current data, not a spinner", () => {
    const query: QueryStub<string[]> = {
      status: "success",
      fetchStatus: "fetching",
      data: ["AAPL", "MSFT"],
      error: null,
    };

    render(
      <QueryGuard query={query}>
        {(data) => <ul>{data.map((t) => <li key={t}>{t}</li>)}</ul>}
      </QueryGuard>
    );

    expect(screen.getByText("AAPL")).toBeInTheDocument();
    expect(screen.getByText("MSFT")).toBeInTheDocument();
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });

  it("error + errorFallback as function: calls fallback with the error", () => {
    const err = new Error("fetch failed");
    const query: QueryStub<string[]> = {
      status: "error",
      fetchStatus: "idle",
      data: undefined,
      error: err,
    };

    const errorFallback = vi.fn((e: Error | null) => (
      <div data-testid="error-msg">{e?.message}</div>
    ));

    render(
      <QueryGuard query={query} errorFallback={errorFallback}>
        {(data) => <span>{String(data)}</span>}
      </QueryGuard>
    );

    expect(errorFallback).toHaveBeenCalledWith(err);
    expect(screen.getByTestId("error-msg")).toHaveTextContent("fetch failed");
  });

  it("success + isEmpty true: renders emptyFallback, not children", () => {
    const query: QueryStub<string[]> = {
      status: "success",
      fetchStatus: "idle",
      data: ["AAPL"],
      error: null,
    };

    const isEmpty = vi.fn((_data: string[]) => true);

    render(
      <QueryGuard
        query={query}
        isEmpty={isEmpty}
        emptyFallback={<div data-testid="empty">Nothing here</div>}
      >
        {(data) => <span data-testid="children">{data.join(",")}</span>}
      </QueryGuard>
    );

    expect(isEmpty).toHaveBeenCalledWith(["AAPL"]);
    expect(screen.getByTestId("empty")).toBeInTheDocument();
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("loading + custom loadingFallback: renders custom fallback instead of default spinner", () => {
    const query: QueryStub<string[]> = {
      status: "pending",
      fetchStatus: "fetching",
      data: undefined,
      error: null,
    };

    render(
      <QueryGuard
        query={query}
        loadingFallback={<div data-testid="custom-spinner">Custom loading…</div>}
      >
        {(data) => <span>{data.join(",")}</span>}
      </QueryGuard>
    );

    expect(screen.getByTestId("custom-spinner")).toBeInTheDocument();
    expect(screen.getByText("Custom loading…")).toBeInTheDocument();
    // Default "Loading…" text should not appear
    expect(screen.queryByText("Loading…")).not.toBeInTheDocument();
  });

  it("children callback is NOT called during loading or error phases", () => {
    const children = vi.fn((_data: string[]) => <span>data</span>);

    const loadingQuery: QueryStub<string[]> = {
      status: "pending",
      fetchStatus: "fetching",
      data: undefined,
      error: null,
    };

    const { unmount } = render(
      <QueryGuard query={loadingQuery}>{children}</QueryGuard>
    );
    expect(children).not.toHaveBeenCalled();
    unmount();

    const errorQuery: QueryStub<string[]> = {
      status: "error",
      fetchStatus: "idle",
      data: undefined,
      error: new Error("bad"),
    };

    render(<QueryGuard query={errorQuery}>{children}</QueryGuard>);
    expect(children).not.toHaveBeenCalled();
  });
});
