import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,        // données jamais périmées automatiquement
      gcTime: 1000 * 60 * 30,    // gardées en mémoire 30 min
      refetchOnMount: false,      // pas de rechargement à l'ouverture d'une page
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});
