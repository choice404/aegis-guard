# aegis-guard

Dynamic, database driven RBAC/ABAC for Next.js App Router. Shield your Server Components at runtime.

- **Server first**: gates content in React Server Components before it reaches the client
- **Database agnostic**: bring your own adapter (Prisma, Drizzle, raw SQL, anything)
- **Auto discovery**: `<Shield>` registers resources in your database during development
- **Admin dashboard**: built in UI for managing permissions (headless, unstyled, or styled)

## Install

```bash
npm install aegis-guard
```

Peer dependencies: `next >= 16`, `react >= 18`, `react-dom >= 18`

## Quick Start

### 1. Implement an adapter

```ts
// lib/aegis-adapter.ts
import type { AegisAdapter } from "aegis-guard/core";

export const adapter: AegisAdapter = {
  getUserRoles: async (ctx) => {
    // Query your database for the user's roles
    return db.getUserRoles(ctx.userId);
  },
  getAllowedRoles: async (resourceKey) => {
    return db.getResourceRoles(resourceKey);
  },
  getAllResources: async () => {
    return db.getAllResources();
  },
  setResourcePermissions: async (resourceKey, roles) => {
    await db.updateResourceRoles(resourceKey, roles);
  },
  upsertResource: async (resourceKey, description) => {
    await db.upsertResource(resourceKey, description);
  },
};
```

### 2. Initialize Aegis

Use Next.js [instrumentation](https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation) to initialize once at server startup:

```ts
// instrumentation.ts
export async function register() {
  const { initAegis } = await import("aegis-guard/core");
  const { adapter } = await import("./lib/aegis-adapter");

  initAegis({
    adapter,
    getSecurityContext: async () => {
      const { auth } = await import("./lib/auth"); // your auth library
      const session = await auth();
      return { userId: session?.userId ?? null };
    },
  });
}
```

### 3. Protect pages with Shield

```tsx
// app/admin/page.tsx
import { Shield } from "aegis-guard/server";

export default function AdminPage() {
  return (
    <Shield
      resource="admin.page"
      description="Main admin page"
      fallback={<p>Access denied.</p>}
    >
      <h1>Welcome, admin</h1>
    </Shield>
  );
}
```

In development, `<Shield>` automatically calls `adapter.upsertResource()` to register the resource in your database.

### 4. Protect API routes and middleware

```ts
// app/api/secret/route.ts
import { checkPermission } from "aegis-guard/server";

export async function GET() {
  const allowed = await checkPermission("api.secret");
  if (!allowed) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }
  return Response.json({ data: "secret" });
}
```

### 5. Add the admin API route

```ts
// app/api/aegis/route.ts
import { createAegisHandler } from "aegis-guard/server";

export const { GET, POST } = createAegisHandler();
```

### 6. Add the permissions dashboard

```tsx
// app/admin/permissions/page.tsx
import { AegisDashboardStyled } from "aegis-guard/client";

export default function PermissionsPage() {
  return <AegisDashboardStyled roles={["admin", "editor", "viewer"]} />;
}
```

## API Reference

### `aegis-guard/core`

| Export              | Description                                               |
| ------------------- | --------------------------------------------------------- |
| `initAegis(config)` | Initialize the library with your adapter and auth context |
| `AegisAdapter`      | Interface your database adapter must implement            |
| `AegisConfig`       | Configuration object type                                 |
| `AegisContext`      | User context type (`{ userId, ...custom }`)               |
| `AegisResource`     | Resource type (`{ key, description? }`)                   |

### `aegis-guard/server`

| Export                      | Description                                             |
| --------------------------- | ------------------------------------------------------- |
| `<Shield>`                  | Async Server Component that gates content by permission |
| `checkPermission(resource)` | Returns `boolean`. Use in API routes, middleware, tRPC |
| `createAegisHandler()`      | Returns `{ GET, POST }` handlers for the admin API      |

### `aegis-guard/client`

| Export                           | Description                                            |
| -------------------------------- | ------------------------------------------------------ |
| `useAegisResources(options?)`    | Hook to fetch resources with their roles               |
| `useUpdatePermissions(options?)` | Hook to update resource permissions                    |
| `<AegisDashboard>`               | Unstyled dashboard with semantic HTML. Bring your own CSS |
| `<AegisDashboardStyled>`         | Tailwind styled dashboard, ready to use               |

### Adapter Interface

```ts
interface AegisAdapter {
  getUserRoles(ctx: AegisContext): Promise<string[]>;
  getAllowedRoles(resourceKey: string): Promise<string[]>;
  getAllResources(): Promise<AegisResource[]>;
  setResourcePermissions(resourceKey: string, roles: string[]): Promise<void>;
  upsertResource(resourceKey: string, description?: string): Promise<void>;
}
```

### Dashboard Props

Both `<AegisDashboard>` and `<AegisDashboardStyled>` accept:

| Prop        | Type       | Default               | Description                    |
| ----------- | ---------- | --------------------- | ------------------------------ |
| `roles`     | `string[]` | _required_            | All possible roles in your app |
| `apiBase`   | `string`   | `"/api/aegis"`        | Base path for the admin API    |
| `className` | `string`   |                       | CSS class for the root element |
| `title`     | `string`   | `"Aegis Permissions"` | Dashboard heading              |

### Hook Options

Both hooks accept `{ apiBase?: string }` (default `"/api/aegis"`).

## Tailwind Setup

If using `<AegisDashboardStyled>`, ensure Tailwind scans the library's classes:

**Tailwind v4** add to your CSS:

```css
@source "../../node_modules/aegis-guard/src";
```

**Tailwind v3** add to `tailwind.config.js`:

```js
content: [
  "./node_modules/aegis-guard/dist/**/*.{js,mjs}",
  // ...your other content paths
];
```

## Examples

See the [`playground/`](./playground) directory for a complete working demo with an in memory adapter, protected pages, role switching, and the permissions dashboard.

See [`examples/`](./examples) for adapter implementations:

- [`prisma-adapter.ts`](./examples/prisma-adapter.ts) Prisma ORM adapter

## License

MIT
