"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  useAegisResources,
  useUpdatePermissions,
  type AegisResourceWithRoles,
} from "./hooks";

export interface AegisDashboardStyledProps {
  roles: string[];
  apiBase?: string;
  className?: string;
  title?: string;
}

export function AegisDashboardStyled({
  roles,
  apiBase,
  className,
  title = "Aegis Permissions",
}: AegisDashboardStyledProps) {
  const {
    resources,
    isLoading,
    error: fetchError,
    refetch,
  } = useAegisResources({ apiBase });
  const {
    updatePermissions,
    isSaving,
    error: saveError,
  } = useUpdatePermissions({ apiBase });

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
    <section
      className={[
        "rounded-lg border border-gray-200 bg-white shadow-sm",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving || dirtyKeys.size === 0}
          className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSaving ? (
            <span className="flex items-center gap-2">
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              Saving...
            </span>
          ) : (
            `Save Changes${dirtyKeys.size > 0 ? ` (${dirtyKeys.size})` : ""}`
          )}
        </button>
      </header>

      {error && (
        <div
          role="alert"
          className="mx-6 mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        {isLoading ? (
          <div className="flex items-center justify-center px-6 py-12">
            <svg
              className="h-6 w-6 animate-spin text-indigo-600"
              viewBox="0 0 24 24"
              fill="none"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="ml-3 text-sm text-gray-500">
              Loading resources...
            </span>
          </div>
        ) : workingState.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-500">
            No resources registered yet. Use{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
              &lt;Shield&gt;
            </code>{" "}
            in your pages to auto-discover resources.
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-6 py-3">Resource</th>
                <th className="px-6 py-3">Description</th>
                {roles.map((role) => (
                  <th key={role} className="px-6 py-3 text-center">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {workingState.map((resource, i) => (
                <tr
                  key={resource.key}
                  className={[
                    "transition-colors hover:bg-gray-50",
                    dirtyKeys.has(resource.key) ? "bg-amber-50" : "",
                    i % 2 === 1 && !dirtyKeys.has(resource.key)
                      ? "bg-gray-50/50"
                      : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  <td className="whitespace-nowrap px-6 py-3 text-sm font-medium text-gray-900">
                    <code className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs">
                      {resource.key}
                    </code>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-500">
                    {resource.description ?? (
                      <span className="italic text-gray-300">
                        No description
                      </span>
                    )}
                  </td>
                  {roles.map((role) => {
                    const checked = resource.allowedRoles.includes(role);
                    return (
                      <td key={role} className="px-6 py-3 text-center">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={checked}
                          aria-label={`${role} access for ${resource.key}`}
                          onClick={() => toggleRole(resource.key, role)}
                          className={[
                            "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2",
                            checked ? "bg-indigo-600" : "bg-gray-200",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out",
                              checked ? "translate-x-4" : "translate-x-0",
                            ].join(" ")}
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {dirtyKeys.size > 0 && (
        <div className="border-t border-gray-200 px-6 py-3 text-xs text-amber-600">
          {dirtyKeys.size} unsaved{" "}
          {dirtyKeys.size === 1 ? "change" : "changes"}
        </div>
      )}
    </section>
  );
}
