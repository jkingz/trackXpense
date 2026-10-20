"use client";

import { Camera } from "lucide-react";
import { useEffect, useRef } from "react";
import { toast } from "sonner";

import { scanReceipt } from "@/actions/transaction";
import { Button } from "@/components/ui/button";
import useFetch from "@/hooks/use-fetch";

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
    // check if file is more than 5mb
    if (file.size > 5 * 1024 * 1024) {
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
          .then((r) => r.json())
          .then((json: { url?: string }) => {
            onScanComplete({ ...scannedData, receiptUrl: json.url });
            toast.success("Receipt scanned successfully");
          })
          .catch(() => {
            onScanComplete(scannedData);
            toast.success("Receipt scanned successfully");
          });
      } else {
        onScanComplete(scannedData);
        toast.success("Receipt scanned successfully");
      }
    }
  }, [scannedData, scanLoading, onScanComplete]);
  return (
    <div>
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
        variant="outline"
        className="w-full h-10 bg-gradient-to-br from-orange-500 via-pink-500 to-purple-500 --animate-gradient hover:opacity-90 transition-opacity text-white hover:text-white"
        onClick={() => fileInputRef.current?.click()}
        loading={scanLoading}
      >
        <Camera className="mr-2" />
        <span>{scanLoading ? "Scanning" : "Scan Receipt with AI"}</span>
      </Button>
    </div>
  );
};

export default ReceiptScanner;
