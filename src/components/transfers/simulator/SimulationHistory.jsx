import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FolderOpen, Trash2, History, User, Globe, Save, Pencil, Plus } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { useSimulations } from "@/lib/useSimulations";
import { useAgentRules } from "@/lib/useAgentRules";
import { PAYS_CODES, getTaxProfile } from "@/lib/taxProfiles";
import SimulationAuditLog from "./SimulationAuditLog";

const EMPTY_RULE = { id: null, pays: "FR", taux_joueur: "3", taux_vendeur: "10", actif: true };

/** Éditeur des règles nationales de commission d'agent (cahier §6.1). */
function AgentRulesEditor() {
  const { rules, save, remove } = useAgentRules();
  const [form, setForm] = useState(EMPTY_RULE);

  const submit = () => {
    const p = getTaxProfile(form.pays);
    save.mutate({ ...form, pays_nom: p?.nom || form.pays }, { onSuccess: () => setForm(EMPTY_RULE) });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-400" /> Règles nationales d'agents
        </CardTitle>
        <p className="text-xs text-slate-500">Plafonds de commission par pays. Une règle active est prioritaire sur la grille FIFA dans la Simulation 360. Éditable par tous.</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((r) => (
          <div key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
            <div className="flex-1 min-w-0">
              <span className="font-medium text-slate-800">{getTaxProfile(r.pays)?.drapeau} {r.pays_nom || r.pays}</span>
              <span className="text-slate-400 text-xs"> · joueur {r.taux_joueur}% · vendeur {r.taux_vendeur}%</span>
              {r.actif === false && <span className="ml-1 text-[10px] text-slate-400">(inactive)</span>}
            </div>
            <button onClick={() => setForm({ id: r.id, pays: r.pays, taux_joueur: String(r.taux_joueur), taux_vendeur: String(r.taux_vendeur), actif: r.actif !== false })} className="p-1.5 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50"><Pencil className="w-3.5 h-3.5" /></button>
            <button onClick={() => remove.mutate(r)} className="p-1.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 items-end border-t border-slate-100 pt-3">
          <div className="col-span-2 sm:col-span-1">
            <label className="text-[11px] text-slate-500 mb-1 block">Pays</label>
            <Select value={form.pays} onValueChange={(v) => setForm({ ...form, pays: v })}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>{PAYS_CODES.map((c) => { const p = getTaxProfile(c); return <SelectItem key={c} value={c}>{p.drapeau} {p.nom}</SelectItem>; })}</SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Plafond joueur (%)</label>
            <Input type="number" min="0" value={form.taux_joueur} onChange={(e) => setForm({ ...form, taux_joueur: e.target.value })} className="h-9" />
          </div>
          <div>
            <label className="text-[11px] text-slate-500 mb-1 block">Plafond vendeur (%)</label>
            <Input type="number" min="0" value={form.taux_vendeur} onChange={(e) => setForm({ ...form, taux_vendeur: e.target.value })} className="h-9" />
          </div>
          <label className="flex items-center gap-1.5 text-xs text-slate-600 h-9">
            <input type="checkbox" checked={form.actif} onChange={(e) => setForm({ ...form, actif: e.target.checked })} /> Active
          </label>
          <Button onClick={submit} size="sm" disabled={save.isPending} className="gap-1.5 h-9">
            {form.id ? <Save className="w-4 h-4" /> : <Plus className="w-4 h-4" />}{form.id ? "Mettre à jour" : "Ajouter"}
          </Button>
        </div>
        {form.id && (
          <button onClick={() => setForm(EMPTY_RULE)} className="text-[11px] text-slate-400 hover:text-slate-600">Annuler la modification</button>
        )}
      </CardContent>
    </Card>
  );
}

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

      <AgentRulesEditor />
    </div>
  );
}
