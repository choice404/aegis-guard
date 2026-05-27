/**
 * Example Prisma adapter for aegis-guard.
 *
 * Assumes a schema like:
 *
 *   model AegisResource {
 *     key         String   @id
 *     description String?
 *     roles       String[] // allowed role names
 *   }
 *
 *   model User {
 *     id    String   @id
 *     roles String[] // assigned role names
 *   }
 *
 * Adjust the queries to match your actual schema.
 */

import type { PrismaClient } from "@prisma/client";
import type { AegisAdapter, AegisContext } from "aegis-guard/core";

export function createPrismaAdapter(prisma: PrismaClient): AegisAdapter {
  return {
    getUserRoles: async (ctx: AegisContext): Promise<string[]> => {
      if (!ctx.userId) return [];
      const user = await prisma.user.findUnique({
        where: { id: ctx.userId },
        select: { roles: true },
      });
      return user?.roles ?? [];
    },

    getAllowedRoles: async (resourceKey: string): Promise<string[]> => {
      const resource = await prisma.aegisResource.findUnique({
        where: { key: resourceKey },
        select: { roles: true },
      });
      return resource?.roles ?? [];
    },

    getAllResources: async () => {
      return prisma.aegisResource.findMany({
        select: { key: true, description: true },
      });
    },

    setResourcePermissions: async (
      resourceKey: string,
      roles: string[],
    ): Promise<void> => {
      await prisma.aegisResource.update({
        where: { key: resourceKey },
        data: { roles },
      });
    },

    upsertResource: async (
      resourceKey: string,
      description?: string,
    ): Promise<void> => {
      await prisma.aegisResource.upsert({
        where: { key: resourceKey },
        create: { key: resourceKey, description, roles: [] },
        update: {},
      });
    },
  };
}
