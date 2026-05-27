import { QueryClient } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime: 3 * 60 * 1000, // données fraîches 3 min → pas de re-fetch à chaque navigation
			gcTime:    10 * 60 * 1000, // garde en mémoire 10 min
		},
	},
});