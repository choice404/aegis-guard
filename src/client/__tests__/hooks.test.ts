import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAegisResources, useUpdatePermissions } from "../hooks";

const mockResources = [
  { key: "page1", description: "Page 1", allowedRoles: ["admin"] },
  { key: "page2", allowedRoles: ["viewer"] },
];

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => mockResources,
    })),
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useAegisResources", () => {
  it("fetches resources on mount", async () => {
    const { result } = renderHook(() => useAegisResources());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.resources).toEqual(mockResources);
    expect(result.current.error).toBeNull();
  });

  it("sets isLoading during fetch", () => {
    const { result } = renderHook(() => useAegisResources());
    expect(result.current.isLoading).toBe(true);
  });

  it("sets error on fetch failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 500 })),
    );

    const { result } = renderHook(() => useAegisResources());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.error).toBe("Failed to fetch resources: 500");
    expect(result.current.resources).toEqual([]);
  });

  it("uses custom apiBase", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => [],
    }));
    vi.stubGlobal("fetch", fetchMock);

    renderHook(() => useAegisResources({ apiBase: "/custom/api" }));

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith("/custom/api", expect.any(Object)),
    );
  });

  it("refetches when refetch is called", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => mockResources,
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useAegisResources());

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await act(() => result.current.refetch());
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe("useUpdatePermissions", () => {
  it("posts to the API with correct body", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() => useUpdatePermissions());

    let success: boolean = false;
    await act(async () => {
      success = await result.current.updatePermissions("page1", ["admin", "editor"]);
    });

    expect(success).toBe(true);
    expect(fetchMock).toHaveBeenCalledWith("/api/aegis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resource: "page1", roles: ["admin", "editor"] }),
    });
  });

  it("returns false and sets error on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: false, status: 403 })),
    );

    const { result } = renderHook(() => useUpdatePermissions());

    let success: boolean = true;
    await act(async () => {
      success = await result.current.updatePermissions("page1", ["admin"]);
    });

    expect(success).toBe(false);
    expect(result.current.error).toBe("Failed to update permissions: 403");
  });

  it("uses custom apiBase", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ success: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useUpdatePermissions({ apiBase: "/custom/api" }),
    );

    await act(async () => {
      await result.current.updatePermissions("page1", ["admin"]);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "/custom/api",
      expect.objectContaining({ method: "POST" }),
    );
  });
});
