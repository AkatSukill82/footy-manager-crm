import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlayerSearchBox from "./PlayerSearchBox";
import { addPlayerAsProspect } from "@/lib/addProspect";
import { Button } from "@/components/ui/button";
import { UserPlus, CheckCircle2, Loader2, User } from "lucide-react";

/**
 * Repérer un joueur (moteur de recherche) et l'AJOUTER à la liste comme PROSPECT
 * en un clic (cf. addPlayerAsProspect).
 */
export default function ProspectFinder() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [found, setFound] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);
  const [error, setError] = useState(null);

  const add = async () => {
    if (!found) return;
    setSaving(true); setError(null);
    const res = await addPlayerAsProspect(found);
    setSaving(false);
    if (res.error) { setError(res.error); return; }
    if (res.exists) { setDone({ exists: true, nom: res.nom }); return; }
    qc.invalidateQueries({ queryKey: ["players"] });
    qc.invalidateQueries({ queryKey: ["watchList"] });
    setDone({ id: res.id, nom: res.nom });
    setFound(null);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 space-y-3">
      <div>
        <h3 className="font-semibold text-slate-800 text-sm flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-green-600" /> Repérer et ajouter un prospect</h3>
        <p className="text-xs text-slate-500">Cherche un joueur, puis ajoute-le à ta liste en un clic — il sera marqué <b>prospect (Veille)</b> et mis en watchlist.</p>
      </div>

      <PlayerSearchBox onSelect={(p) => { setFound(p); setDone(null); setError(null); }} label="Chercher un joueur à ajouter en prospect" />

      {found && (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 p-2.5">
          <div className="flex items-center gap-2 min-w-0">
            {found.photo_url
              ? <img src={found.photo_url} alt="" className="w-9 h-9 rounded-full object-cover flex-shrink-0" referrerPolicy="no-referrer" onError={(e) => (e.target.style.display = "none")} />
              : <span className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-slate-400" /></span>}
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-800 truncate">{found.nom}</p>
              <p className="text-[11px] text-slate-400 truncate">{[found.club_actuel, found.poste, found.valeur_marchande ? `${found.valeur_marchande}M€` : null].filter(Boolean).join(" · ") || "—"}</p>
            </div>
          </div>
          <Button onClick={add} disabled={saving} size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5 flex-shrink-0">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Ajouter en prospect
          </Button>
        </div>
      )}

      {done?.exists && <p className="text-xs text-amber-600">« {done.nom} » est déjà dans ta liste — pas de doublon créé.</p>}
      {done?.id && (
        <p className="text-xs text-green-700 flex items-center gap-1.5 flex-wrap">
          <CheckCircle2 className="w-4 h-4" /> « {done.nom} » ajouté en prospect.
          <button onClick={() => navigate(createPageUrl("PlayerDetail") + "?id=" + done.id)} className="underline hover:text-green-800">Ouvrir la fiche</button>
        </p>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
