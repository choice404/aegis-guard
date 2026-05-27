// Contexgt for Aegis
export interface AegisContext {
  userId: string | null;
  [key: string]: any;
}

/**
 * @interface AegisResource
 * @member {string} Key for the resource
 * @member {string} Description for the resource
 * Resource we are protecting with Aegis
 *
 * @example:
 *    key: "admin.settings"
 *    description: "Settings page"
 **/
export interface AegisResource {
  key: string;
  description?: string;
}

//
export interface AegisAdapter {
  // Returns the roles assigned to the current user
  getUserRoles(ctx: AegisContext): Promise<string[]>;

  // Return roles allowed to access a specific resource key
  getAllowedRoles(resourceKey: string): Promise<string[]>;

  // (Admin) Get all known resources for the dashboard
  getAllResources(): Promise<AegisResource[]>;

  // (Admin) Update allowed roles for a resource
  setResourcePermissions(resourceKey: string, roles: string[]): Promise<void>;

  // (Dev) Register a new resource automatically when seen in code
  upsertResource(resourceKey: string, description?: string): Promise<void>;
}

// Aegis config object
export interface AegisConfig {
  adapter: AegisAdapter;
  getSecurityContext: () => Promise<AegisContext>;
}
