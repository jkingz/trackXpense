import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// Prisma 7 removed `url`/`directUrl` from the schema's datasource block; the CLI
// reads the migration connection from here instead. `env()` throws when a variable
// is absent, which would break `prisma generate` (and the postinstall hook) in
// environments without a database, so the URL is resolved from process.env.
// Prisma 7 also stopped loading `.env*` itself. `dotenv/config` would only read
// `.env`, so the paths mirror Next.js precedence: `.env.local` wins, and real
// environment variables (CI, Vercel) win over both files.
config({ path: [".env.local", ".env"], quiet: true });

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
});
