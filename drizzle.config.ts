import { config } from "dotenv";
import type { Config } from "drizzle-kit";

// ЭТА СТРОКА ВАЖНА: она читает твой .env.local
config({ path: ".env.local" });

export default {
  schema:  "./lib/db/schema.ts",
  out:     "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
} satisfies Config;