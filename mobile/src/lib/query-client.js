import { QueryClient } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const queryClientInstance = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: Infinity,           // données jamais périmées automatiquement
      gcTime: 1000 * 60 * 60 * 24,  // gardées en mémoire 24h (doit être >= maxAge)
      refetchOnMount: false,         // pas de rechargement à l'ouverture d'une page
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Persiste le cache dans AsyncStorage — les données survivent aux fermetures de l'app.
// Première ouverture : API appelée une fois. Ouvertures suivantes : données instantanées.
const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  throttleTime: 3000,
});

persistQueryClient({
  queryClient: queryClientInstance,
  persister: asyncStoragePersister,
  maxAge: 1000 * 60 * 60 * 24, // cache valide 24h
});
