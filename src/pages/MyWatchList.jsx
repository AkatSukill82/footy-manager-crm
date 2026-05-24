import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Loader2, Trash2 } from "lucide-react";
import PlayerCard from "../components/players/PlayerCard";
import { useCurrentUser } from "../lib/useCurrentUser";

const prioriteColors = {
  "Haute": "bg-red-100 text-red-800 border-red-300",
  "Moyenne": "bg-yellow-100 text-yellow-800 border-yellow-300",
  "Basse": "bg-green-100 text-green-800 border-green-300"
};

const statutColors = {
  "En observation": "bg-blue-100 text-blue-800",
  "À contacter": "bg-purple-100 text-purple-800",
  "Négociation": "bg-orange-100 text-orange-800",
  "Abandonné": "bg-slate-100 text-slate-800"
};

export default function MyWatchListPage() {
  const queryClient = useQueryClient();
  const [filterStatut, setFilterStatut] = useState("all");
  const user = useCurrentUser();
  const userEmail = user?.email;

  const { data: watchList = [], isLoading } = useQuery({
    queryKey: ['watchList', userEmail],
    queryFn: () => base44.entities.WatchList.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['myNotes', userEmail],
    queryFn: () => base44.entities.PlayerNote.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const updateWatchListMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.WatchList.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
    },
  });

  const removeFromWatchListMutation = useMutation({
    mutationFn: (id) => base44.entities.WatchList.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['watchList'] });
    },
  });

  const playersMap = Object.fromEntries(players.map(p => [p.id, p]));
  const notesMap = Object.fromEntries(notes.map(n => [n.player_id, n]));

  const filteredWatchList = filterStatut === "all" 
    ? watchList 
    : watchList.filter(w => w.statut === filterStatut);

  const watchedPlayers = filteredWatchList
    .map(w => ({ ...w, player: playersMap[w.player_id], note: notesMap[w.player_id] }))
    .filter(w => w.player);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Ma liste de suivi</h1>
            <p className="text-slate-600 mt-1">{watchList.length} joueur{watchList.length > 1 ? 's' : ''} suivi{watchList.length > 1 ? 's' : ''}</p>
          </div>
        </div>

        <div className="mb-6 flex gap-4">
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="En observation">En observation</SelectItem>
              <SelectItem value="À contacter">À contacter</SelectItem>
              <SelectItem value="Négociation">Négociation</SelectItem>
              <SelectItem value="Abandonné">Abandonné</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
          </div>
        ) : watchedPlayers.length === 0 ? (
          <Card>
            <CardContent className="py-20 text-center">
              <Star className="w-16 h-16 mx-auto text-slate-300 mb-4" />
              <p className="text-slate-500 text-lg">Aucun joueur dans votre liste de suivi</p>
              <p className="text-slate-400 mt-2">Ajoutez des joueurs depuis la base commune</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {watchedPlayers.map((item) => (
              <Card key={item.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <PlayerCard player={item.player} inWatchList={true} />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge className={prioriteColors[item.priorite]}>
                      Priorité: {item.priorite}
                    </Badge>
                    <Badge className={statutColors[item.statut]}>
                      {item.statut}
                    </Badge>
                  </div>

                  {item.note && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm font-semibold text-blue-900 mb-1">Ma note:</p>
                      {item.note.evaluation && (
                        <p className="text-2xl font-bold text-blue-600">{item.note.evaluation}/10</p>
                      )}
                      {item.note.interet && (
                        <Badge className="mt-2 bg-blue-100 text-blue-800">
                          Intérêt: {item.note.interet}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Select
                      value={item.priorite}
                      onValueChange={(value) => updateWatchListMutation.mutate({ 
                        id: item.id, 
                        data: { priorite: value } 
                      })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Haute">Priorité haute</SelectItem>
                        <SelectItem value="Moyenne">Priorité moyenne</SelectItem>
                        <SelectItem value="Basse">Priorité basse</SelectItem>
                      </SelectContent>
                    </Select>

                    <Select
                      value={item.statut}
                      onValueChange={(value) => updateWatchListMutation.mutate({ 
                        id: item.id, 
                        data: { statut: value } 
                      })}
                    >
                      <SelectTrigger className="flex-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="En observation">En observation</SelectItem>
                        <SelectItem value="À contacter">À contacter</SelectItem>
                        <SelectItem value="Négociation">Négociation</SelectItem>
                        <SelectItem value="Abandonné">Abandonné</SelectItem>
                      </SelectContent>
                    </Select>

                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => removeFromWatchListMutation.mutate(item.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}