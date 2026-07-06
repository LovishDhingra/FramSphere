import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const DATABASE_URL = process.env.DATABASE_URL;
const isNeon = DATABASE_URL.includes("neon.tech");

/**
 * Database client — auto-selects the correct driver:
 *  - Neon DB (*.neon.tech):  @neondatabase/serverless + WebSocket
 *  - Standard PostgreSQL:    pg Pool (used by Replit-hosted DB)
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let pool: any;

if (isNeon) {
  const { Pool, neonConfig } = await import("@neondatabase/serverless");
  const { drizzle } = await import("drizzle-orm/neon-serverless");
  const ws = await import("ws");

  // WebSocket constructor is required in Node.js — browsers have it natively
  neonConfig.webSocketConstructor = ws.default;

  pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzle(pool, { schema });
} else {
  const pg = await import("pg");
  const { drizzle } = await import("drizzle-orm/node-postgres");

  pool = new pg.default.Pool({ connectionString: DATABASE_URL });
  db = drizzle(pool, { schema });
}

export { db, pool };
export * from "./schema";
