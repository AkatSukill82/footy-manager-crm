import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";

/**
 * Règles nationales de commission d'agent (cahier ProPulse §6.1).
 * Quand une règle est ACTIVE pour un pays, son plafond est prioritaire sur la
 * grille FIFA théorique dans la vérification de conformité. Partagé dans le
 * groupe (RLS créateur OU même org), éditable par tous (pas de restriction).
 */
const KEY = ["agentRulesNational"];

export function useAgentRules() {
  const qc = useQueryClient();
  const user = useCurrentUser();

  const { data: rules = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => base44.entities.AgentRuleNational.filter({}, "-updated_date", 200),
    staleTime: 60 * 1000,
  });

  const save = useMutation({
    mutationFn: async ({ id, pays, pays_nom, taux_joueur, taux_vendeur, actif }) => {
      const data = {
        pays,
        pays_nom: pays_nom || "",
        taux_joueur: Number(taux_joueur) || 0,
        taux_vendeur: Number(taux_vendeur) || 0,
        actif: actif !== false,
        organization_id: user?.organization_id ?? null,
      };
      if (id) return base44.entities.AgentRuleNational.update(id, data);
      return base44.entities.AgentRuleNational.create({
        ...data,
        user_email: user?.email || "",
        user_name: user?.full_name || user?.email || "",
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: (rule) => base44.entities.AgentRuleNational.delete(rule.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  // Règle active pour un pays (la plus récente).
  const ruleFor = (code) => rules.find((r) => r.pays === code && r.actif !== false) || null;

  return { rules, isLoading, save, remove, ruleFor };
}
