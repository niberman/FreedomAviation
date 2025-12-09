import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      refetchOnWindowFocus: false,
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false,
    },
  },
});

// Helper function to invalidate queries by prefix
export function invalidateQueries(prefix: string | string[]) {
  const prefixes = Array.isArray(prefix) ? prefix : [prefix];
  prefixes.forEach((p) => {
    queryClient.invalidateQueries({ queryKey: [p] });
  });
}
