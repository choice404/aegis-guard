import { describe, it, expect, beforeEach, vi } from "vitest";
import { initAegis } from "../config";
import { checkPermission } from "../logic";
import type { AegisAdapter, AegisConfig } from "../types";

const GLOBAL_KEY = "__next_aegis_config__";

const createMockAdapter = (overrides: Partial<AegisAdapter> = {}): AegisAdapter => ({
  getUserRoles: vi.fn(async () => []),
  getAllowedRoles: vi.fn(async () => []),
  getAllResources: async () => [],
  setResourcePermissions: async () => {},
  upsertResource: async () => {},
  ...overrides,
});

beforeEach(() => {
  delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
});

describe("checkPermission", () => {
  it("returns true when user has a matching role", async () => {
    const adapter = createMockAdapter({
      getUserRoles: vi.fn(async () => ["admin", "editor"]),
      getAllowedRoles: vi.fn(async () => ["admin"]),
    });
    initAegis({
      adapter,
      getSecurityContext: async () => ({ userId: "test" }),
    });

    const result = await checkPermission("some-resource");
    expect(result).toBe(true);
  });

  it("returns false when user has no matching role", async () => {
    const adapter = createMockAdapter({
      getUserRoles: vi.fn(async () => ["viewer"]),
      getAllowedRoles: vi.fn(async () => ["admin"]),
    });
    initAegis({
      adapter,
      getSecurityContext: async () => ({ userId: "test" }),
    });

    const result = await checkPermission("admin-page");
    expect(result).toBe(false);
  });

  it("returns false when allowedRoles is empty (closed by default)", async () => {
    const adapter = createMockAdapter({
      getUserRoles: vi.fn(async () => ["admin"]),
      getAllowedRoles: vi.fn(async () => []),
    });
    initAegis({
      adapter,
      getSecurityContext: async () => ({ userId: "test" }),
    });

    const result = await checkPermission("unprotected");
    expect(result).toBe(false);
  });

  it("calls getUserRoles and getAllowedRoles", async () => {
    const getUserRoles = vi.fn(async () => ["admin"]);
    const getAllowedRoles = vi.fn(async () => ["admin"]);
    const adapter = createMockAdapter({ getUserRoles, getAllowedRoles });

    initAegis({
      adapter,
      getSecurityContext: async () => ({ userId: "u1" }),
    });

    await checkPermission("my-resource");

    expect(getAllowedRoles).toHaveBeenCalledWith("my-resource");
    expect(getUserRoles).toHaveBeenCalledWith({ userId: "u1" });
  });

  it("throws when config is not initialized", async () => {
    await expect(checkPermission("anything")).rejects.toThrow(
      "Aegis not initialized",
    );
  });
});
