import React, { useState } from "react";
import { withOrg } from "../lib/org";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCurrentUser } from "../lib/useCurrentUser";
import { ensureClubForPlayer } from "../lib/ensureClub";
import { cleanPlayerName } from "../lib/cleanName";
import { Button } from "@/components/ui/button";
import { Plus, Loader2, List, Search, Repeat, CalendarDays, Wallet, FileText, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import PlayerCard from "../components/players/PlayerCard";
import PlayerAvatar from "../components/ui/PlayerAvatar";
import AdvancedFilters from "../components/players/AdvancedFilters";
import PlayerForm from "../components/players/PlayerForm";
import PlayerStatusModal, { STATUTS, statutConfig } from "../components/players/PlayerStatusModal";
import PlayerSearchPage from "./PlayerSearch";

// Nom normalisé pour détecter les doublons (minuscules, sans accents).
const normName = (s) =>
  (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// Vue tableau par statut (catégorie agent). Sans statut → Prospect.
const BOARD_ORDER = ["Prospect", "Client", "Mandaté", "En observation"];

// Âge : champ `age` sinon calculé depuis la date de naissance.
function ageOf(player) {
  if (player.age != null && player.age !== "") return player.age;
  if (!player.date_naissance) return null;
  const d = new Date(player.date_naissance);
  if (isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / (365.25 * 24 * 3600 * 1000));
}

// Couleur du badge contrat selon l'urgence (rouge <6 mois, ambre <12 mois).
function contractColor(dateStr) {
  if (!dateStr) return "text-slate-600 bg-slate-100";
  const m = (new Date(dateStr).getTime() - Date.now()) / (30.44 * 864e5);
  if (isNaN(m)) return "text-slate-600 bg-slate-100";
  if (m < 6) return "text-red-700 bg-red-100";
  if (m < 12) return "text-amber-700 bg-amber-100";
  return "text-slate-600 bg-slate-100";
}

function BoardCard({ player, statut, onOpen, onMove, lang }) {
  const yr = (d) => (d ? String(d).slice(0, 4) : null);
  const age = ageOf(player);
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-sm hover:shadow-md transition-shadow">
      <button onClick={onOpen} className="w-full flex items-center gap-2 text-left mb-2">
        <PlayerAvatar src={player.photo_url} name={player.nom} type="player" club={player.club_actuel}
          entityId={player.id} entityType="Player" className="w-9 h-9 flex-shrink-0" textClassName="text-[10px]" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-semibold text-slate-900 truncate">{player.nom}</p>
            {age != null && <span className="text-[10px] font-medium text-slate-400 flex-shrink-0">{age} {t(lang, "players.yearsShort")}</span>}
          </div>
          <p className="text-[11px] text-slate-400 truncate">
            {player.club_actuel || "—"}{player.valeur_marchande ? ` · ${player.valeur_marchande} M€` : ""}
          </p>
        </div>
      </button>

      {/* Contrat + prêt + salaire */}
      {(player.contrat_fin || player.en_pret || player.salaire != null || player.option_contrat) && (
        <div className="flex flex-wrap items-center gap-1.5 mb-2">
          {player.contrat_fin && (
            <span className={`inline-flex items-center gap-1 text-[10px] rounded px-1.5 py-0.5 ${contractColor(player.contrat_fin)}`}>
              <CalendarDays className="w-3 h-3" /> {t(lang, "players.contractShort")} {yr(player.contrat_fin)}
            </span>
          )}
          {player.salaire != null && player.salaire !== "" && (
            <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 bg-emerald-100 rounded px-1.5 py-0.5">
              <Wallet className="w-3 h-3" /> {player.salaire} M€{t(lang, "players.perYear")}
            </span>
          )}
          {player.en_pret && (
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 bg-amber-100 rounded px-1.5 py-0.5" title={player.club_proprietaire ? `${t(lang, "players.loanFrom")} ${player.club_proprietaire}` : ""}>
              <Repeat className="w-3 h-3" /> {t(lang, "players.loan")}{player.club_proprietaire ? ` · ${player.club_proprietaire}` : ""}{player.pret_fin ? ` → ${yr(player.pret_fin)}` : ""}
            </span>
          )}
          {player.option_contrat && (
            <span className="inline-flex items-center gap-1 text-[10px] text-indigo-700 bg-indigo-100 rounded px-1.5 py-0.5" title={player.option_contrat}>
              <FileText className="w-3 h-3" /> {player.option_contrat}
            </span>
          )}
        </div>
      )}

      <select
        value={statut}
        onChange={(e) => onMove(player, e.target.value)}
        className="w-full text-[11px] h-7 rounded-md border border-slate-200 bg-slate-50 px-1.5 text-slate-600 focus:outline-none focus:ring-1 focus:ring-slate-300"
      >
        {STATUTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
      </select>
    </div>
  );
}

export default function PlayersPage() {
  const navigate = useNavigate();
  const { lang } = useLanguage();
  const [activeTab, setActiveTab] = useState("liste");
  const [showForm, setShowForm] = useState(false);
  const [sortBy, setSortBy] = useState("recent");
  const [cleaning, setCleaning] = useState(false);
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
  const [mutError, setMutError] = useState(null);

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players', currentUser?.id],
    queryFn: () => base44.entities.Player.filter({}, '-created_date'),
    enabled: !!currentUser?.id,
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({}),
    enabled: !!userEmail,
  });

  const createMutation = useMutation({
    mutationFn: (data) => {
      // Anti-doublon : refuse si un joueur du même nom existe déjà.
      const clean = cleanPlayerName(data.nom);
      const existing = players.find((p) => normName(p.nom) === normName(clean));
      if (existing) throw new Error(`« ${clean} » est déjà dans ta liste.`);
      return base44.entities.Player.create(withOrg({ ...data, nom: clean }));
    },
    onSuccess: (created, data) => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowForm(false);
      // Crée automatiquement le club du joueur s'il n'existe pas (pour avoir
      // notamment ses prochains matchs). Non bloquant.
      if (data?.club_actuel) {
        ensureClubForPlayer(data.club_actuel)
          .then((c) => { if (c) queryClient.invalidateQueries({ queryKey: ['clubs'] }); })
          .catch(() => {});
      }
    },
    onError: (e) => setMutError(e?.message || "Erreur lors de l'ajout du joueur."),
  });

  const addToWatchListMutation = useMutation({
    mutationFn: ({ playerId, statut }) =>
      base44.entities.WatchList.create(withOrg({ player_id: playerId, statut, priorite: "Moyenne" })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
      queryClient.invalidateQueries({ queryKey: ['watchListItem'] });
    },
  });

  const watchListMap = Object.fromEntries(watchList.map(w => [w.player_id, w]));

  // Déplacer un joueur dans une autre colonne = upsert de son statut watchlist.
  const setStatusMutation = useMutation({
    mutationFn: async ({ player, statut }) => {
      const existing = watchListMap[player.id];
      if (existing) return base44.entities.WatchList.update(existing.id, { statut });
      return base44.entities.WatchList.create(withOrg({ player_id: player.id, statut, priorite: "Moyenne" }));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['watchList'] }),
    onError: (err) => setMutError(err?.message || "Impossible de changer le statut."),
  });

  // ── Doublons (même nom normalisé) ──────────────────────────────────────────
  const dupGroups = (() => {
    const map = {};
    for (const p of players) {
      const k = normName(p.nom);
      if (!k) continue;
      (map[k] = map[k] || []).push(p);
    }
    return Object.values(map).filter((g) => g.length > 1);
  })();
  const dupExtras = dupGroups.reduce((n, g) => n + g.length - 1, 0);

  const cleanDuplicates = async () => {
    if (!window.confirm(`Supprimer ${dupExtras} doublon(s) ? Pour chaque joueur, on garde la fiche la plus complète.`)) return;
    setCleaning(true);
    const score = (p) => Object.values(p).filter((v) => v != null && v !== "").length;
    const toDelete = [];
    for (const g of dupGroups) {
      const sorted = [...g].sort((a, b) => score(b) - score(a));
      for (const p of sorted.slice(1)) {
        // ne supprime que mes propres fiches (pas les données partagées du groupe)
        if (!currentUser || p.created_by_id === currentUser.id) toDelete.push(p);
      }
    }
    for (const p of toDelete) {
      try { await base44.entities.Player.delete(p.id); } catch { /* ignore */ }
    }
    queryClient.invalidateQueries({ queryKey: ['players'] });
    setCleaning(false);
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = !filters.search ||
      player.nom?.toLowerCase().includes(filters.search.toLowerCase()) ||
      player.club_actuel?.toLowerCase().includes(filters.search.toLowerCase());

    const matchesPoste = filters.poste === "all" || player.poste === filters.poste;

    // Âge calculé (champ age sinon depuis la date de naissance) pour ne pas
    // exclure à tort les joueurs qui n'ont que leur date de naissance.
    const pAge = ageOf(player);
    const matchesAge = (!filters.ageMin || (pAge != null && pAge >= parseInt(filters.ageMin))) &&
                       (!filters.ageMax || (pAge != null && pAge <= parseInt(filters.ageMax)));

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

  // Tri des joueurs (âge, club, contrat, valeur marchande, poste, nom).
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    switch (sortBy) {
      case "nom":     return (a.nom || "").localeCompare(b.nom || "");
      case "age":     return (ageOf(a) ?? 999) - (ageOf(b) ?? 999);
      case "club":    return (a.club_actuel || "").localeCompare(b.club_actuel || "");
      case "contrat": return (a.contrat_fin || "9999-12-31").localeCompare(b.contrat_fin || "9999-12-31");
      case "valeur":  return (b.valeur_marchande ?? -1) - (a.valeur_marchande ?? -1);
      case "poste":   return (a.poste || "").localeCompare(b.poste || "");
      default:        return 0; // "recent" : déjà trié par -created_date
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">

        {mutError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            <span className="flex-1">{mutError}</span>
            <button onClick={() => setMutError(null)} className="text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

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

            <div className="mb-4">
              <AdvancedFilters onFiltersChange={setFilters} players={players} />
            </div>

            {/* Doublons détectés */}
            {dupExtras > 0 && (
              <div className="flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-2.5 mb-3 text-sm">
                <span>{t(lang, 'players.dupFound', { n: dupExtras })}</span>
                <Button onClick={cleanDuplicates} disabled={cleaning} size="sm" variant="outline" className="border-amber-300 text-amber-800 hover:bg-amber-100 flex-shrink-0">
                  {cleaning ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Trash2 className="w-4 h-4 mr-1.5" />}{t(lang, 'players.dupClean')}
                </Button>
              </div>
            )}

            {/* Tri */}
            <div className="flex items-center justify-end gap-2 mb-3">
              <span className="text-xs text-slate-400">{t(lang, 'players.sortBy')}</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 rounded-lg border border-slate-200 bg-white px-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10"
              >
                <option value="recent">{t(lang, 'players.sortRecent')}</option>
                <option value="nom">{t(lang, 'players.sortName')}</option>
                <option value="age">{t(lang, 'players.sortAge')}</option>
                <option value="club">{t(lang, 'players.sortClub')}</option>
                <option value="contrat">{t(lang, 'players.sortContract')}</option>
                <option value="valeur">{t(lang, 'players.sortValue')}</option>
                <option value="poste">{t(lang, 'players.sortPosition')}</option>
              </select>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-start">
                {BOARD_ORDER.map((key) => {
                  const cfg = statutConfig(key);
                  const colPlayers = sortedPlayers.filter(
                    (p) => (watchListMap[p.id]?.statut || "Prospect") === key
                  );
                  return (
                    <div key={key} className="bg-slate-50 rounded-xl border border-slate-200 flex flex-col">
                      <div className={`flex items-center justify-between px-3 py-2 rounded-t-xl border-b text-xs font-semibold ${cfg.badge}`}>
                        <span>{cfg.label}</span>
                        <span className="font-bold">{colPlayers.length}</span>
                      </div>
                      <div className="p-2 space-y-2 min-h-[120px] max-h-[72vh] overflow-y-auto">
                        {colPlayers.map((player) => (
                          <BoardCard
                            key={player.id}
                            player={player}
                            statut={key}
                            lang={lang}
                            onOpen={() => navigate(createPageUrl("PlayerDetail") + "?id=" + player.id)}
                            onMove={(p, s) => setStatusMutation.mutate({ player: p, statut: s })}
                          />
                        ))}
                        {colPlayers.length === 0 && (
                          <p className="text-[11px] text-slate-300 text-center py-6">—</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!isLoading && filteredPlayers.length === 0 && (
              <div className="text-center py-20">
                <p className="text-slate-500 text-lg">{t(lang, 'players.noResults')}</p>
              </div>
            )}
          </>
        )}

        {activeTab === "recherche" && (
          <PlayerSearchPage />
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