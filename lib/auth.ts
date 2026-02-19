// src/lib/auth.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),

  emailAndPassword: {
    enabled:          true,
    requireEmailVerification: false,
  },

  session: {
    expiresIn:      60 * 60 * 24 * 7,  // 7 дней
    updateAge:      60 * 60 * 24,       // обновлять раз в сутки
    cookieName:     "csu_pd_session",
  },
});