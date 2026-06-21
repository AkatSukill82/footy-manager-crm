import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { setCurrentOrgId } from '@/lib/org';

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
  // Mémorise l'organization_id (groupe) pour le rattachement auto des créations.
  useEffect(() => { setCurrentOrgId(data?.organization_id ?? null); }, [data?.organization_id]);
  return data ?? null;
}
