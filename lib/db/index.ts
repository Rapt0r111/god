// lib/db/index.ts (или где он у тебя лежит)
import * as schema from "./schema";
import { neon } from "@neondatabase/serverless";
import { drizzle as drizzleNeon } from "drizzle-orm/neon-http";
import { Pool } from "pg";
import { drizzle as drizzleNodePg } from "drizzle-orm/node-postgres";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL не задан в .env.local");

function isNeonUrl(url: string) {
  return url.includes("neon.tech") || url.includes("neon.database");
}

// Правильный синглтон, который кэширует именно инстанс DB (любой из двух)
const globalForDb = globalThis as unknown as {
  db: ReturnType<typeof drizzleNeon> | ReturnType<typeof drizzleNodePg>;
};

if (!globalForDb.db) {
  if (isNeonUrl(DATABASE_URL)) {
    const sql = neon(DATABASE_URL);
    globalForDb.db = drizzleNeon(sql, { schema });
  } else {
    const pool = new Pool({ connectionString: DATABASE_URL });
    globalForDb.db = drizzleNodePg(pool, { schema });
  }
}

export const db = globalForDb.db;
export type DB = typeof db;