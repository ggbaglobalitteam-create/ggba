import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
  // eslint-disable-next-line no-var
  var __pgPool: Pool | undefined;
}

function getPgPool() {
  if (global.__pgPool) return global.__pgPool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");

  // Supabase session-mode poolers exhaust quickly in local dev if every route
  // opens many clients. Keep the shared pool intentionally small.
  global.__pgPool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 1),
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    allowExitOnIdle: true,
  });
  return global.__pgPool;
}

export const prisma =
  global.__prisma ??
  new PrismaClient({
    adapter: new PrismaPg(getPgPool()),
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") global.__prisma = prisma;
