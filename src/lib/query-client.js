import { QueryClient, keepPreviousData } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime:       Infinity, // données jamais périmées → 0 re-fetch automatique à la navigation
			gcTime:          30 * 60 * 1000,
			placeholderData: keepPreviousData,
		},
	},
});