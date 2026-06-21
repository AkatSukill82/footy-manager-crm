import React, { useState } from "react";
import { withOrg } from "../lib/org";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, User, Edit2, Star, Trash2, FileDown, AlertCircle, X, MoreHorizontal, ExternalLink } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import PlayerForm from "../components/players/PlayerForm";
import PlayerStatusModal from "../components/players/PlayerStatusModal";
import TransferHistory from "../components/transfers/TransferHistory";
import PlayerNoteCard from "../components/notes/PlayerNoteCard";
import SimilarPlayers from "../components/players/SimilarPlayers";
import RemindersList from "../components/contacts/RemindersList";
import PlayerComparison from "../components/players/PlayerComparison";
import ImportTransfermarktPhoto from "../components/players/ImportTransfermarktPhoto";
import PlayerFullProfile from "../components/players/PlayerFullProfile";
import PlayerScoutingRatings from "../components/players/PlayerScoutingRatings";
import PlayerChartsPanel from "../components/players/PlayerChartsPanel";
import PlayerStatsPanel from "../components/players/PlayerStatsPanel";
import SyncPlayerButton from "../components/players/SyncPlayerButton";
import UpcomingMatches from "../components/players/UpcomingMatches";
import PlayerMandates from "../components/players/PlayerMandates";
import PlayerRumors from "../components/players/PlayerRumors";
import PlayerNews from "../components/players/PlayerNews";
import { format, isValid } from "date-fns";
import TransfermarktImage from "../components/ui/TransfermarktImage";
import { exportPlayerPDF } from "../lib/exportPlayerPDF";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";
import { useCurrentUser } from "../lib/useCurrentUser";
import ActivityLogList from "../components/activity/ActivityLogList";
import PlayerSofaStats from "../components/players/PlayerSofaStats";
import PlayerFotmobStats from "../components/players/PlayerFotmobStats";
import PlayerVideos from "../components/players/PlayerVideos";
import PlayerMatches from "../components/players/PlayerMatches";
import { playerExternalLinks } from "../lib/externalLinks";

const posteColors = {
  "Gardien": "bg-amber-50 text-amber-700",
  "Défenseur central": "bg-slate-100 text-slate-700",
  "Latéral droit": "bg-slate-100 text-slate-700",
  "Latéral gauche": "bg-slate-100 text-slate-700",
  "Milieu défensif": "bg-slate-100 text-slate-700",
  "Milieu central": "bg-slate-100 text-slate-700",
  "Milieu offensif": "bg-slate-100 text-slate-700",
  "Ailier droit": "bg-slate-100 text-slate-700",
  "Ailier gauche": "bg-slate-100 text-slate-700",
  "Attaquant": "bg-slate-900 text-white"
};

function profileCompleteness(player) {
  let score = 0;
  if (player.nom) score += 10;
  if (player.poste) score += 10;
  if (player.photo_url) score += 15;
  if (player.age) score += 5;
  if (player.nationalite) score += 5;
  if (player.club_actuel) score += 10;
  if (player.contrat_fin) score += 10;
  if (player.valeur_marchande) score += 10;
  if (player.buts != null || player.passes_decisives != null || player.note_moyenne != null) score += 15;
  if (player.taille || player.pied_fort) score += 5;
  if (player.xg != null || player.matchs_joues != null) score += 5;
  return Math.min(score, 100);
}

export default function PlayerDetailPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [mutationError, setMutationError] = useState(null);

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0];
    },
    enabled: !!playerId
  });

  // Réutilise le cache global — zéro requête réseau supplémentaire
  const currentUser = useCurrentUser();
  const userEmail = currentUser?.email;

  const { data: watchListItem } = useQuery({
    queryKey: ['watchListItem', playerId, userEmail],
    queryFn: async () => {
      const items = await base44.entities.WatchList.filter({
        player_id: playerId,
        created_by: userEmail
      });
      return items[0] ?? null;
    },
    enabled: !!playerId && !!userEmail
  });

  const { data: playerNotes = [] } = useQuery({
    queryKey: ['playerNotes', playerId],
    queryFn: () => base44.entities.PlayerNote.filter({ player_id: playerId }),
    enabled: !!playerId
  });

  // Réutilise le cache de la page Players — pas de requête réseau si déjà chargé
  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players', currentUser?.id],
    queryFn: () => base44.entities.Player.filter({}, '-created_date'),
    enabled: !!currentUser?.id,
    staleTime: Infinity
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', playerId, userEmail],
    queryFn: () => base44.entities.Reminder.filter({
      player_id: playerId
    }),
    enabled: !!playerId
  });

  const updatePlayerMutation = useMutation({
    mutationFn: async (data) => {
      await base44.entities.Player.update(playerId, data);
      // Log the change
      const changedFields = Object.keys(data).filter((k) => player && data[k] !== player[k]);
      if (currentUser && changedFields.length > 0) {
        base44.entities.ActivityLog.create({
          entity_type: "Player",
          entity_id: playerId,
          entity_name: player?.nom || "",
          action: "update",
          champs_modifies: JSON.stringify(changedFields),
          user_email: currentUser.email,
          user_name: currentUser.full_name || currentUser.email
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', playerId] });
      queryClient.invalidateQueries({ queryKey: ['players', currentUser?.id] });
      queryClient.invalidateQueries({ queryKey: ['activityLogs', 'Player', playerId] });
      setIsEditing(false);
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour du joueur")
  });

  const deletePlayerMutation = useMutation({
    mutationFn: async () => {
      const pipelineEntries = await base44.entities.Pipeline.filter({ player_id: playerId });
      await Promise.all(pipelineEntries.map((e) => base44.entities.Pipeline.delete(e.id)));
      await base44.entities.Player.delete(playerId);
    },
    onSuccess: () => {
      // Purger le cache du joueur supprimé + rafraîchir les listes liées,
      // sinon la liste Players ressert l'ancien cache jusqu'au refresh manuel.
      queryClient.removeQueries({ queryKey: ['player', playerId] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
      queryClient.invalidateQueries({ queryKey: ['watchListItem'] });
      queryClient.invalidateQueries({ queryKey: ['pipeline'] });
      navigate(createPageUrl("Players"));
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la suppression du joueur")
  });

  const addToWatchListMutation = useMutation({
    mutationFn: (statut) => base44.entities.WatchList.create(withOrg({
      player_id: playerId,
      priorite: "Moyenne",
      statut: statut || "Prospect"
    })),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchListItem', playerId] });
      queryClient.invalidateQueries({ queryKey: ['watchList', userEmail] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de l'ajout à la watchlist")
  });

  const updateWatchListStatusMutation = useMutation({
    mutationFn: (statut) => base44.entities.WatchList.update(watchListItem.id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchListItem', playerId] });
      queryClient.invalidateQueries({ queryKey: ['watchList', userEmail] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour du statut")
  });

  const removeFromWatchListMutation = useMutation({
    mutationFn: () => base44.entities.WatchList.delete(watchListItem.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchListItem', playerId] });
      queryClient.invalidateQueries({ queryKey: ['watchList', userEmail] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors du retrait de la watchlist")
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.PlayerNote.create(withOrg({ ...data, player_id: playerId })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playerNotes', playerId] }),
    onError: (err) => setMutationError(err.message || "Erreur lors de la création de la note")
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlayerNote.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playerNotes', playerId] }),
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour de la note")
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playerNotes', playerId] }),
    onError: (err) => setMutationError(err.message || "Erreur lors de la suppression de la note")
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, statut }) => base44.entities.Reminder.update(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', playerId] });
    },
    onError: (err) => setMutationError(err.message || "Erreur lors de la mise à jour du rappel")
  });

  if (!player) return null;

  if (isEditing) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setIsEditing(false)}
            className="mb-4">
            
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t(lang, 'common.cancel')}
          </Button>
          <PlayerForm
            player={player}
            onSubmit={(data) => updatePlayerMutation.mutate(data)}
            onCancel={() => setIsEditing(false)} />
          
        </div>
      </div>);

  }

  const completeness = profileCompleteness(player);

  const tmUrl = player.lien || (
  player.transfermarkt_id ?
  `https://www.transfermarkt.fr/${
  (player.nom || "joueur").
  toLowerCase().
  normalize("NFD").replace(/[̀-ͯ]/g, "").
  replace(/[^a-z0-9\s-]/g, "").
  trim().replace(/\s+/g, "-")}/profil/spieler/${
  player.transfermarkt_id}` :
  null);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {mutationError &&
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-4">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1">{mutationError}</span>
            <button onClick={() => setMutationError(null)} className="hover:text-red-900"><X className="w-3.5 h-3.5" /></button>
          </div>
        }
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Players"))}
          className="mb-4">
          
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t(lang, 'common.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">

            {/* ── HEADER JOUEUR ── */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5">
              <div className="flex items-start gap-4">

                {/* Photo */}
                <div className="w-16 h-16 rounded-xl bg-slate-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {player.photo_url ?
                  <TransfermarktImage
                    src={player.photo_url}
                    alt={player.nom}
                    className="w-full h-full object-cover"
                    fallback={<User className="w-7 h-7 text-slate-400" />} /> :


                  <User className="w-7 h-7 text-slate-400" />
                  }
                </div>

                {/* Identity */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h1 className="text-xl font-bold text-slate-900 leading-tight">{player.nom}</h1>

                      {/* Ligne 1 : poste · club · ligue */}
                      <p className="text-sm text-slate-500 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        {player.poste &&
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${posteColors[player.poste] || "bg-slate-100 text-slate-600"}`}>
                            {player.poste}
                          </span>
                        }
                        {player.club_actuel && <><span className="text-slate-300">·</span><span>{player.club_actuel}</span></>}
                        {player.ligue && <><span className="text-slate-300">·</span><span className="text-slate-400">{player.ligue}</span></>}
                      </p>

                      {/* Ligne 2 : nationalité · âge · taille · pied */}
                      <p className="text-xs text-slate-400 mt-1 flex flex-wrap items-center gap-x-1.5">
                        {player.nationalite && <span>{player.nationalite}</span>}
                        {player.age && <><span className="text-slate-200">·</span><span>{player.age} ans</span></>}
                        {player.taille && <><span className="text-slate-200">·</span><span>{player.taille} cm</span></>}
                        {player.pied_fort && <><span className="text-slate-200">·</span><span>Pied {player.pied_fort.toLowerCase()}</span></>}
                      </p>

                      {/* Ligne 3 : contrat · valeur · salaire */}
                      <p className="text-xs text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-1.5">
                        {player.contrat_fin && (() => {
                          const d = new Date(player.contrat_fin);
                          if (!isValid(d)) return null;
                          const days = Math.floor((d - new Date()) / (1000 * 60 * 60 * 24));
                          const label = `Contrat ${format(d, "MM/yyyy")}`;
                          const urgent = days < 180;
                          return <span className={urgent ? "text-orange-500 font-medium" : ""}>{label}</span>;
                        })()}
                        {player.valeur_marchande && <><span className="text-slate-200">·</span><span className="font-semibold text-slate-700">{player.valeur_marchande >= 1 ? `${player.valeur_marchande}M€` : `${Math.round(player.valeur_marchande * 1000)}K€`}</span></>}
                        {player.salaire && <><span className="text-slate-200">·</span><span>{player.salaire}K€/mois</span></>}
                      </p>
                    </div>

                    {/* Actions : watchlist + ⋯ */}
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setStatusModalOpen(true)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        watchListItem ?
                        "bg-slate-900 text-white border-slate-900" :
                        "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"}`
                        }>
                        
                        <Star className={`w-3 h-3 ${watchListItem ? "fill-white" : ""}`} />
                        <span className="hidden sm:inline">{watchListItem ? watchListItem.statut : "Suivre"}</span>
                      </button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-400 hover:text-slate-700 hover:border-slate-300 transition-all">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => exportPlayerPDF(player, playerNotes[0])}>
                            <FileDown className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            Exporter PDF
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 focus:bg-red-50"
                            onClick={() => {if (confirm(t(lang, 'players.deleteConfirm'))) deletePlayerMutation.mutate();}}>
                            
                            <Trash2 className="w-3.5 h-3.5 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Stats clés inline */}
                  {(player.matchs_joues != null || player.buts != null || player.passes_decisives != null || player.note_moyenne != null || player.xg != null) &&
                  <div className="flex items-center gap-4 mt-3 pt-3 border-t border-slate-50 flex-wrap">
                      {player.matchs_joues != null && <span className="text-xs text-slate-500"><span className="font-bold text-slate-900 text-sm">{player.matchs_joues}</span> MJ</span>}
                      {player.buts != null && <span className="text-xs text-slate-500"><span className="font-bold text-slate-900 text-sm">{player.buts}</span> ⚽</span>}
                      {player.passes_decisives != null && <span className="text-xs text-slate-500"><span className="font-bold text-slate-900 text-sm">{player.passes_decisives}</span> 🅰</span>}
                      {player.note_moyenne != null && <span className="text-xs text-slate-500"><span className="font-bold text-slate-900 text-sm">{player.note_moyenne}</span> ★</span>}
                      {player.xg != null && <span className="text-xs text-slate-500"><span className="font-bold text-slate-900 text-sm">{player.xg}</span> xG</span>}
                    </div>
                  }

                  {/* Liens externes — directement sous les stats */}
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {playerExternalLinks({ ...player, transfermarkt_url: tmUrl }).map((l) =>
                    <a key={l.label} href={l.url} target="_blank" rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-[11px] border rounded-md px-2 py-0.5 transition-colors ${l.color}`}>
                        <ExternalLink className="w-3 h-3" />
                        {l.label}
                      </a>
                    )}
                  </div>

                  {/* Complétude + Sync */}
                  <div className="flex items-center gap-3 mt-3">
                    <SyncPlayerButton player={player} onApply={(data) => updatePlayerMutation.mutate(data)} />
                    







                    
                  </div>
                </div>
              </div>
            </div>

            {/* Profil complet identique à Recherche Joueurs */}
            <PlayerFullProfile player={player} />

            {/* Stats par catégorie */}
            <PlayerStatsPanel player={player} />

            {/* Charts & Evolution */}
            <PlayerChartsPanel playerId={playerId} player={player} />

            <PlayerMatches player={player} />

            <PlayerSofaStats player={player} />

            <PlayerFotmobStats player={player} onApply={(data) => updatePlayerMutation.mutate(data)} />

            <TransferHistory player={player} />
          </div>

          <div className="space-y-6">
            <PlayerNoteCard
              notes={playerNotes}
              onCreate={(data) => createNoteMutation.mutate(data)}
              onUpdate={(id, data) => updateNoteMutation.mutate({ id, data })}
              onDelete={(id) => deleteNoteMutation.mutate(id)} />
            

            <PlayerScoutingRatings
              player={player}
              onSave={(data) => updatePlayerMutation.mutateAsync(data)} />
            

            <SimilarPlayers
              currentPlayer={player}
              allPlayers={allPlayers} />
            

            <RemindersList
              reminders={reminders}
              onUpdateStatus={(id, statut) => updateReminderMutation.mutate({ id, statut })} />
            

            <ImportTransfermarktPhoto
              player={player}
              onApply={(data) => updatePlayerMutation.mutate(data)} />
            

            <UpcomingMatches playerClub={player.club_actuel} playerName={player.nom} playerNationality={player.nationalite} />

            <PlayerMandates player={player} />

            <PlayerNews player={player} />

            <PlayerRumors player={player} />

            <ActivityLogList entityId={playerId} entityType="Player" />
          </div>

          {/* Vidéos — pleine largeur, juste au-dessus de l'analyse comparative */}
          <div className="lg:col-span-3">
            <PlayerVideos player={player} />
          </div>

          {/* Comparison section - full width below */}
          <div className="lg:col-span-3">
            <PlayerComparison
              currentPlayer={player}
              allPlayers={allPlayers} />
            
          </div>
        </div>
      </div>

      {/* Player status modal */}
      <PlayerStatusModal
        player={player}
        existingItem={watchListItem}
        open={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        onConfirm={async (statut) => {
          try {
            if (watchListItem) {
              await updateWatchListStatusMutation.mutateAsync(statut);
            } else {
              await addToWatchListMutation.mutateAsync(statut);
            }
          } catch {


            // onError handlers on each mutation display the error banner
          }}} />
      
    </div>);
}