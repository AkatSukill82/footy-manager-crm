import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";

/**
 * Persistance des dossiers de recrutement (RecruitmentCase). Partagé dans le
 * groupe (RLS créateur OU même org). Le créateur/responsable est conservé.
 */
const KEY = ["recruitmentCases"];

export function useRecruitment() {
  const qc = useQueryClient();
  const user = useCurrentUser();

  const { data: cases = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => base44.entities.RecruitmentCase.filter({}, "-updated_date", 300),
    staleTime: 30 * 1000,
  });

  const save = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const payload = { ...data, organization_id: user?.organization_id ?? null };
      if (id) return base44.entities.RecruitmentCase.update(id, payload);
      return base44.entities.RecruitmentCase.create({
        ...payload,
        owner: data.owner || user?.full_name || user?.email || "",
        user_email: user?.email || "",
        user_name: user?.full_name || user?.email || "",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: (c) => base44.entities.RecruitmentCase.delete(c.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { cases, isLoading, save, remove, user };
}
