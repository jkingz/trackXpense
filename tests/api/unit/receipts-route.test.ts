import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";

const { mockCheckUser, mockUploadReceipt } = vi.hoisted(() => ({
  mockCheckUser: vi.fn(),
  mockUploadReceipt: vi.fn(),
}));

vi.mock("@/actions/lib/checkUser", () => ({ checkUser: mockCheckUser }));
vi.mock("@/lib/storage", () => ({ uploadReceipt: mockUploadReceipt }));

import { POST } from "@/app/api/receipts/route";
import { MAX_RECEIPT_BYTES } from "@/lib/schema";

const URL = "http://localhost/api/receipts";

function uploadRequest() {
  const body = new FormData();
  body.append("file", new File(["hi"], "receipt.png", { type: "image/png" }));
  return new Request(URL, { method: "POST", body });
}

beforeEach(() => {
  mockCheckUser.mockReset();
  mockUploadReceipt.mockReset();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("POST /api/receipts", () => {
  it("returns 401, reads no body and never uploads when signed out", async () => {
    mockCheckUser.mockRejectedValue(new Error("Sign in required"));
    const formData = vi.spyOn(Request.prototype, "formData");

    const res = await POST(uploadRequest());

    expect(res.status).toBe(401);
    expect(mockUploadReceipt).not.toHaveBeenCalled();
    expect(formData).not.toHaveBeenCalled();
  });

  it("returns 400 when the signed-in request carries no file", async () => {
    mockCheckUser.mockResolvedValue({ id: "u1" });

    const res = await POST(new Request(URL, { method: "POST", body: new FormData() }));

    expect(res.status).toBe(400);
    expect(mockUploadReceipt).not.toHaveBeenCalled();
  });

  it("returns 400 for a non-image file, without uploading", async () => {
    mockCheckUser.mockResolvedValue({ id: "u1" });
    const body = new FormData();
    body.append("file", new File(["x"], "statement.pdf", { type: "application/pdf" }));

    const res = await POST(new Request(URL, { method: "POST", body }));

    expect(res.status).toBe(400);
    expect(mockUploadReceipt).not.toHaveBeenCalled();
  });

  it("returns 413 for a file over the cap, without uploading", async () => {
    mockCheckUser.mockResolvedValue({ id: "u1" });
    const body = new FormData();
    body.append(
      "file",
      new File([new Uint8Array(MAX_RECEIPT_BYTES + 1)], "big.png", { type: "image/png" }),
    );

    const res = await POST(new Request(URL, { method: "POST", body }));

    expect(res.status).toBe(413);
    expect(mockUploadReceipt).not.toHaveBeenCalled();
  });

  it("uploads and returns the url when signed in", async () => {
    mockCheckUser.mockResolvedValue({ id: "u1" });
    mockUploadReceipt.mockResolvedValue({ url: "/uploads/receipt.png" });

    const res = await POST(uploadRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: "/uploads/receipt.png" });
    expect(mockUploadReceipt).toHaveBeenCalledTimes(1);
  });
});
