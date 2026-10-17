import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./prisma";

export const neonAuth = betterAuth({
  baseURL: "http://localhost:3000",
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
