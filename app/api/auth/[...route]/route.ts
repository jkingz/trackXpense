/**
 * Better Auth API Routes
 * This automatically serves all auth endpoints at /api/auth/*
 */
import { neonAuth } from "@/lib/neon-auth";
import { toNextJsHandler } from "better-auth/next-js";

export const { GET, POST } = toNextJsHandler(neonAuth);
