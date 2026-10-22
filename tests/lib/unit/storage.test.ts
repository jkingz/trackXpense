import { beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockSend, mockMkdir, mockWriteFile } = vi.hoisted(() => ({
  mockSend: vi.fn(),
  mockMkdir: vi.fn(),
  mockWriteFile: vi.fn(),
}));

const envMock = vi.hoisted(() => ({}) as Record<string, string | undefined>);

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

vi.mock("@/lib/env", () => ({ env: envMock }));

import { uploadReceipt } from "@/lib/storage";

function resetEnv() {
  for (const k of Object.keys(envMock)) delete envMock[k];
}

beforeEach(() => {
  mockSend.mockReset();
  mockMkdir.mockReset();
  mockWriteFile.mockReset();
  resetEnv();
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
    Object.assign(envMock, {
      R2_ENDPOINT: "https://e.r2.cloudflarestorage.com",
      R2_BUCKET: "b",
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
      R2_PUBLIC_URL: "https://pub.r2.dev",
    });
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
    Object.assign(envMock, {
      R2_ENDPOINT: "https://e.r2.cloudflarestorage.com",
      R2_BUCKET: "b",
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
      R2_PUBLIC_URL: "https://pub.r2.dev",
    });
    mockSend.mockRejectedValue(new Error("boom"));
    const file = new File(["hi"], "a.txt", { type: "text/plain" });
    await expect(uploadReceipt(file)).rejects.toThrow("boom");
  });

  it("falls back to local disk when R2_PUBLIC_URL is missing", async () => {
    Object.assign(envMock, {
      R2_ENDPOINT: "https://e.r2.cloudflarestorage.com",
      R2_BUCKET: "b",
      R2_ACCESS_KEY_ID: "ak",
      R2_SECRET_ACCESS_KEY: "sk",
    });
    const file = new File(["hi"], "a.txt", { type: "text/plain" });
    const res = await uploadReceipt(file);
    expect(mockSend).not.toHaveBeenCalled();
    expect(mockWriteFile).toHaveBeenCalled();
    expect(res.url).toMatch(/^\/uploads\/.+\.txt$/);
  });
});
