// src/lib/db/index.ts
// Универсальное подключение: локальный pg или Neon Serverless

import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL не задан в .env.local");

function isNeonUrl(url: string) {
  return url.includes("neon.tech") || url.includes("neon.database");
}

let db: ReturnType<typeof createLocalDb> | ReturnType<typeof createNeonDb>;

function createNeonDb(url: string) {
  const { neon }   = require("@neondatabase/serverless");
  const { drizzle } = require("drizzle-orm/neon-http");
  const sql = neon(url);
  return drizzle(sql, { schema });
}

function createLocalDb(url: string) {
  const { Pool }   = require("pg");
  const { drizzle } = require("drizzle-orm/node-postgres");
  const pool = new Pool({ connectionString: url });
  return drizzle(pool, { schema });
}

if (isNeonUrl(DATABASE_URL)) {
  db = createNeonDb(DATABASE_URL);
} else {
  db = createLocalDb(DATABASE_URL);
}

export { db };
export type DB = typeof db;