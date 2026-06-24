import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { useCurrentUser } from "@/lib/useCurrentUser";

/**
 * Persistance des simulations du Simulateur de transfert (ProPulse).
 *
 * Modèle : 1 simulation = 1 enregistrement (on ÉCRASE à chaque sauvegarde).
 * Partage : visible par tout le groupe (organization_id) — la RLS Base44
 * autorise « créateur OU même groupe ». Chaque action (create/update/delete)
 * est tracée dans ActivityLog → l'admin voit qui a fait quoi (réutilise
 * ActivityLogList avec entity_type="TransferSimulation").
 *
 * Les `inputs` sont stockés en JSON stringifié pour rouvrir et re-modifier
 * exactement les chiffres saisis.
 */
const KEY = ["transferSimulations"];

export function useSimulations(module) {
  const qc = useQueryClient();
  const user = useCurrentUser();

  const { data: all = [], isLoading } = useQuery({
    queryKey: KEY,
    queryFn: () => base44.entities.TransferSimulation.filter({}, "-updated_date", 200),
    staleTime: 60 * 1000,
  });

  const simulations = module ? all.filter((s) => s.module === module) : all;

  const logActivity = (sim, action, fields = []) => {
    if (!user || !sim?.id) return;
    base44.entities.ActivityLog.create({
      entity_type: "TransferSimulation",
      entity_id: sim.id,
      entity_name: sim.nom || "",
      action,
      champs_modifies: JSON.stringify(fields),
      user_email: user.email,
      user_name: user.full_name || user.email,
    }).catch(() => {});
  };

  const save = useMutation({
    // { id?, nom, module, player_id, player_name, inputs (objet), resume }
    mutationFn: async ({ id, nom, module: mod, player_id, player_name, inputs, resume }) => {
      const base = {
        nom: (nom || "").trim() || "Simulation sans nom",
        module: mod,
        player_id: player_id || "",
        player_name: player_name || "",
        inputs: JSON.stringify(inputs ?? {}),
        resume: resume || "",
        organization_id: user?.organization_id ?? null,
      };
      if (id) {
        const data = {
          ...base,
          updated_by_email: user?.email || "",
          updated_by_name: user?.full_name || user?.email || "",
        };
        await base44.entities.TransferSimulation.update(id, data);
        logActivity({ id, nom: base.nom }, "update", ["inputs"]);
        return { id, ...data };
      }
      const created = await base44.entities.TransferSimulation.create({
        ...base,
        user_email: user?.email || "",
        user_name: user?.full_name || user?.email || "",
      });
      logActivity(created, "create");
      return created;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  const remove = useMutation({
    mutationFn: async (sim) => {
      await base44.entities.TransferSimulation.delete(sim.id);
      logActivity(sim, "delete");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });

  return { simulations, isLoading, save, remove, user };
}
