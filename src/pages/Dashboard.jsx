import React from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Users, Star, TrendingUp, Database } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import PlayersByPosition from "../components/dashboard/PlayersByPosition";
import PlayersByAge from "../components/dashboard/PlayersByAge";
import TopPlayers from "../components/dashboard/TopPlayers";
import ContractExpiring from "../components/dashboard/ContractExpiring";

export default function Dashboard() {
  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: watchList = [], isLoading: loadingWatchList } = useQuery({
    queryKey: ['my-watchlist'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    },
  });

  if (loadingPlayers || loadingWatchList) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Chargement des statistiques...</div>
      </div>
    );
  }

  const totalPlayers = players.length;
  const watchedPlayers = watchList.length;
  const totalValue = players.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0);
  
  const watchedPlayerIds = new Set(watchList.map(w => w.player_id));
  const myWatchedPlayers = players.filter(p => watchedPlayerIds.has(p.id));
  const watchListValue = myWatchedPlayers.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Tableau de bord</h1>
        <p className="text-slate-600 mt-1">Vue d'ensemble de votre base de joueurs</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total joueurs"
          value={totalPlayers}
          subtitle="Dans la base de données"
          icon={Database}
          color="blue"
        />
        <StatsCard
          title="Ma liste"
          value={watchedPlayers}
          subtitle="Joueurs suivis"
          icon={Star}
          color="purple"
        />
        <StatsCard
          title="Valeur totale"
          value={`${totalValue.toFixed(1)}M €`}
          subtitle="Base de données complète"
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Valeur ma liste"
          value={`${watchListValue.toFixed(1)}M €`}
          subtitle="Joueurs suivis"
          icon={TrendingUp}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PlayersByPosition players={players} />
        <PlayersByAge players={players} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TopPlayers players={players} />
        <ContractExpiring players={players} />
      </div>
    </div>
  );
}