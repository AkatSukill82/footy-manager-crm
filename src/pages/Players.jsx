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
    const matchesSearch = !filters.search || 
      player.nom?.toLowerCase().includes(filters.search.toLowerCase()) ||
      player.club_actuel?.toLowerCase().includes(filters.search.toLowerCase());
    
    const matchesPoste = filters.poste === "all" || player.poste === filters.poste;
    
    const matchesAge = (!filters.ageMin || player.age >= parseInt(filters.ageMin)) &&
                       (!filters.ageMax || player.age <= parseInt(filters.ageMax));
    
    const matchesClub = !filters.club || 
      player.club_actuel?.toLowerCase().includes(filters.club.toLowerCase());
    
    const matchesBudget = !filters.budgetMax || 
      !player.valeur_marchande || 
      player.valeur_marchande <= parseFloat(filters.budgetMax);
    
    const matchesContrat = filters.contratExpire === "all" || (() => {
      if (!player.contrat_fin) return false;
      const now = new Date();
      const contractEnd = new Date(player.contrat_fin);
      
      switch (filters.contratExpire) {
        case "expired":
          return contractEnd < now;
        case "6months":
          return contractEnd >= now && contractEnd <= new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);
        case "1year":
          return contractEnd >= now && contractEnd <= new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        default:
          return true;
      }
    })();
    
    const matchesNationalite = !filters.nationalite || 
      player.nationalite?.toLowerCase().includes(filters.nationalite.toLowerCase());
    
    const matchesPied = filters.piedFort === "all" || player.pied_fort === filters.piedFort;
    
    return matchesSearch && matchesPoste && matchesAge && matchesClub && 
           matchesBudget && matchesContrat && matchesNationalite && matchesPied;
  });

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-950">Joueurs</h1>
          <p className="text-slate-500 mt-2">{filteredPlayers.length} / {players.length} joueurs</p>
        </div>
        <Button
          onClick={() => setShowForm(!showForm)}
          className="bg-slate-950 hover:bg-slate-800 rounded-2xl h-12 px-6"
        >
          <Plus className="w-5 h-5 mr-2" />
          Ajouter
        </Button>
      </div>

      {showForm && (
        <div className="mb-8">
          <PlayerForm
            onSubmit={(data) => createMutation.mutate(data)}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      <div className="mb-8">
        <AdvancedFilters onFiltersChange={setFilters} />
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
          <p className="text-slate-500">Aucun joueur trouvé</p>
        </div>
      )}
    </div>
  );
}