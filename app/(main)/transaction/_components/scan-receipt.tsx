"use client";

import { Camera } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { scanReceipt } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";
import { MAX_RECEIPT_BYTES } from "@/lib/schema";

export type ScannedReceipt = Awaited<ReturnType<typeof scanReceipt>> & { receiptUrl?: string };

const ReceiptScanner = ({
  onScanComplete,
}: {
  onScanComplete: (data: ScannedReceipt) => void | Promise<void>;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastFileRef = useRef<File | null>(null);
  const { loading: scanLoading, data: scannedData, fn: scanFn } = useFetch(scanReceipt);

  const handleReceiptScan = async (file: File) => {
    // The route caps at the same constant; this only avoids a wasted round-trip.
    if (file.size > MAX_RECEIPT_BYTES) {
      toast.error("File size is too large");
      return;
    }
    lastFileRef.current = file;
    await scanFn(file);
  };

  useEffect(() => {
    if (scannedData && !scanLoading) {
      const file = lastFileRef.current;
      if (file) {
        const form = new FormData();
        form.append("file", file);
        fetch("/api/receipts", { method: "POST", body: form })
          .then((r) => (r.ok ? r.json() : Promise.reject(new Error("upload failed"))))
          .then((json: { url?: string }) => {
            onScanComplete({ ...scannedData, receiptUrl: json.url });
            toast.success("Receipt scanned successfully");
          })
          .catch(() => {
            // The extraction succeeded even when the image was not stored.
            onScanComplete(scannedData);
            toast.error("Receipt scanned, but the image could not be saved");
          });
      } else {
        onScanComplete(scannedData);
        toast.success("Receipt scanned successfully");
      }
    }
  }, [scannedData, scanLoading, onScanComplete]);
  return (
    <div className="shrink-0">
      <input
        type="file"
        className="hidden"
        accept="image/*"
        capture="environment"
        ref={fileInputRef}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleReceiptScan(file);
        }}
      />
      <Button
        type="button"
        variant="ghost"
        className="h-10 rounded-xl border border-dashed border-indigo/50 px-4 font-semibold text-indigo hover:bg-indigo/5 hover:text-indigo dark:border-indigo-soft/50 dark:text-indigo-soft"
        onClick={() => fileInputRef.current?.click()}
        loading={scanLoading}
      >
        <Camera aria-hidden className="size-4" />
        <span>{scanLoading ? "Reading receipt" : "Fill from a receipt"}</span>
      </Button>
    </div>
  );
};

export default ReceiptScanner;
