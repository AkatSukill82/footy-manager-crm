import { QueryClient, keepPreviousData } from '@tanstack/react-query';

export const queryClientInstance = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			retry: 1,
			staleTime:       3 * 60 * 1000,  // fraîches 3 min → pas de re-fetch à chaque navigation
			gcTime:          10 * 60 * 1000, // garde en mémoire 10 min
			placeholderData: keepPreviousData, // affiche l'ancien résultat pendant le refresh → pas de spinner blanc
		},
	},
});