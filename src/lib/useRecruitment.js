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

  const logActivity = (id, name, action) => {
    if (!user || !id) return;
    base44.entities.ActivityLog.create({
      entity_type: "RecruitmentCase", entity_id: id, entity_name: name || "",
      action, user_email: user.email, user_name: user.full_name || user.email,
    }).catch(() => {});
  };

  const save = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const payload = { ...data, organization_id: user?.organization_id ?? null };
      if (id) {
        const res = await base44.entities.RecruitmentCase.update(id, payload);
        logActivity(id, data.name, "update");
        return res;
      }
      const created = await base44.entities.RecruitmentCase.create({
        ...payload,
        owner: data.owner || user?.full_name || user?.email || "",
        user_email: user?.email || "",
        user_name: user?.full_name || user?.email || "",
      });
      logActivity(created?.id, data.name, "create");
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: async (c) => {
      await base44.entities.RecruitmentCase.delete(c.id);
      logActivity(c.id, c.name, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { cases, isLoading, save, remove, user };
}
