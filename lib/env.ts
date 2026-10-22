import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  ARCJET_KEY: z.string().optional(),
  RESEND_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
  INNGEST_EVENT_KEY: z.string().optional(),
  INNGEST_SIGNING_KEY: z.string().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  BETTER_AUTH_URL: z.string().url().optional(),
  BETTER_AUTH_SECRET: z.string().optional(),
  DEMO_USER_PASSWORD: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  R2_ENDPOINT: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional()),
  R2_BUCKET: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  R2_ACCESS_KEY_ID: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  R2_SECRET_ACCESS_KEY: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
  R2_PUBLIC_URL: z.preprocess((v) => (v === "" ? undefined : v), z.string().url().optional()),
});

export const env = envSchema.parse(process.env);
export type Env = z.infer<typeof envSchema>;
