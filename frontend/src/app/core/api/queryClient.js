import { QueryClient } from "@tanstack/react-query";

// ── Cache constants ────────────────────────────────────────────────
/** Default stale time — data is served from cache for 5 minutes, then
 *  revalidated silently in the background. */
export const DEFAULT_STALE_TIME = 5 * 60 * 1000;
/** How long to keep unused queries in memory before GC. */
export const DEFAULT_GC_TIME = 15 * 60 * 1000;

// ── Centralized query keys ─────────────────────────────────────────
// Prefixes are used with `invalidateQueries({ queryKey: [prefix] })` so all
// queries under a feature stay in sync when one source of truth changes.
export const dashboardQueryKeys = {
  all: ['dashboard'],
  stats: (year) => ['dashboard', 'stats', year || 'all'],
  activities: (year) => ['dashboard', 'activities', year || 'all'],
  revenue: (year) => ['dashboard', 'revenue', year || 'all'],
};

/**
 * Shared TanStack Query client.
 *
 * - `staleTime: 5 min` — data is served from cache instantly when you revisit
 *   a page, and refreshed SILENTLY in the background once it goes stale
 *   (no more spinner on every navigation).
 * - `refetchOnWindowFocus: true` — background re-sync when the tab regains
 *   focus, without blocking the UI.
 * - `refetchOnMount` / `refetchOnReconnect`: sensible defaults.
 * - A single failed fetch is retried once (transient network blips).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: DEFAULT_STALE_TIME,
      gcTime: DEFAULT_GC_TIME,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
    },
  },
});

export default queryClient;
