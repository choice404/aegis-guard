import { describe, it, expect, beforeEach } from "vitest";
import { initAegis, getAegisConfig } from "../config";
import type { AegisAdapter, AegisConfig } from "../types";

const createMockAdapter = (): AegisAdapter => ({
  getUserRoles: async () => [],
  getAllowedRoles: async () => [],
  getAllResources: async () => [],
  setResourcePermissions: async () => {},
  upsertResource: async () => {},
});

const GLOBAL_KEY = "__next_aegis_config__";

beforeEach(() => {
  delete (globalThis as unknown as Record<string, unknown>)[GLOBAL_KEY];
});

describe("getAegisConfig", () => {
  it("throws when not initialized", () => {
    expect(() => getAegisConfig()).toThrow(
      "Aegis not initialized. Call initAegis() in your setup file.",
    );
  });

  it("returns config after initAegis", () => {
    const config: AegisConfig = {
      adapter: createMockAdapter(),
      getSecurityContext: async () => ({ userId: "test" }),
    };
    initAegis(config);
    expect(getAegisConfig()).toBe(config);
  });
});

describe("initAegis", () => {
  it("overwrites previous config", () => {
    const config1: AegisConfig = {
      adapter: createMockAdapter(),
      getSecurityContext: async () => ({ userId: "first" }),
    };
    const config2: AegisConfig = {
      adapter: createMockAdapter(),
      getSecurityContext: async () => ({ userId: "second" }),
    };

    initAegis(config1);
    initAegis(config2);
    expect(getAegisConfig()).toBe(config2);
  });
});
