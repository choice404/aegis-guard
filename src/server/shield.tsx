import React, { ReactNode } from "react";
import { getAegisConfig } from "../core/config";
import { checkPermission } from "../core/logic";

export interface ShieldProps {
  resource: string;
  description?: string;
  children: ReactNode;
  fallback?: ReactNode;
}

export async function Shield({
  resource,
  description,
  children,
  fallback = null,
}: ShieldProps) {
  // NOTE: Development Only
  // If we are in dev mode, tell the DB this resource exists.
  if (process.env.NODE_ENV === "development") {
    const config = getAegisConfig();
    // No await to prevent slowdown
    config.adapter.upsertResource(resource, description).catch(console.error);
  }

  // Check Permission
  const isAllowed = await checkPermission(resource);

  // Render
  if (!isAllowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
