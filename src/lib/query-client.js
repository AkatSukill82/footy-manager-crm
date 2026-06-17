import { QueryClient, keepPreviousData } from '@tanstack/react-query';

const FOUR_HOURS = 4 * 60 * 60 * 1000;

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime:       FOUR_HOURS,
			gcTime:          60 * 60 * 1000, // 1h — garde les données plus longtemps entre navigations
			placeholderData: keepPreviousData,
			// refetchInterval supprimé — le staleTime suffit, le polling arrière-plan est inutile
		},
	},
});