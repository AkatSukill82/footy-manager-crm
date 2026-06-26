import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { withOrg } from "@/lib/org";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import PlayerSearchBox from "./PlayerSearchBox";
import { ensureClubForPlayer } from "@/lib/ensureClub";
import { Button } from "@/components/ui/button";
import { UserPlus, CheckCircle2, Loader2, User } from "lucide-react";

/**
 * Repérer un joueur (moteur de recherche) et l'AJOUTER à la liste comme PROSPECT
 * en un clic : crée la fiche Player, la marque « Veille » (priorité recrutement)
 * et l'ajoute à la watchlist. Anti-doublon par nom.
 */
// Champs Player conservés depuis le profil recherché.
const KEEP = [
  "nom", "age", "date_naissance", "lieu_naissance", "poste", "poste_secondaire",
  "nationalite", "nationalite_secondaire", "club_actuel", "valeur_marchande",
  "photo_url", "taille", "poids", "pied_fort", "contrat_fin", "agent", "agence",
  "numero_maillot", "ligue", "pays_ligue", "transfermarkt_id", "sofascore_id",
  "fotmob_id", "besoccer_id", "matchs_joues", "minutes_jouees", "buts",
  "passes_decisives", "note_moyenne",
];
const norm = (x) => (x || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

export default function ProspectFinder() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [found, setFound] = useState(null);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(null);  // { id, nom } | { exists, nom }
  const [error, setError] = useState(null);

  const addProspect = async () => {
    if (!found) return;
    setSaving(true); setError(null);
    try {
      const existing = await base44.entities.Player.filter({});
      if ((existing || []).some((p) => norm(p.nom) === norm(found.nom))) {
        setDone({ exists: true, nom: found.nom });
        setSaving(false);
        return;
      }
      const payload = {};
      for (const k of KEEP) { if (found[k] != null && found[k] !== "") payload[k] = found[k]; }
      payload.priorite_recrutement = "Veille"; // prospect
      const created = await base44.entities.Player.create(withOrg(payload));
      // Watchlist (best-effort) + club du joueur (pour ses prochains matchs).
      try { await base44.entities.WatchList.create(withOrg({ player_id: created.id, player_nom: found.nom })); } catch { /* ignore */ }
      if (payload.club_actuel) ensureClubForPlayer(payload.club_actuel).then(() => qc.invalidateQueries({ queryKey: ["clubs"] })).catch(() => {});
      qc.invalidateQueries({ queryKey: ["players"] });
      qc.invalidateQueries({ queryKey: ["watchList"] });
      setDone({ id: created.id, nom: found.nom });
      setFound(null);
    } catch (e) { setError(e?.message || "Ajout impossible."); }
    setSaving(false);
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
          <Button onClick={addProspect} disabled={saving} size="sm" className="bg-green-600 hover:bg-green-700 gap-1.5 flex-shrink-0">
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
