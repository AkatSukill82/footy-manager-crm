import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Loader2, Search, AlertCircle, X, SlidersHorizontal, ChevronDown, ChevronUp, Users } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import PlayerCard from "../components/players/PlayerCard";
import AdvancedFilters from "../components/players/AdvancedFilters";
import PlayerForm from "../components/players/PlayerForm";
import TransfermarktSearch from "../components/players/TransfermarktSearch";
import PlayerStatusModal from "../components/players/PlayerStatusModal";

const POSTES_QUICK = [
  { label: "Tous", value: "all" },
  { label: "GK",  value: "Gardien" },
  { label: "DC",  value: "Défenseur central" },
  { label: "LD",  value: "Latéral droit" },
  { label: "LG",  value: "Latéral gauche" },
  { label: "MD",  value: "Milieu défensif" },
  { label: "MC",  value: "Milieu central" },
  { label: "MO",  value: "Milieu offensif" },
  { label: "AD",  value: "Ailier droit" },
  { label: "AG",  value: "Ailier gauche" },
  { label: "ATT", value: "Attaquant" },
];

const PAGE_SIZE = 25;

export default function PlayersPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("liste");
  const [showForm, setShowForm]   = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [quickPoste, setQuickPoste] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [advancedFilters, setAdvancedFilters] = useState({});
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [modalPlayer, setModalPlayer] = useState(null);
  const [mutationError, setMutationError] = useState(null);

  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const userEmail   = currentUser?.email;

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players', currentUser?.id],
    queryFn: () => base44.entities.Player.filter({ created_by_id: currentUser.id }, '-created_date'),
    enabled: !!currentUser?.id,
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: (player) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowForm(false);
      // Auto-fetch photo en arrière-plan si pas déjà une photo
      if (player?.id && player?.nom && !player?.photo_url) {
        base44.functions.invoke("fetchEntityPhoto", {
          type: "player",
          name: player.nom,
          club: player.club_actuel || "",
        }).then(result => {
          if (result?.photo_url) {
            base44.entities.Player.update(player.id, { photo_url: result.photo_url })
              .then(() => queryClient.invalidateQueries({ queryKey: ['players'] }))
              .catch(() => {});
          }
        }).catch(() => {});
      }
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la création du joueur"),
  });

  const addToWatchListMutation = useMutation({
    mutationFn: ({ playerId, statut }) =>
      base44.entities.WatchList.create({ player_id: playerId, statut, priorite: "Moyenne" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
      queryClient.invalidateQueries({ queryKey: ['watchListItem'] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de l'ajout à la watchlist"),
  });

  // Debounce la recherche texte — évite de filtrer à chaque frappe
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 250);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset pagination on filter change
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [debouncedSearch, quickPoste, advancedFilters]);

  const watchListMap = useMemo(
    () => Object.fromEntries(watchList.map(w => [w.player_id, w])),
    [watchList]
  );

  const filteredPlayers = useMemo(() => players.filter(player => {
    // Quick search (debounced)
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      if (!player.nom?.toLowerCase().includes(q) &&
          !player.club_actuel?.toLowerCase().includes(q) &&
          !player.nationalite?.toLowerCase().includes(q))
        return false;
    }

    // Quick poste filter
    if (quickPoste !== "all" && player.poste !== quickPoste) return false;

    // Advanced filters
    const f = advancedFilters;
    if (f.poste && f.poste !== "all" && player.poste !== f.poste) return false;
    if (f.ageMin && player.age < parseInt(f.ageMin)) return false;
    if (f.ageMax && player.age > parseInt(f.ageMax)) return false;
    if (f.club && !player.club_actuel?.toLowerCase().includes(f.club.toLowerCase())) return false;
    if (f.nationalite && !player.nationalite?.toLowerCase().includes(f.nationalite.toLowerCase())) return false;
    if (f.piedFort && f.piedFort !== "all" && player.pied_fort !== f.piedFort) return false;
    if (f.valeurMin && (!player.valeur_marchande || player.valeur_marchande < parseFloat(f.valeurMin))) return false;
    if (f.valeurMax && player.valeur_marchande && player.valeur_marchande > parseFloat(f.valeurMax)) return false;
    if (f.contratExpire && f.contratExpire !== "all") {
      if (!player.contrat_fin) return false;
      const now = new Date(); const end = new Date(player.contrat_fin);
      if (f.contratExpire === "expired" && end >= now) return false;
      if (f.contratExpire === "6months" && (end < now || end > new Date(now.getTime() + 180 * 86400000))) return false;
      if (f.contratExpire === "1year"   && (end < now || end > new Date(now.getTime() + 365 * 86400000))) return false;
    }

    return true;
  }), [players, debouncedSearch, quickPoste, advancedFilters]);

  const visible = filteredPlayers.slice(0, visibleCount);
  const hasMore = visibleCount < filteredPlayers.length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">

        {/* Error banner */}
        {mutationError && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{mutationError}</span>
            <button onClick={() => setMutationError(null)}><X className="w-3.5 h-3.5" /></button>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{t(lang, 'players.title')}</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              {players.length} joueur{players.length !== 1 ? "s" : ""} enregistré{players.length !== 1 ? "s" : ""}
              {filteredPlayers.length !== players.length && ` · ${filteredPlayers.length} affiché${filteredPlayers.length !== 1 ? "s" : ""}`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => { setActiveTab("liste"); setShowForm(f => !f); }}
              className="bg-slate-900 hover:bg-slate-800 gap-2"
              size="sm"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">{t(lang, 'players.addPlayer')}</span>
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-slate-200 rounded-xl w-fit shadow-sm">
          {[
            { key: "liste",     label: "👤 Ma liste" },
            { key: "recherche", label: "🔍 Recherche TM" },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? "bg-slate-900 text-white shadow-sm"
                  : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── MA LISTE ── */}
        {activeTab === "liste" && (
          <>
            {/* Add form */}
            {showForm && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4">
                <PlayerForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}

            {/* Search + position pills */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-3 space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Rechercher par nom, club, nationalité…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 bg-slate-50 border-slate-200 h-9"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2">
                    <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
                  </button>
                )}
              </div>

              {/* Position quick-filter */}
              <div className="flex flex-wrap gap-1.5">
                {POSTES_QUICK.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setQuickPoste(p.value)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      quickPoste === p.value
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {/* Advanced filters toggle */}
              <button
                onClick={() => setShowAdvanced(v => !v)}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Filtres avancés
                {showAdvanced ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>

              {showAdvanced && (
                <div className="pt-1 border-t border-slate-100">
                  <AdvancedFilters
                    onFiltersChange={setAdvancedFilters}
                    players={players}
                  />
                </div>
              )}
            </div>

            {/* List */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-7 h-7 animate-spin text-slate-300" />
              </div>
            ) : filteredPlayers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Users className="w-12 h-12 text-slate-200 mb-3" />
                <p className="text-slate-500 font-medium">
                  {players.length === 0 ? "Aucun joueur enregistré" : "Aucun joueur ne correspond aux filtres"}
                </p>
                {players.length === 0 && (
                  <Button onClick={() => setShowForm(true)} variant="outline" size="sm" className="mt-4 gap-2">
                    <Plus className="w-4 h-4" /> Ajouter un joueur
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                  {visible.map(player => (
                    <PlayerCard
                      key={player.id}
                      player={player}
                      inWatchList={!!watchListMap[player.id]}
                      watchlistItem={watchListMap[player.id]}
                      onAddToWatchlist={watchListMap[player.id] ? undefined : (p) => setModalPlayer(p)}
                    />
                  ))}
                </div>

                {hasMore && (
                  <div className="text-center pt-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVisibleCount(c => c + PAGE_SIZE)}
                      className="text-slate-500 hover:text-slate-800 gap-2"
                    >
                      <ChevronDown className="w-4 h-4" />
                      Voir {Math.min(PAGE_SIZE, filteredPlayers.length - visibleCount)} joueurs de plus
                      <span className="text-slate-400">({filteredPlayers.length - visibleCount} restants)</span>
                    </Button>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── RECHERCHE TRANSFERMARKT ── */}
        {activeTab === "recherche" && <TransfermarktSearch />}

      </div>

      {/* Watchlist modal */}
      {modalPlayer && (
        <PlayerStatusModal
          player={modalPlayer}
          open={!!modalPlayer}
          onClose={() => setModalPlayer(null)}
          onConfirm={(statut) =>
            addToWatchListMutation.mutateAsync({ playerId: modalPlayer.id, statut }).catch(() => {})
          }
        />
      )}
    </div>
  );
}
