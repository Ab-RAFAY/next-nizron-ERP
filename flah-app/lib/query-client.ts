/**
 * lib/query-client.ts
 * Central TanStack Query client + AsyncStorage persister for offline caching.
 *
 * Design choices:
 *  - staleTime 5 min  → data considered fresh for 5 min (no refetch on focus)
 *  - gcTime 24 h      → keep inactive cache for 24 h (was "cacheTime" in v4)
 *  - retry 1          → one retry on failure before propagating error
 *  - AsyncStorage persister maxAge 24 h → offline last-known data survives app restarts
 */

import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,          // 5 minutes
      gcTime: 1000 * 60 * 60 * 24,        // 24 hours
      retry: 1,
      refetchOnWindowFocus: false,         // not meaningful in RN; use refetchInterval instead
    },
  },
});

/** Persister that writes the entire cache to AsyncStorage under one key. */
export const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'nizron-rq-cache',
  throttleTime: 1000,                      // debounce writes by 1 s
});

/** Shared helper: get the Bearer token header or return null headers on miss. */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await AsyncStorage.getItem('token');
  if (!token) return {};
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
}
