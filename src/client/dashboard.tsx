"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  useAegisResources,
  useUpdatePermissions,
  type AegisResourceWithRoles,
} from "./hooks";

export interface AegisDashboardProps {
  roles: string[];
  apiBase?: string;
  className?: string;
  title?: string;
}

export function AegisDashboard({
  roles,
  apiBase,
  className,
  title = "Aegis Permissions",
}: AegisDashboardProps) {
  const { resources, isLoading, error: fetchError, refetch } =
    useAegisResources({ apiBase });
  const { updatePermissions, isSaving, error: saveError } =
    useUpdatePermissions({ apiBase });

  const [workingState, setWorkingState] = useState<AegisResourceWithRoles[]>(
    [],
  );
  const lastResourcesRef = useRef<AegisResourceWithRoles[]>([]);

  useEffect(() => {
    if (resources.length === 0) return;
    if (resources === lastResourcesRef.current) return;
    lastResourcesRef.current = resources;
    setWorkingState(
      resources.map((r) => ({ ...r, allowedRoles: [...r.allowedRoles] })),
    );
  }, [resources]);

  const dirtyKeys = useMemo(() => {
    const dirty = new Set<string>();
    for (const working of workingState) {
      const original = resources.find((r) => r.key === working.key);
      if (!original) continue;
      const workingRoles = [...working.allowedRoles].sort();
      const originalRoles = [...original.allowedRoles].sort();
      if (
        workingRoles.length !== originalRoles.length ||
        workingRoles.some((r, i) => r !== originalRoles[i])
      ) {
        dirty.add(working.key);
      }
    }
    return dirty;
  }, [workingState, resources]);

  const toggleRole = (resourceKey: string, role: string) => {
    setWorkingState((prev) =>
      prev.map((r) => {
        if (r.key !== resourceKey) return r;
        const has = r.allowedRoles.includes(role);
        return {
          ...r,
          allowedRoles: has
            ? r.allowedRoles.filter((ro) => ro !== role)
            : [...r.allowedRoles, role],
        };
      }),
    );
  };

  const handleSave = async () => {
    const changed = workingState.filter((r) => dirtyKeys.has(r.key));
    const results = await Promise.all(
      changed.map((r) => updatePermissions(r.key, r.allowedRoles)),
    );
    if (results.every(Boolean)) {
      await refetch();
    }
  };

  const error = fetchError || saveError;

  return (
    <section className={className}>
      <header>
        <h2>{title}</h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || dirtyKeys.size === 0}
        >
          {isSaving ? "Saving..." : "Save Changes"}
        </button>
      </header>

      {error && <p role="alert">{error}</p>}

      {isLoading ? (
        <p>Loading resources...</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Resource</th>
              <th>Description</th>
              {roles.map((role) => (
                <th key={role}>{role}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workingState.map((resource) => (
              <tr key={resource.key}>
                <td>{resource.key}</td>
                <td>{resource.description ?? ""}</td>
                {roles.map((role) => (
                  <td key={role}>
                    <input
                      type="checkbox"
                      checked={resource.allowedRoles.includes(role)}
                      onChange={() => toggleRole(resource.key, role)}
                      aria-label={`${role} access for ${resource.key}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
