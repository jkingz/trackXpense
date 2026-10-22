import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockSend, mockMkdir, mockWriteFile } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
}));

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(function () {
    return { send: mockSend };
  }),
  PutObjectCommand: vi.fn(function (input) {
    return input;
  }),
}));

vi.mock("node:fs/promises", () => ({
  mkdir: mockMkdir,
  writeFile: mockWriteFile,
}));

import { uploadReceipt } from "@/lib/storage";

const R2_VARS = [
  "R2_ENDPOINT",
  "R2_BUCKET",
  "R2_ACCESS_KEY_ID",
  "R2_SECRET_ACCESS_KEY",
  "R2_PUBLIC_URL",
] as const;

function setRemoteEnv() {
  process.env.R2_ENDPOINT = "https://e.r2.cloudflarestorage.com";
  process.env.R2_BUCKET = "b";
  process.env.R2_ACCESS_KEY_ID = "ak";
  process.env.R2_SECRET_ACCESS_KEY = "sk";
  process.env.R2_PUBLIC_URL = "https://pub.r2.dev";
}

function clearR2Env() {
  for (const k of R2_VARS) delete process.env[k];
}

beforeEach(() => {
  mockSend.mockReset();
  mockMkdir.mockReset();
  mockWriteFile.mockReset();
  clearR2Env();
});

afterEach(() => {
  clearR2Env();
});

describe("uploadReceipt", () => {
  it("writes to local disk and returns /uploads/<name> when R2 is unset", async () => {
    const file = new File(["hi"], "a.txt", { type: "text/plain" });
    const res = await uploadReceipt(file);
    expect(mockMkdir).toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
    expect(res.url).toMatch(/^\/uploads\/.+\.txt$/);
  });

  it("uploads to R2 and returns the public URL when configured", async () => {
    setRemoteEnv();
    mockSend.mockResolvedValue({});
    const file = new File(["hi"], "a.txt", { type: "text/plain" });
    const res = await uploadReceipt(file);
    expect(mockSend).toHaveBeenCalled();
    const cmd = mockSend.mock.calls[0][0] as { Bucket: string; Key: string; ContentType: string };
    expect(cmd.Bucket).toBe("b");
    expect(cmd.Key).toMatch(/\.txt$/);
    expect(cmd.ContentType).toBe("text/plain");
    expect(res.url).toMatch(/^https:\/\/pub\.r2\.dev\/.+\.txt$/);
    expect(mockWriteFile).not.toHaveBeenCalled();
  });

  it("propagates upload failures", async () => {
    setRemoteEnv();
    mockSend.mockRejectedValue(new Error("boom"));
    const file = new File(["hi"], "a.txt", { type: "text/plain" });
    await expect(uploadReceipt(file)).rejects.toThrow("boom");
  });

  it("falls back to local disk when R2_PUBLIC_URL is missing", async () => {
    process.env.R2_ENDPOINT = "https://e.r2.cloudflarestorage.com";
    process.env.R2_BUCKET = "b";
    process.env.R2_ACCESS_KEY_ID = "ak";
    process.env.R2_SECRET_ACCESS_KEY = "sk";
    const file = new File(["hi"], "a.txt", { type: "text/plain" });
    const res = await uploadReceipt(file);
    expect(mockSend).not.toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(res.url).toMatch(/^\/uploads\/.+\.txt$/);
  });
});
