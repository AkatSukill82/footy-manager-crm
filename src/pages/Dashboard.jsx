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
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-950">Aperçu</h1>
          <p className="text-slate-500 mt-2">Statistiques et tendances</p>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:shadow-xl transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Database className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-950 mb-1">{totalPlayers}</div>
          <div className="text-sm text-slate-500">Joueurs</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:shadow-xl transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-950 mb-1">{watchedPlayers}</div>
          <div className="text-sm text-slate-500">Suivis</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:shadow-xl transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-950 mb-1">{totalValue.toFixed(0)}M</div>
          <div className="text-sm text-slate-500">Valeur totale</div>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-200 hover:shadow-xl transition-all cursor-pointer group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-slate-950 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
          </div>
          <div className="text-4xl font-bold text-slate-950 mb-1">{watchListValue.toFixed(0)}M</div>
          <div className="text-sm text-slate-500">Ma liste</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <PlayersByPosition players={players} />
        <PlayersByAge players={players} />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <TopPlayers players={players} />
        <ContractExpiring players={players} />
      </div>
    </div>
  );
}