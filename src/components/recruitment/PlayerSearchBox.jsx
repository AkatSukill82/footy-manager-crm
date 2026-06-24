import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2, User } from "lucide-react";
import { searchPlayerCandidates, fetchPlayerProfile } from "@/lib/playerSearchEngine";

/**
 * Recherche joueur — même moteur que la section Joueurs (FotMob → BeSoccer →
 * Transfermarkt + fusion SofaScore). L'utilisateur tape un nom ; on récupère la
 * fiche complète et on la renvoie via onSelect.
 */
export default function PlayerSearchBox({ onSelect, label = "Rechercher un joueur (nom) — récupère ses données" }) {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingFull, setLoadingFull] = useState(false);
  const [candidates, setCandidates] = useState(null);
  const [source, setSource] = useState(null);
  const [error, setError] = useState(null);

  const pick = async (candidate) => {
    setLoadingFull(true); setCandidates(null); setError(null);
    const full = await fetchPlayerProfile(candidate);
    setLoadingFull(false);
    if (full) onSelect?.(full);
    else setError("Profil indisponible pour ce joueur.");
  };

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true); setError(null); setCandidates(null); setSource(null);
    try {
      const { list, source: src } = await searchPlayerCandidates(query.trim());
      setSource(src);
      if (!list.length) { setError(`Aucun joueur trouvé pour « ${query} ». Essayez le nom complet sans accents.`); setLoading(false); return; }
      setLoading(false);
      if (list.length === 1) pick(list[0]);
      else setCandidates(list);
    } catch (e) {
      setError("Erreur de recherche : " + (e?.message || "connexion impossible."));
      setLoading(false);
    }
  };

  const busy = loading || loadingFull;

  return (
    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3 space-y-2">
      <label className="text-[11px] font-medium text-blue-800 flex items-center gap-1.5"><Search className="w-3.5 h-3.5" /> {label}</label>
      <div className="flex gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSearch()} placeholder="ex: Mohammed Kudus" className="h-9 bg-white" />
        <Button onClick={handleSearch} disabled={busy || !query.trim()} size="sm" className="gap-1.5 flex-shrink-0">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />} Rechercher
        </Button>
      </div>

      {loadingFull && <p className="text-[11px] text-slate-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Récupération du profil (Transfermarkt · BeSoccer · FotMob · SofaScore)…</p>}
      {error && <p className="text-[11px] text-red-600">{error}</p>}

      {candidates && candidates.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[11px] text-slate-500">{candidates.length} résultat(s){source ? ` · ${source}` : ""} — choisissez :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {candidates.map((c, i) => (
              <button key={i} onClick={() => pick(c)} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:border-blue-300">
                {c.photo_url ? <img src={c.photo_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" /> : <span className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0"><User className="w-4 h-4 text-slate-400" /></span>}
                <span className="min-w-0">
                  <span className="block text-sm font-medium text-slate-800 truncate">{c.nom}</span>
                  <span className="block text-[11px] text-slate-400 truncate">{[c.club_actuel, c.poste].filter(Boolean).join(" · ") || "—"}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="text-[10px] text-slate-400">Préremplit identité, club, contrat, valeur marchande et stats. À vérifier — sources possiblement incomplètes/datées.</p>
    </div>
  );
}
