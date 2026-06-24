import { PrismaClient } from '@prisma/client';

/**
 * Single shared Prisma client for the whole process. A module-level singleton
 * avoids exhausting SQLite connections under `tsx watch`, which re-imports
 * modules on change. Both the API server and the standalone sync scripts import
 * this so they talk to the same `dev.db`.
 */
export const prisma = new PrismaClient();
