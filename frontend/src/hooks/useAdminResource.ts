import { useState, useEffect, useCallback, useRef } from "react";
import type { PaginatedResponse } from "@/components/admin/types";

interface UseAdminResourceOptions<T> {
  fetchFn: (...args: unknown[]) => Promise<T[] | PaginatedResponse<T>>;
  paginated?: boolean;
}

interface UseAdminResourceReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  page: number;
  total: number;
  pageSize: number;
  setPage: (page: number) => void;
  refresh: () => void;
}

function isPaginated<T>(result: T[] | PaginatedResponse<T>): result is PaginatedResponse<T> {
  return !Array.isArray(result) && "items" in result;
}

export function useAdminResource<T>({
  fetchFn,
  paginated = false,
}: UseAdminResourceOptions<T>): UseAdminResourceReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pageSize, setPageSize] = useState(50);
  const fetchRef = useRef(fetchFn);
  fetchRef.current = fetchFn;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = paginated ? await fetchRef.current(page, pageSize) : await fetchRef.current();

      if (isPaginated(result)) {
        setData(result.items);
        setTotal(result.total);
        setPageSize(result.pageSize);
      } else {
        setData(result);
        setTotal(result.length);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, paginated]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    data,
    loading,
    error,
    page,
    total,
    pageSize,
    setPage,
    refresh: load,
  };
}
