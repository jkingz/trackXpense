import { neonAuth } from "@/lib/neon-auth";
import { DEMO_EMAIL, DEMO_PASSWORD, ensureDemoUser } from "@/lib/demo";

/** Creates the demo ledger on first use, then signs the visitor into it. */
export async function POST() {
  await ensureDemoUser();
  return neonAuth.api.signInEmail({
    body: { email: DEMO_EMAIL, password: DEMO_PASSWORD },
    asResponse: true,
  });
}
