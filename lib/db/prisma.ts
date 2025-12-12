/**
 * Prisma Client Singleton
 *
 * This module ensures a single Prisma client instance is used throughout the app.
 * In development, it prevents hot-reload from creating multiple connections.
 *
 * SETUP REQUIRED:
 * 1. Run `npx prisma generate` to generate the Prisma client
 * 2. Run `npx prisma db push` to sync the database schema
 * 3. Set DATABASE_URL in your .env file
 */

// Type definition for Prisma client (will be replaced when generated)
type PrismaClientType = {
  $connect: () => Promise<void>;
  $disconnect: () => Promise<void>;
};

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientType | undefined;
};

/**
 * Get Prisma client instance
 *
 * Returns null if Prisma client hasn't been generated yet.
 * To generate: run `npx prisma generate`
 */
function createPrismaClient(): PrismaClientType | null {
  try {
    // Dynamic import to avoid build errors when Prisma isn't set up
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { PrismaClient } = require('@prisma/client');
    return new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    });
  } catch {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[Prisma] Client not available. Run `npx prisma generate` to set up the database.'
      );
    }
    return null;
  }
}

/**
 * Prisma client instance
 *
 * Uses a singleton pattern to prevent multiple database connections.
 * In development, the client is stored in globalThis to survive hot-reloads.
 * Returns null if Prisma isn't set up yet.
 */
export const prisma: PrismaClientType | null = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production' && prisma) {
  globalForPrisma.prisma = prisma;
}

export default prisma;
