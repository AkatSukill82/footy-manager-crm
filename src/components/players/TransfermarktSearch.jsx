import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, UserPlus, Check, User } from "lucide-react";
import { sanitizePlayerData } from "../../utils";

const POSTES_MAP = {
  Goalkeeper: "Gardien",
  Defender: "Défenseur central",
  Midfielder: "Milieu central",
  Attacker: "Attaquant",
};

export default function TransfermarktSearch({ onComplete }) {
  const queryClient = useQueryClient();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importingId, setImportingId] = useState(null);
  const [importedIds, setImportedIds] = useState(new Set());
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    setResults([]);
    const res = await base44.functions.invoke("apiFootballProxy", {
      action: "searchPlayer",
      name: query.trim(),
    });
    setResults(res.data?.players || []);
    setLoading(false);
  };

  const handleImport = async (player) => {
    setImportingId(player.id);
    // Optionally fetch full profile with stats
    let fullPlayer = player;
    try {
      const res = await base44.functions.invoke("apiFootballProxy", {
        action: "getPlayer",
        id: player.id,
      });
      if (res.data?.ok && res.data?.player) {
        fullPlayer = res.data.player;
      }
    } catch {}

    const st = fullPlayer.stats_saison || {};
    const playerData = sanitizePlayerData({
      nom: fullPlayer.nom,
      age: fullPlayer.age,
      date_naissance: fullPlayer.date_naissance,
      lieu_naissance: fullPlayer.lieu_naissance,
      nationalite: fullPlayer.nationalite,
      photo_url: fullPlayer.photo_url,
      taille: fullPlayer.taille,
      poids: fullPlayer.poids,
      poste: fullPlayer.poste || "Milieu central",
      numero_maillot: fullPlayer.numero_maillot,
      club_actuel: fullPlayer.club_actuel,
      ligue: fullPlayer.ligue,
      pays_ligue: fullPlayer.pays_ligue,
      matchs_joues: st.matchs,
      titularisations: st.titulaire,
      minutes_jouees: st.minutes,
      buts: st.buts,
      passes_decisives: st.passes_decisives,
      cartons_jaunes: st.cartons_jaunes,
      cartons_rouges: st.cartons_rouges,
      tirs: st.tirs,
      tirs_cadres: st.tirs_cadres,
      passes_cles: st.passes_cles,
      dribbles_tentes: st.dribbles_tentes,
      dribbles_reussis: st.dribbles_reussis,
      tacles: st.tacles,
      interceptions: st.interceptions,
      fautes_commises: st.fautes_commises,
      fautes_subies: st.fautes_subies,
    });

    await base44.entities.Player.create(playerData);
    queryClient.invalidateQueries({ queryKey: ["players"] });
    setImportedIds((prev) => new Set([...prev, player.id]));
    setImportingId(null);
    onComplete?.();
  };

  return (
    <div className="space-y-6">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          placeholder="Rechercher un joueur (ex: Mbappé, Salah...)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
        <Button type="submit" disabled={loading || !query.trim()} className="bg-green-600 hover:bg-green-700">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          <span className="ml-2 hidden sm:inline">Rechercher</span>
        </Button>
      </form>

      {/* Results */}
      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="text-center py-12 text-slate-500">
          <User className="w-10 h-10 mx-auto mb-3 text-slate-300" />
          <p>Aucun joueur trouvé pour "{query}"</p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-slate-500">{results.length} résultat{results.length > 1 ? "s" : ""}</p>
          <div className="divide-y divide-slate-100 bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            {results.map((player) => {
              const imported = importedIds.has(player.id);
              const isImporting = importingId === player.id;
              return (
                <div key={player.id} className="flex items-center gap-4 p-4 hover:bg-slate-50 transition-colors">
                  {/* Photo */}
                  <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0 border border-slate-200">
                    {player.photo_url ? (
                      <img src={player.photo_url} alt={player.nom} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = "none"; }} />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 truncate">{player.nom}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {player.nationalite && (
                        <span className="text-xs text-slate-500">{player.nationalite}</span>
                      )}
                      {player.age && (
                        <span className="text-xs text-slate-400">• {player.age} ans</span>
                      )}
                      {player.poste && (
                        <Badge variant="outline" className="text-xs py-0">{player.poste}</Badge>
                      )}
                      {player.club_actuel && (
                        <span className="text-xs text-slate-500">• {player.club_actuel}</span>
                      )}
                      {player.ligue && (
                        <span className="text-xs text-slate-400">({player.ligue})</span>
                      )}
                    </div>
                  </div>

                  {/* Import button */}
                  <Button
                    size="sm"
                    variant={imported ? "outline" : "default"}
                    disabled={imported || isImporting}
                    onClick={() => handleImport(player)}
                    className={imported ? "text-green-600 border-green-200" : "bg-green-600 hover:bg-green-700"}
                  >
                    {isImporting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : imported ? (
                      <><Check className="w-4 h-4 mr-1" />Importé</>
                    ) : (
                      <><UserPlus className="w-4 h-4 mr-1" />Importer</>
                    )}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}