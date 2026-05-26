import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../lib/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, List, Search } from "lucide-react";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import PlayerCard from "../components/players/PlayerCard";
import AdvancedFilters from "../components/players/AdvancedFilters";
import PlayerForm from "../components/players/PlayerForm";
import TransfermarktSearch from "../components/players/TransfermarktSearch";
import PlayerStatusModal from "../components/players/PlayerStatusModal";

export default function PlayersPage() {
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("liste");
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    poste: "all",
    ageMin: "",
    ageMax: "",
    club: "",
    budgetMax: "",
    contratExpire: "all",
    nationalite: "",
    piedFort: "all"
  });

  const queryClient = useQueryClient();
  const currentUser = useCurrentUser();
  const userEmail = currentUser?.email;
  const [modalPlayer, setModalPlayer] = useState(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('-created_date'),
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowForm(false);
    },
  });

  const addToWatchListMutation = useMutation({
    mutationFn: ({ playerId, statut }) =>
      base44.entities.WatchList.create({ player_id: playerId, statut, priorite: "Moyenne" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
      queryClient.invalidateQueries({ queryKey: ['watchListItem'] });
    },
  });

  const watchListMap = Object.fromEntries(watchList.map(w => [w.player_id, w]));

  const filteredPlayers = players.filter(player => {
    const matchesSearch = !filters.search ||
      player.nom?.toLowerCase().includes(filters.search.toLowerCase()) ||
      player.club_actuel?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesPoste = filters.poste === "all" || player.poste === filters.poste;

    const matchesAge = (!filters.ageMin || player.age >= parseInt(filters.ageMin)) &&
                       (!filters.ageMax || player.age <= parseInt(filters.ageMax));

    const matchesClub = !filters.club ||
      player.club_actuel?.toLowerCase().includes(filters.club.toLowerCase());

    const matchesBudget =
      (!filters.valeurMin || (player.valeur_marchande && player.valeur_marchande >= parseFloat(filters.valeurMin))) &&
      (!filters.valeurMax || !player.valeur_marchande || player.valeur_marchande <= parseFloat(filters.valeurMax));
    const matchesBudgetLegacy = !filters.budgetMax || !player.valeur_marchande || player.valeur_marchande <= parseFloat(filters.budgetMax);

    const matchesContrat = filters.contratExpire === "all" || (() => {
      if (!player.contrat_fin) return false;
      const now = new Date();
      const contractEnd = new Date(player.contrat_fin);
      switch (filters.contratExpire) {
        case "expired": return contractEnd < now;
        case "6months": return contractEnd >= now && contractEnd <= new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        case "1year":   return contractEnd >= now && contractEnd <= new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        default: return true;
      }
    })();

    const matchesNationalite = !filters.nationalite ||
      player.nationalite?.toLowerCase().includes(filters.nationalite.toLowerCase());

    const matchesPied = filters.piedFort === "all" || player.pied_fort === filters.piedFort;

    return matchesSearch && matchesPoste && matchesAge && matchesClub &&
           matchesBudget && matchesBudgetLegacy && matchesContrat && matchesNationalite && matchesPied;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex justify-between items-center mb-4 md:mb-6 gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{t(lang, 'players.title')}</h1>
            <p className="text-slate-600 mt-0.5 text-sm">{t(lang, 'players.count', { count: players.length })}</p>
          </div>
          {activeTab === "liste" && (
            <Button
              onClick={() => setShowForm(!showForm)}
              className="bg-green-600 hover:bg-green-700 flex-shrink-0"
              size="sm"
            >
              <Plus className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">{t(lang, 'players.addPlayer')}</span>
              <span className="md:hidden">{t(lang, 'common.add')}</span>
            </Button>
          )}
        </div>

        {/* Tab toggle */}
        <div className="flex gap-1 p-1 bg-slate-100 rounded-xl mb-6 w-fit">
          <button
            onClick={() => setActiveTab("liste")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "liste"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <List className="w-4 h-4" />
            {t(lang, 'players.myList')}
          </button>
          <button
            onClick={() => setActiveTab("recherche")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === "recherche"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Search className="w-4 h-4" />
            {t(lang, 'players.searchTab')}
          </button>
        </div>

        {/* ── MA LISTE ── */}
        {activeTab === "liste" && (
          <>
            {showForm && (
              <div className="mb-6">
                <PlayerForm
                  onSubmit={(data) => createMutation.mutate(data)}
                  onCancel={() => setShowForm(false)}
                />
              </div>
            )}

            <div className="mb-6">
              <AdvancedFilters onFiltersChange={setFilters} players={players} />
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredPlayers.map((player) => (
                  <PlayerCard
                    key={player.id}
                    player={player}
                    inWatchList={!!watchListMap[player.id]}
                    watchlistItem={watchListMap[player.id]}
                    onAddToWatchlist={watchListMap[player.id] ? undefined : (p) => setModalPlayer(p)}
                  />
                ))}
              </div>
            )}

            {!isLoading && filteredPlayers.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500 text-lg">{t(lang, 'players.noResults')}</p>
              </div>
            )}
          </>
        )}

        {/* ── AJOUTER VIA TRANSFERMARKT ── */}
        {activeTab === "recherche" && (
          <TransfermarktSearch />
        )}

      </div>

      {/* Player status modal */}
      {modalPlayer && (
        <PlayerStatusModal
          player={modalPlayer}
          open={!!modalPlayer}
          onClose={() => setModalPlayer(null)}
          onConfirm={(statut) => addToWatchListMutation.mutateAsync({ playerId: modalPlayer.id, statut })}
        />
      )}
    </div>
  );
}