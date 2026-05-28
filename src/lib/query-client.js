import { QueryClient, keepPreviousData } from '@tanstack/react-query';

const FOUR_HOURS = 4 * 60 * 60 * 1000;

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime:       FOUR_HOURS,
			gcTime:          30 * 60 * 1000,
			placeholderData: keepPreviousData,
			refetchInterval: FOUR_HOURS,
		},
	},
});