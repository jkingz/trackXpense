import { NextResponse } from "next/server";

import { uploadReceipt } from "@/lib/storage";

export async function POST(request: Request) {
  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  const { url } = await uploadReceipt(file);
  return NextResponse.json({ url });
}
