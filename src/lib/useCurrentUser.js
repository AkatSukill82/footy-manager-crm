import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

/**
 * Single cached query for the current user.
 * All pages share this cache — only ONE request is ever made per session.
 */
export function useCurrentUser() {
  const { data } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: Infinity,
    retry: 1,
  });
  return data ?? null;
}
