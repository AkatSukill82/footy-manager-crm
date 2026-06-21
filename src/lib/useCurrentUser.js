import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { setCurrentOrg } from '@/lib/org';

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

  // Le groupe de l'utilisateur : sert à savoir s'il est le CHEF (créateur) →
  // seul le chef partage ses données (organization_id marqué à la création).
  const orgId = data?.organization_id ?? null;
  const { data: myGroup } = useQuery({
    queryKey: ['myGroupOrg', orgId],
    queryFn: async () => (await base44.entities.Organization.filter({ id: orgId }))[0] ?? null,
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const isChef = !!(myGroup && data && myGroup.created_by_id === data.id);
    setCurrentOrg(orgId, isChef);
  }, [orgId, myGroup?.created_by_id, data?.id]);

  return data ?? null;
}
