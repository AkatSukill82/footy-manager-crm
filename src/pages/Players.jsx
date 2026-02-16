import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Plus, Loader2 } from "lucide-react";
import PlayerCard from "../components/players/PlayerCard";
import AdvancedFilters from "../components/players/AdvancedFilters";
import PlayerForm from "../components/players/PlayerForm";

export default function PlayersPage() {
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

  const { data: players = [], isLoading } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list('-created_date'),
  });

  const { data: watchList = [] } = useQuery({
    queryKey: ['watchList'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Player.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['players'] });
      setShowForm(false);
    },
  });

  const watchListPlayerIds = watchList.map(w => w.player_id);

  const filteredPlayers = players.filter(player => {
    if (filters.search && !player.nom.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.poste !== "all" && player.poste !== filters.poste) {
      return false;
    }
    if (filters.club && !player.club_actuel?.toLowerCase().includes(filters.club.toLowerCase())) {
      return false;
    }
    if (filters.ageRange !== "all") {
      const age = player.age;
      if (filters.ageRange === "18-21" && (age < 18 || age > 21)) return false;
      if (filters.ageRange === "22-25" && (age < 22 || age > 25)) return false;
      if (filters.ageRange === "26-30" && (age < 26 || age > 30)) return false;
      if (filters.ageRange === "31+" && age < 31) return false;
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Base de joueurs</h1>
            <p className="text-slate-600 mt-1">{players.length} joueurs enregistrés</p>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Ajouter un joueur
          </Button>
        </div>

        {showForm && (
          <div className="mb-6">
            <PlayerForm
              onSubmit={(data) => createMutation.mutate(data)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        )}

        <div className="mb-6">
          <PlayerFilters filters={filters} onFiltersChange={setFilters} />
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
                inWatchList={watchListPlayerIds.includes(player.id)}
              />
            ))}
          </div>
        )}

        {!isLoading && filteredPlayers.length === 0 && (
          <div className="text-center py-20">
            <p className="text-slate-500 text-lg">Aucun joueur trouvé</p>
          </div>
        )}
      </div>
    </div>
  );
}