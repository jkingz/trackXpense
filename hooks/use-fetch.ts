import { useState } from 'react';
import { toast } from 'sonner';

const useFetch = <A extends unknown[], R>(
  cb: (...args: A) => Promise<R>,
  // Kept as a shape rather than an interface so callers see exactly what the hook returns.
): {
  data: R | undefined;
  loading: boolean;
  error: Error | null;
  fn: (...args: A) => Promise<R | undefined>;
  setData: (data: R | undefined) => void;
} => {
  const [data, setData] = useState<R | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fn = async (...args: A) => {
    setLoading(true);
    setError(null);
    try {
      const data = await cb(...args);
      setData(data);
      setError(null);
      return data;
    } catch (error) {
      setError(error);
      toast.error(error.message);
      return undefined;
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, fn, setData };
};

export default useFetch;
