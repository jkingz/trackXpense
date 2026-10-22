import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

function clean(value: string | undefined): string | undefined {
  const v = value?.trim();
  return v ? v : undefined;
}

let s3: S3Client | null = null;

function remoteConfig() {
  const R2_ENDPOINT = clean(process.env.R2_ENDPOINT);
  const R2_BUCKET = clean(process.env.R2_BUCKET);
  const R2_ACCESS_KEY_ID = clean(process.env.R2_ACCESS_KEY_ID);
  const R2_SECRET_ACCESS_KEY = clean(process.env.R2_SECRET_ACCESS_KEY);
  const R2_PUBLIC_URL = clean(process.env.R2_PUBLIC_URL);
  const ready = Boolean(
    R2_ENDPOINT && R2_BUCKET && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY && R2_PUBLIC_URL,
  );
  return { R2_ENDPOINT, R2_BUCKET, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_PUBLIC_URL, ready };
}

function getS3(endpoint: string, key: string, secret: string): S3Client {
  if (!s3) {
    s3 = new S3Client({
      region: "auto",
      endpoint,
      credentials: { accessKeyId: key, secretAccessKey: secret },
    });
  }
  return s3;
}

export async function uploadReceipt(file: File): Promise<{ url: string }> {
  const ext = path.extname(file.name) || ".bin";
  const name = `${randomUUID()}${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const cfg = remoteConfig();
  if (cfg.ready) {
    const client = getS3(cfg.R2_ENDPOINT!, cfg.R2_ACCESS_KEY_ID!, cfg.R2_SECRET_ACCESS_KEY!);
    await client.send(
      new PutObjectCommand({
        Bucket: cfg.R2_BUCKET!,
        Key: name,
        Body: buf,
        ContentType: file.type || "application/octet-stream",
      }),
    );
    const base = cfg.R2_PUBLIC_URL!.replace(/\/$/, "");
    return { url: `${base}/${name}` };
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), buf);
  return { url: `/uploads/${name}` };
}
