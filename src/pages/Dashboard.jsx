import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LayoutDashboard, BarChart3 } from "lucide-react";
import StatsCard from "../components/dashboard/StatsCard";
import PlayersByPosition from "../components/dashboard/PlayersByPosition";
import PlayersByAge from "../components/dashboard/PlayersByAge";
import TopPlayers from "../components/dashboard/TopPlayers";
import ContractExpiring from "../components/dashboard/ContractExpiring";
import PersonalizedDashboard from "../components/dashboard/PersonalizedDashboard";
import EnhancedCharts from "../components/dashboard/EnhancedCharts";
import NotificationSystem from "../components/notifications/NotificationSystem";
import ContractTimeline from "../components/dashboard/ContractTimeline";

export default function Dashboard() {
  const [activeView, setActiveView] = useState("personalized");

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: watchList = [], isLoading: loadingWatchList } = useQuery({
    queryKey: ['my-watchlist'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.WatchList.filter({ created_by: user.email });
    }
  });

  const { data: negociations = [] } = useQuery({
    queryKey: ['dashboard-negociations'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TransferNegociation.filter({ created_by: user.email });
    }
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['dashboard-insights'],
    queryFn: () => base44.entities.AgentInsight.list('-created_date', 20)
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['dashboard-reminders'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Reminder.filter({ created_by: user.email });
    }
  });

  const { data: sharedContent = [] } = useQuery({
    queryKey: ['dashboard-shared'],
    queryFn: () => base44.entities.SharedContent.list('-created_date', 20)
  });

  const { data: transfers = [] } = useQuery({
    queryKey: ['dashboard-transfers'],
    queryFn: () => base44.entities.Transfer.list()
  });

  const { data: teams = [] } = useQuery({
    queryKey: ['dashboard-teams'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Team.filter({ created_by: user.email });
    }
  });

  if (loadingPlayers || loadingWatchList) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Chargement des statistiques...</div>
      </div>);

  }

  const totalPlayers = players.length;
  const watchedPlayers = watchList.length;
  const totalValue = players.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0);

  const watchedPlayerIds = new Set(watchList.map((w) => w.player_id));
  const myWatchedPlayers = players.filter((p) => watchedPlayerIds.has(p.id));
  const watchListValue = myWatchedPlayers.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-4 md:space-y-6">
      <NotificationSystem user={user} />
      
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">Tableau de bord</h1>
        
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="personalized" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            Personnalisé
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analyses
          </TabsTrigger>
        </TabsList>

        <TabsContent value="personalized" className="space-y-6">
          <PersonalizedDashboard
            negociations={negociations}
            insights={insights}
            reminders={reminders}
            sharedContent={sharedContent} />

        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Total joueurs"
              value={totalPlayers}
              subtitle="Dans la base de données"
              color="blue" />

            <StatsCard
              title="Ma liste"
              value={watchedPlayers}
              subtitle="Joueurs suivis"
              color="purple" />

            <StatsCard
              title="Valeur totale"
              value={`${totalValue.toFixed(1)}M €`}
              subtitle="Base de données complète"
              color="green" />

            <StatsCard
              title="Valeur ma liste"
              value={`${watchListValue.toFixed(1)}M €`}
              subtitle="Joueurs suivis"
              color="orange" />

          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <PlayersByPosition players={players} />
            <PlayersByAge players={players} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPlayers players={players} />
            <ContractExpiring players={players} />
          </div>
        </TabsContent>
      </Tabs>

      <ContractTimeline players={players} />

      <EnhancedCharts
        players={players}
        transfers={transfers}
        watchList={watchList}
        teams={teams} />

    </div>);

}