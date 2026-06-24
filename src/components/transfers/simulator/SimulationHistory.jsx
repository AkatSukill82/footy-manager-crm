import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FolderOpen, Trash2, History, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useSimulations } from "@/lib/useSimulations";
import SimulationAuditLog from "./SimulationAuditLog";

/**
 * Onglet « Historique » de la Simulation 360.
 * Tout le monde peut voir, ouvrir (= rééditer), et supprimer les simulations
 * enregistrées du groupe (aucune restriction admin). Le journal ci-dessous
 * conserve la trace de qui a fait quoi (ActivityLog).
 */
export default function SimulationHistory({ onOpen }) {
  const { simulations, remove } = useSimulations("deal");

  const handleDelete = (sim) => {
    if (!window.confirm(`Supprimer la simulation « ${sim.nom} » ? Cette action est définitive.`)) return;
    remove.mutate(sim);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-slate-400" /> Simulations enregistrées ({simulations.length})
          </CardTitle>
          <p className="text-xs text-slate-500">Tout le monde peut ouvrir, modifier et supprimer. Chaque action est tracée dans le journal ci-dessous.</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {simulations.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-6">Aucune simulation enregistrée pour l'instant.</p>
          )}
          {simulations.map((sim) => (
            <div key={sim.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{sim.nom}</p>
                <p className="text-[11px] text-slate-400 truncate flex items-center gap-1">
                  {sim.resume || "—"}{sim.player_name ? ` · ${sim.player_name}` : ""}
                  <span>· <User className="inline w-3 h-3 -mt-0.5" /> {sim.user_name || sim.user_email}</span>
                  {sim.updated_date ? ` · ${formatDistanceToNow(new Date(sim.updated_date), { addSuffix: true, locale: fr })}` : ""}
                </p>
              </div>
              <button
                onClick={() => onOpen?.({ ...sim })}
                className="text-xs font-medium px-2.5 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 flex items-center gap-1 flex-shrink-0"
              >
                <FolderOpen className="w-3.5 h-3.5" /> Ouvrir
              </button>
              <button onClick={() => handleDelete(sim)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 flex-shrink-0">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4 text-slate-400" /> Journal d'activité — qui a fait quoi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <SimulationAuditLog />
        </CardContent>
      </Card>
    </div>
  );
}
