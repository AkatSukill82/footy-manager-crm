import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Save, FolderOpen, Copy, Trash2, FilePlus2, Loader2, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import ActivityLogList from "@/components/activity/ActivityLogList";
import { useSimulations } from "@/lib/useSimulations";

/**
 * Barre de sauvegarde commune aux modules du simulateur.
 *
 * - Enregistre les `inputs` du module courant (écrase si une simu est ouverte).
 * - Liste « Mes simulations » du groupe : ouvrir / dupliquer / supprimer.
 * - Affiche le créateur, le dernier modificateur et l'historique (ActivityLog).
 *
 * Props :
 *   module      clé du module ("salaire" | "transfert" | "scenarios" | …)
 *   inputs      objet sérialisable de l'état courant du module
 *   resume      résumé lisible des résultats (string) pour la liste
 *   playerId/playerName  joueur lié (optionnel)
 *   onLoad(inputs)       hydrate le module quand on ouvre une simulation
 *   canSave     bool — désactive l'enregistrement si rien à sauver
 */
export default function SaveBar({ module, inputs, resume, playerId, playerName, onLoad, canSave = true }) {
  const { simulations, save, remove, user } = useSimulations(module);
  const [nom, setNom] = useState("");
  const [loaded, setLoaded] = useState(null); // simulation ouverte (ou null = nouvelle)
  const [panelOpen, setPanelOpen] = useState(false);

  const handleSave = () => {
    save.mutate(
      { id: loaded?.id, nom, module, player_id: playerId, player_name: playerName, inputs, resume },
      { onSuccess: (sim) => { setLoaded((prev) => ({ ...prev, ...sim })); setNom(sim.nom); } }
    );
  };

  const handleOpen = (sim) => {
    let parsed = {};
    try { parsed = JSON.parse(sim.inputs || "{}"); } catch { parsed = {}; }
    onLoad?.(parsed);
    setLoaded(sim);
    setNom(sim.nom);
    setPanelOpen(false);
  };

  const handleDuplicate = (sim) => {
    let parsed = {};
    try { parsed = JSON.parse(sim.inputs || "{}"); } catch { parsed = {}; }
    onLoad?.(parsed);
    setLoaded(null); // détache → la prochaine sauvegarde crée une copie
    setNom(`${sim.nom} (copie)`);
    setPanelOpen(false);
  };

  const handleNew = () => { setLoaded(null); setNom(""); };

  const handleDelete = (sim) => {
    if (!window.confirm(`Supprimer la simulation « ${sim.nom} » ? Cette action est définitive.`)) return;
    remove.mutate(sim, {
      onSuccess: () => { if (loaded?.id === sim.id) handleNew(); },
    });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60">
      {/* Ligne d'action */}
      <div className="flex flex-wrap items-center gap-2 p-2.5">
        <Input
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder={loaded ? loaded.nom : "Nom de la simulation…"}
          className="h-9 flex-1 min-w-[160px] bg-white"
        />
        <Button onClick={handleSave} size="sm" disabled={!canSave || save.isPending} className="gap-1.5">
          {save.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {loaded ? "Mettre à jour" : "Enregistrer"}
        </Button>
        {loaded && (
          <Button onClick={handleNew} size="sm" variant="ghost" className="gap-1.5 text-slate-500">
            <FilePlus2 className="w-4 h-4" /> Nouveau
          </Button>
        )}
        <Button onClick={() => setPanelOpen((o) => !o)} size="sm" variant="outline" className="gap-1.5">
          <FolderOpen className="w-4 h-4" /> Mes simulations
          {simulations.length > 0 && (
            <span className="ml-0.5 rounded-full bg-slate-200 px-1.5 text-[11px] font-semibold text-slate-600">{simulations.length}</span>
          )}
        </Button>
      </div>

      {/* Bandeau « simulation ouverte » */}
      {loaded && (
        <div className="flex items-center gap-1.5 px-3 pb-2 text-[11px] text-slate-500">
          <User className="w-3 h-3" />
          Créée par <b className="text-slate-600">{loaded.user_name || loaded.user_email || "—"}</b>
          {loaded.updated_by_name && loaded.updated_date && (
            <> · modifiée par <b className="text-slate-600">{loaded.updated_by_name}</b> {formatDistanceToNow(new Date(loaded.updated_date), { addSuffix: true, locale: fr })}</>
          )}
        </div>
      )}

      {/* Panneau liste */}
      {panelOpen && (
        <div className="border-t border-slate-200 p-2.5 space-y-2">
          {simulations.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-3">Aucune simulation enregistrée pour ce module.</p>
          )}
          {simulations.map((sim) => (
            <div key={sim.id} className={`flex items-center gap-2 rounded-lg border px-3 py-2 bg-white ${loaded?.id === sim.id ? "border-blue-300 ring-1 ring-blue-100" : "border-slate-200"}`}>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 truncate">{sim.nom}</p>
                <p className="text-[11px] text-slate-400 truncate">
                  {sim.resume || "—"}
                  {sim.player_name ? ` · ${sim.player_name}` : ""}
                  {" · "}{sim.user_name || sim.user_email}
                </p>
              </div>
              <button onClick={() => handleOpen(sim)} title="Ouvrir" className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"><FolderOpen className="w-4 h-4" /></button>
              <button onClick={() => handleDuplicate(sim)} title="Dupliquer" className="p-1.5 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"><Copy className="w-4 h-4" /></button>
              <button onClick={() => handleDelete(sim)} title="Supprimer" className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Historique « qui a fait quoi » de la simulation ouverte */}
      {loaded && (
        <div className="border-t border-slate-200 p-2.5">
          <ActivityLogList entityId={loaded.id} entityType="TransferSimulation" />
        </div>
      )}
    </div>
  );
}
