import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Loader2, Trash2 } from "lucide-react";
import PlayerCard from "../components/players/PlayerCard";

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

  const { data: watchList = [], isLoading } = useQuery({
    queryKey: ['watchList'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const { data: players = [] } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: notes = [] } = useQuery({
    queryKey: ['myNotes'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.PlayerNote.filter({ created_by: user.email });
    },
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
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-950">Ma liste</h1>
          <p className="text-slate-500 mt-2">{watchedPlayers.length} joueur{watchedPlayers.length > 1 ? 's' : ''}</p>
        </div>
        <Select value={filterStatut} onValueChange={setFilterStatut}>
          <SelectTrigger className="w-48 rounded-2xl h-12">
            <SelectValue placeholder="Tous" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
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
        <div className="bg-white rounded-3xl border border-slate-200 py-20 text-center">
          <Star className="w-16 h-16 mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500 text-lg">Aucun joueur suivi</p>
          <p className="text-slate-400 mt-2">Ajoutez des joueurs depuis la base</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {watchedPlayers.map((item) => (
            <div key={item.id} className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl transition-all">
              <div className="mb-4">
                <PlayerCard player={item.player} inWatchList={true} />
              </div>
              
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={prioriteColors[item.priorite]}>
                    {item.priorite}
                  </Badge>
                  <Badge className={statutColors[item.statut]}>
                    {item.statut}
                  </Badge>
                </div>

                {item.note && item.note.evaluation && (
                  <div className="bg-slate-50 rounded-2xl p-4">
                    <div className="text-3xl font-bold text-slate-950">{item.note.evaluation}<span className="text-lg text-slate-400">/10</span></div>
                    <div className="text-sm text-slate-500 mt-1">Évaluation</div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Select
                    value={item.statut}
                    onValueChange={(value) => updateWatchListMutation.mutate({ 
                      id: item.id, 
                      data: { statut: value } 
                    })}
                  >
                    <SelectTrigger className="flex-1 rounded-2xl">
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
                    className="rounded-2xl"
                    onClick={() => removeFromWatchListMutation.mutate(item.id)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}