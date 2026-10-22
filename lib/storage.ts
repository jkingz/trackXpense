import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

import { env } from "@/lib/env";

const R2_ENDPOINT = env.R2_ENDPOINT;
const R2_BUCKET = env.R2_BUCKET;
const R2_ACCESS_KEY_ID = env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = env.R2_SECRET_ACCESS_KEY;
const R2_PUBLIC_URL = env.R2_PUBLIC_URL;

function useRemoteStorage(): boolean {
  return Boolean(
    R2_ENDPOINT && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL,
  );
}

let s3: S3Client | null = null;
function getS3(): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint: R2_ENDPOINT,
      credentials: {
        accessKeyId: R2_ACCESS_KEY_ID!,
        secretAccessKey: R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return s3;
}

export async function uploadReceipt(file: File): Promise<{ url: string }> {
  const ext = path.extname(file.name) || ".bin";
  const name = `${randomUUID()}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  if (useRemoteStorage()) {
    await getS3().send(
      new PutObjectCommand({
        Bucket: R2_BUCKET,
        Key: name,
        Body: buf,
        ContentType: file.type || "application/octet-stream",
      }),
    );
    const base = R2_PUBLIC_URL?.replace(/\/$/, "") ?? `${R2_ENDPOINT}/${R2_BUCKET}`;
    return { url: `${base}/${name}` };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return { url: `/uploads/${name}` };
}
