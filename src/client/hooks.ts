"use client";

import { useState, useEffect, useCallback } from "react";

export interface AegisResourceWithRoles {
  key: string;
  description?: string;
  allowedRoles: string[];
}

export interface UseAegisResourcesOptions {
  apiBase?: string;
}

export interface UseAegisResourcesReturn {
  resources: AegisResourceWithRoles[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useAegisResources(
  options: UseAegisResourcesOptions = {},
): UseAegisResourcesReturn {
  const { apiBase = "/api/aegis" } = options;
  const [resources, setResources] = useState<AegisResourceWithRoles[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchResources = useCallback(
    async (signal?: AbortSignal) => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(apiBase, { signal });
        if (!res.ok) {
          throw new Error(`Failed to fetch resources: ${res.status}`);
        }
        const data: AegisResourceWithRoles[] = await res.json();
        setResources(data);
      } catch (err: unknown) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(
          err instanceof Error ? err.message : "Failed to fetch resources",
        );
      } finally {
        setIsLoading(false);
      }
    },
    [apiBase],
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchResources(controller.signal);
    return () => controller.abort();
  }, [fetchResources]);

  const refetch = useCallback(() => fetchResources(), [fetchResources]);

  return { resources, isLoading, error, refetch };
}

export interface UseUpdatePermissionsOptions {
  apiBase?: string;
}

export interface UseUpdatePermissionsReturn {
  updatePermissions: (resourceKey: string, roles: string[]) => Promise<boolean>;
  isSaving: boolean;
  error: string | null;
}

export function useUpdatePermissions(
  options: UseUpdatePermissionsOptions = {},
): UseUpdatePermissionsReturn {
  const { apiBase = "/api/aegis" } = options;
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updatePermissions = useCallback(
    async (resourceKey: string, roles: string[]): Promise<boolean> => {
      setIsSaving(true);
      setError(null);
      try {
        const res = await fetch(apiBase, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resource: resourceKey, roles }),
        });
        if (!res.ok) {
          throw new Error(`Failed to update permissions: ${res.status}`);
        }
        return true;
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "Failed to update permissions";
        setError(message);
        return false;
      } finally {
        setIsSaving(false);
      }
    },
    [apiBase],
  );

  return { updatePermissions, isSaving, error };
}
