import { describe, it, expect, beforeEach, vi } from "vitest";
import { initAegis } from "../../core/config";
import { createAegisHandler } from "../api";
import type { AegisAdapter } from "../../core/types";

const GLOBAL_KEY = "__next_aegis_config__";

const createMockAdapter = (overrides: Partial<AegisAdapter> = {}): AegisAdapter => ({
  getUserRoles: vi.fn(async () => []),
  getAllowedRoles: vi.fn(async () => []),
  getAllResources: vi.fn(async () => []),
  setResourcePermissions: vi.fn(async () => {}),
  upsertResource: vi.fn(async () => {}),
  ...overrides,
});

beforeEach(() => {
  delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
});

describe("createAegisHandler", () => {
  describe("GET", () => {
    it("returns enriched resources with allowedRoles", async () => {
      const adapter = createMockAdapter({
        getAllResources: vi.fn(async () => [
          { key: "page1", description: "Page 1" },
          { key: "page2" },
        ]),
        getAllowedRoles: vi.fn(async (key: string) => {
          if (key === "page1") return ["admin", "editor"];
          return ["viewer"];
        }),
      });
      initAegis({
        adapter,
        getSecurityContext: async () => ({ userId: null }),
      });

      const handler = createAegisHandler();
      const response = await handler.GET();
      const data = await response.json();

      expect(data).toEqual([
        { key: "page1", description: "Page 1", allowedRoles: ["admin", "editor"] },
        { key: "page2", allowedRoles: ["viewer"] },
      ]);
    });

    it("returns 500 on adapter error", async () => {
      const adapter = createMockAdapter({
        getAllResources: vi.fn(async () => {
          throw new Error("DB error");
        }),
      });
      initAegis({
        adapter,
        getSecurityContext: async () => ({ userId: null }),
      });

      const handler = createAegisHandler();
      const response = await handler.GET();

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data).toEqual({ error: "Internal Server Error" });
    });
  });

  describe("POST", () => {
    it("calls setResourcePermissions with valid body", async () => {
      const setResourcePermissions = vi.fn(async () => {});
      const adapter = createMockAdapter({ setResourcePermissions });
      initAegis({
        adapter,
        getSecurityContext: async () => ({ userId: null }),
      });

      const handler = createAegisHandler();
      const request = new Request("http://localhost/api/aegis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: "page1", roles: ["admin"] }),
      });

      const response = await handler.POST(request);
      const data = await response.json();

      expect(data).toEqual({ success: true });
      expect(setResourcePermissions).toHaveBeenCalledWith("page1", ["admin"]);
    });

    it("returns 400 when resource is missing", async () => {
      const adapter = createMockAdapter();
      initAegis({
        adapter,
        getSecurityContext: async () => ({ userId: null }),
      });

      const handler = createAegisHandler();
      const request = new Request("http://localhost/api/aegis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: ["admin"] }),
      });

      const response = await handler.POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 400 when roles is not an array", async () => {
      const adapter = createMockAdapter();
      initAegis({
        adapter,
        getSecurityContext: async () => ({ userId: null }),
      });

      const handler = createAegisHandler();
      const request = new Request("http://localhost/api/aegis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: "page1", roles: "admin" }),
      });

      const response = await handler.POST(request);
      expect(response.status).toBe(400);
    });

    it("returns 500 on adapter error", async () => {
      const adapter = createMockAdapter({
        setResourcePermissions: vi.fn(async () => {
          throw new Error("DB error");
        }),
      });
      initAegis({
        adapter,
        getSecurityContext: async () => ({ userId: null }),
      });

      const handler = createAegisHandler();
      const request = new Request("http://localhost/api/aegis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resource: "page1", roles: ["admin"] }),
      });

      const response = await handler.POST(request);
      expect(response.status).toBe(500);
    });
  });
});
