import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";
import { withOrg } from "@/lib/org";
import { hydrateConfigCache, serializeConfig, onConfigChange } from "@/lib/recruitmentScoring";

/**
 * Config de scoring recrutement (barèmes, critères, seuils, profil cible)
 * PARTAGÉE dans le groupe (organization_id) — un enregistrement RecruitmentConfig
 * par organisation. Remplace l'ancien stockage localStorage : le cache mémoire du
 * moteur (recruitmentScoring) est hydraté au chargement, avec repli localStorage
 * si l'entité n'est pas encore déployée sur Base44 (aucune régression).
 */
const KEY = ["recruitmentConfig"];

export function useRecruitmentConfig() {
  const qc = useQueryClient();
  const user = useCurrentUser();
  const orgId = user?.organization_id ?? null;
  // Portée : le groupe (organization_id) si présent, sinon l'utilisateur (solo).
  const scope = orgId ? { organization_id: orgId } : (user?.email ? { created_by: user.email } : null);
  const scopeKey = orgId || user?.email || "anon";
  const hydrated = useRef(false);

  const { data: record = null } = useQuery({
    queryKey: [...KEY, scopeKey],
    queryFn: async () => {
      try { return (await base44.entities.RecruitmentConfig.filter(scope, "-updated_date", 1))[0] ?? null; }
      catch { return null; }   // entité non déployée → repli localStorage
    },
    enabled: !!scope,
    staleTime: 5 * 60 * 1000,
  });

  // Hydrate le moteur avec la config d'organisation, une seule fois par montage
  // (évite d'écraser une édition locale par un refetch ultérieur).
  useEffect(() => {
    if (hydrated.current || !record?.config) return;
    try { hydrateConfigCache(JSON.parse(record.config)); hydrated.current = true; } catch { /* ignore */ }
  }, [record]);

  const save = useMutation({
    mutationFn: async () => {
      const config = JSON.stringify(serializeConfig());
      try {
        if (record?.id) return await base44.entities.RecruitmentConfig.update(record.id, { config });
        return await base44.entities.RecruitmentConfig.create(withOrg({ config }));
      } catch { return null; }   // repli localStorage déjà écrit par les setters
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [...KEY, scopeKey] }),
  });

  return { record, save, saving: save.isPending };
}

/**
 * Compteur de version de la config : s'incrémente à chaque changement (édition
 * locale ou hydratation Base44). À mettre dans les deps d'un useMemo pour
 * recalculer un score quand la config change.
 */
export function useConfigVersion() {
  const [v, setV] = useState(0);
  useEffect(() => onConfigChange(() => setV((x) => x + 1)), []);
  return v;
}
