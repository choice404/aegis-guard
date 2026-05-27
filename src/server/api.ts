import { NextResponse } from "next/server";
import { getAegisConfig } from "../core/config";

/**
 * Creates the Aegis createAegisHandler for GET and POST requests
 *
 * @:returns A promise of a NextResponse
 **/
export function createAegisHandler() {
  return {
    GET: async () => {
      try {
        const config = getAegisConfig();
        const resources = await config.adapter.getAllResources();

        const enriched = await Promise.all(
          resources.map(async (r) => ({
            ...r,
            allowedRoles: await config.adapter.getAllowedRoles(r.key),
          })),
        );

        return NextResponse.json(enriched);
      } catch (error) {
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 },
        );
      }
    },
    POST: async (req: Request) => {
      try {
        const config = getAegisConfig();
        const body = await req.json();
        const { resource, roles } = body;

        if (!resource || !Array.isArray(roles)) {
          return NextResponse.json({ error: "Invalid body" }, { status: 400 });
        }

        await config.adapter.setResourcePermissions(resource, roles);
        return NextResponse.json({ success: true });
      } catch (error) {
        return NextResponse.json(
          { error: "Internal Server Error" },
          { status: 500 },
        );
      }
    },
  };
}
