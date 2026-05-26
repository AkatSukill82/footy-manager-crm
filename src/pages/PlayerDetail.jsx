import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, User, MapPin, Calendar, TrendingUp, Ruler, Edit2, Star, Trash2, FileDown } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "../utils";
import PlayerForm from "../components/players/PlayerForm";
import PlayerStatusModal from "../components/players/PlayerStatusModal";
import TransferHistory from "../components/transfers/TransferHistory";
import TransferForm from "../components/transfers/TransferForm";
import PlayerNoteCard from "../components/notes/PlayerNoteCard";
import SimilarPlayers from "../components/players/SimilarPlayers";
import ContactHistory from "../components/contacts/ContactHistory";
import RemindersList from "../components/contacts/RemindersList";
import EnrichPlayerAI from "../components/players/EnrichPlayerAI";
import PlayerComparison from "../components/players/PlayerComparison";
import ImportTransfermarktPhoto from "../components/players/ImportTransfermarktPhoto";
import PlayerFullProfile from "../components/players/PlayerFullProfile";
import PlayerScoutingRatings from "../components/players/PlayerScoutingRatings";
import PlayerChartsPanel from "../components/players/PlayerChartsPanel";
import SyncPlayerButton from "../components/players/SyncPlayerButton";
import { format } from "date-fns";
import TransfermarktImage from "../components/ui/TransfermarktImage";
import { exportPlayerPDF } from "../lib/exportPlayerPDF";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

const posteColors = {
  "Gardien": "bg-yellow-100 text-yellow-800",
  "Défenseur central": "bg-blue-100 text-blue-800",
  "Latéral droit": "bg-blue-100 text-blue-800",
  "Latéral gauche": "bg-blue-100 text-blue-800",
  "Milieu défensif": "bg-green-100 text-green-800",
  "Milieu central": "bg-green-100 text-green-800",
  "Milieu offensif": "bg-purple-100 text-purple-800",
  "Ailier droit": "bg-orange-100 text-orange-800",
  "Ailier gauche": "bg-orange-100 text-orange-800",
  "Attaquant": "bg-red-100 text-red-800"
};

export default function PlayerDetailPage() {
  const { lang } = useLanguage();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const urlParams = new URLSearchParams(window.location.search);
  const playerId = urlParams.get('id');
  const [isEditing, setIsEditing] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);

  const { data: player } = useQuery({
    queryKey: ['player', playerId],
    queryFn: async () => {
      const players = await base44.entities.Player.filter({ id: playerId });
      return players[0];
    },
    enabled: !!playerId,
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['transfers', playerId],
    queryFn: () => base44.entities.Transfer.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  // Single auth call shared by all user-scoped queries
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 5 * 60 * 1000,
  });
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
    enabled: !!playerId && !!userEmail,
  });

  const { data: playerNotes = [] } = useQuery({
    queryKey: ['playerNotes', playerId],
    queryFn: () => base44.entities.PlayerNote.filter({ player_id: playerId }),
    enabled: !!playerId,
  });

  const { data: allPlayers = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: contacts = [] } = useQuery({
    queryKey: ['contacts', playerId, userEmail],
    queryFn: () => base44.entities.Contact.filter({
      player_id: playerId,
      created_by: userEmail
    }),
    enabled: !!playerId && !!userEmail,
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['reminders', playerId, userEmail],
    queryFn: () => base44.entities.Reminder.filter({
      player_id: playerId,
      created_by: userEmail
    }),
    enabled: !!playerId && !!userEmail,
  });

  const updatePlayerMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.update(playerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['player', playerId] });
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setIsEditing(false);
    },
  });

  const deletePlayerMutation = useMutation({
    mutationFn: () => base44.entities.Player.delete(playerId),
    onSuccess: () => {
      navigate(createPageUrl("Players"));
    },
  });

  const addToWatchListMutation = useMutation({
    mutationFn: (statut) => base44.entities.WatchList.create({
      player_id: playerId,
      priorite: "Moyenne",
      statut: statut || "Prospect",
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchListItem', playerId] });
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
    },
  });

  const updateWatchListStatusMutation = useMutation({
    mutationFn: (statut) => base44.entities.WatchList.update(watchListItem.id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchListItem', playerId] });
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
    },
  });

  const removeFromWatchListMutation = useMutation({
    mutationFn: () => base44.entities.WatchList.delete(watchListItem.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchListItem', playerId] });
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
    },
  });

  const createTransferMutation = useMutation({
    mutationFn: (data) => base44.entities.Transfer.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers', playerId] });
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: (data) => base44.entities.PlayerNote.create({ ...data, player_id: playerId }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playerNotes', playerId] }),
  });

  const updateNoteMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.PlayerNote.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playerNotes', playerId] }),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id) => base44.entities.PlayerNote.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['playerNotes', playerId] }),
  });

  const updateReminderMutation = useMutation({
    mutationFn: ({ id, statut }) => base44.entities.Reminder.update(id, { statut }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reminders', playerId] });
    },
  });

  if (!player) return null;

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setIsEditing(false)}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t(lang, 'common.cancel')}
          </Button>
          <PlayerForm
            player={player}
            onSubmit={(data) => updatePlayerMutation.mutate(data)}
            onCancel={() => setIsEditing(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate(createPageUrl("Players"))}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t(lang, 'common.back')}
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex gap-4">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center overflow-hidden border-2 border-white shadow-md">
                      {player.photo_url ? (
                        <TransfermarktImage
                          src={player.photo_url}
                          alt={player.nom}
                          className="w-full h-full object-cover"
                          fallback={<User className="w-12 h-12 text-slate-400" />}
                        />
                      ) : (
                        <User className="w-12 h-12 text-slate-400" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-3xl">{player.nom}</CardTitle>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={posteColors[player.poste] || "bg-gray-100 text-gray-800"}>
                          {player.poste}
                        </Badge>
                        {player.pied_fort && (
                          <Badge variant="outline">{player.pied_fort}</Badge>
                        )}
                        {player.club_actuel && (
                          <Badge variant="outline" className="text-slate-500">{player.club_actuel}</Badge>
                        )}
                      </div>
                      <div className="mt-3">
                        <SyncPlayerButton
                          player={player}
                          onApply={(data) => updatePlayerMutation.mutate(data)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      title={t(lang, 'players.exportPDF')}
                      onClick={() => exportPlayerPDF(player, playerNotes[0])}
                    >
                      <FileDown className="w-4 h-4 text-blue-600" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      title={watchListItem ? t(lang, 'players.trackStatus', { statut: watchListItem.statut }) : t(lang, 'players.addToWatch')}
                      onClick={() => setStatusModalOpen(true)}
                    >
                      <Star className={watchListItem ? "w-4 h-4 fill-yellow-400 text-yellow-400" : "w-4 h-4"} />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        if (confirm(t(lang, 'players.deleteConfirm'))) {
                          deletePlayerMutation.mutate();
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {player.age && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">{t(lang, 'playerDetail.age')}</p>
                        <p className="font-semibold">{player.age}</p>
                      </div>
                    </div>
                  )}
                  
                  {player.nationalite && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">{t(lang, 'playerDetail.nationality')}</p>
                        <p className="font-semibold">{player.nationalite}</p>
                      </div>
                    </div>
                  )}
                  
                  {player.club_actuel && (
                    <div className="flex items-center gap-3">
                      <MapPin className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">{t(lang, 'playerDetail.club')}</p>
                        <p className="font-semibold">{player.club_actuel}</p>
                      </div>
                    </div>
                  )}
                  
                  {player.valeur_marchande && (
                    <div className="flex items-center gap-3">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      <div>
                        <p className="text-sm text-slate-600">{t(lang, 'playerDetail.value')}</p>
                        <p className="font-bold text-green-600">{player.valeur_marchande} M€</p>
                      </div>
                    </div>
                  )}
                  
                  {player.taille && (
                    <div className="flex items-center gap-3">
                      <Ruler className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">{t(lang, 'playerDetail.height')}</p>
                        <p className="font-semibold">{player.taille} cm</p>
                      </div>
                    </div>
                  )}
                  
                  {player.contrat_fin && (
                    <div className="flex items-center gap-3">
                      <Calendar className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="text-sm text-slate-600">{t(lang, 'playerDetail.contractEnd')}</p>
                        <p className="font-semibold">{format(new Date(player.contrat_fin), "dd/MM/yyyy")}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Profil complet identique à Recherche Joueurs */}
            <PlayerFullProfile player={player} />

            {/* Charts & Evolution */}
            <PlayerChartsPanel playerId={playerId} player={player} />

            <TransferHistory transfers={transfers} />
            
            <TransferForm
              playerId={playerId}
              onSubmit={(data) => createTransferMutation.mutate(data)}
            />

            <ContactHistory contacts={contacts} />
          </div>

          <div className="space-y-6">
            <PlayerNoteCard
              notes={playerNotes}
              onCreate={(data) => createNoteMutation.mutate(data)}
              onUpdate={(id, data) => updateNoteMutation.mutate({ id, data })}
              onDelete={(id) => deleteNoteMutation.mutate(id)}
            />

            <PlayerScoutingRatings
              player={player}
              onSave={(data) => updatePlayerMutation.mutateAsync(data)}
            />

            <SimilarPlayers
              currentPlayer={player}
              allPlayers={allPlayers}
            />

            <RemindersList 
              reminders={reminders}
              onUpdateStatus={(id, statut) => updateReminderMutation.mutate({ id, statut })}
            />

            <ImportTransfermarktPhoto
              player={player}
              onApply={(data) => updatePlayerMutation.mutate(data)}
            />

            <EnrichPlayerAI
              player={player}
              onApply={(data) => updatePlayerMutation.mutate(data)}
            />
          </div>

          {/* Comparison section - full width below */}
          <div className="lg:col-span-3">
            <PlayerComparison
              currentPlayer={player}
              allPlayers={allPlayers}
            />
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
          if (watchListItem) {
            await updateWatchListStatusMutation.mutateAsync(statut);
          } else {
            await addToWatchListMutation.mutateAsync(statut);
          }
        }}
      />
    </div>
  );
}