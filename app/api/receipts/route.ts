import { NextResponse } from "next/server";

import { checkUser } from "@/actions/lib/checkUser";
import { MAX_RECEIPT_BYTES } from "@/lib/schema";
import { uploadReceipt } from "@/lib/storage";

/**
 * Receipt uploads are per-user storage writes, so the session check runs before
 * the body is read: an unauthenticated request is refused (401) without
 * buffering its multipart payload. `checkUser()` throws when signed out — the
 * same seam `app/api/transactions/route.ts` uses.
 *
 * Type and size are enforced here, not only in the browser's `accept`/client
 * guard: the endpoint is reachable directly.
 */
export async function POST(request: Request) {
  try {
    await checkUser();
  } catch {
    return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 400 });
  }
  if (file.size > MAX_RECEIPT_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 413 });
  }

  const { url } = await uploadReceipt(file);
  return NextResponse.json({ url });
}
