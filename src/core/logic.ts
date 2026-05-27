import { getAegisConfig } from "./config";

/**
 * Checks the permissions of the current user
 *
 * @param resource - The resource the current user is trying to access
 *
 * @returns A boolean to confirm if the user can access the current resource
 **/
export async function checkPermission(resource: string): Promise<boolean> {
  const config = getAegisConfig();

  // Get current user context (userId, etc.)
  const ctx = await config.getSecurityContext();

  // Fetch the data in parallel
  const [allowedRoles, userRoles] = await Promise.all([
    config.adapter.getAllowedRoles(resource),
    config.adapter.getUserRoles(ctx),
  ]);

  // If no roles, then closed by default
  if (allowedRoles.length === 0) return false;

  // Check if user has any of the allowed roles
  return userRoles.some((role) => allowedRoles.includes(role));
}
