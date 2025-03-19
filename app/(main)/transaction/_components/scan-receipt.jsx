'use client';

import { scanReceipt } from '@/actions/transaction';
import { Button } from '@/components/ui/button';
import useFetch from '@/hooks/use-fetch';
import { Camera, Loader2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { toast } from 'sonner';

const ReceiptScanner = ({ onScanComplete }) => {
  const fileInputRef = useRef(null);
  const {
    loading: scanLoading,
    data: scannedData,
    fn: scanFn,
  } = useFetch(scanReceipt);

  const handleReceiptScan = async (file) => {
    // check if file is more than 5mb
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size is too large');
      return;
    }
    await scanFn(file);
  };

  useEffect(() => {
    if (scannedData && !scanLoading) {
      onScanComplete(scannedData);
      toast.success('Receipt scanned successfully');
    }
  }, [scannedData, scanLoading]);
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
        disabled={scanLoading}
      >
        {scanLoading ? (
          <>
            <Loader2 className="mr-2 animate-spin" /> Scanning...
          </>
        ) : (
          <>
            <Camera className="mr-2" />
            <span>Scan Receipt with AI</span>
          </>
        )}
      </Button>
    </div>
  );
};

export default ReceiptScanner;
