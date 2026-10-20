import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./prisma";
import { env } from "./env";

export const neonAuth = betterAuth({
  secret: env.BETTER_AUTH_SECRET,
  // Better Auth signs cookies and builds callback URLs against this. Hardcoding
  // localhost made every production auth request point at the wrong origin, so
  // the deployed origin wins and local dev stays the default.
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  database: prismaAdapter(db, {
    provider: "postgresql",
  }),
  // Prisma model `AuthAccount` (table `account`). Unset, Better Auth resolves
  // `account` to the bank-account `Account` delegate.
  account: {
    modelName: "authAccount",
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // update every 24 hours
  },
});
