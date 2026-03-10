import { useState, useEffect, useCallback } from 'react';
import type { RequestState } from '../types/api';

/**
 * Generic hook for GET-style API calls.
 * Fetches on mount and exposes a refetch function.
 */
export function useApi<T>(fetcher: () => Promise<T>): RequestState<T> & { refetch: () => void } {
  const [state, setState] = useState<RequestState<T>>({
    loading: true,
    error: null,
    data: null,
  });

  const refetch = useCallback(() => {
    setState({ loading: true, error: null, data: null });
    fetcher()
      .then((data) => setState({ loading: false, error: null, data }))
      .catch((err) =>
        setState({
          loading: false,
          error: err instanceof Error ? err.message : String(err),
          data: null,
        }),
      );
  }, [fetcher]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { ...state, refetch };
}
