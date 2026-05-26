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
import { useCurrentUser } from "../lib/useCurrentUser";
import { useLanguage } from "../lib/LanguageContext";
import { t } from "../i18n/translations";

export default function Dashboard() {
  const { lang } = useLanguage();
  const [activeView, setActiveView] = useState("personalized");
  const user = useCurrentUser();
  const userEmail = user?.email;

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list()
  });

  const { data: watchList = [], isLoading: loadingWatchList } = useQuery({
    queryKey: ['my-watchlist', userEmail],
    queryFn: () => base44.entities.WatchList.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: negociations = [] } = useQuery({
    queryKey: ['dashboard-negociations', userEmail],
    queryFn: () => base44.entities.TransferNegociation.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  const { data: insights = [] } = useQuery({
    queryKey: ['dashboard-insights'],
    queryFn: () => base44.entities.AgentInsight.list('-created_date', 20)
  });

  const { data: reminders = [] } = useQuery({
    queryKey: ['dashboard-reminders', userEmail],
    queryFn: () => base44.entities.Reminder.filter({ created_by: userEmail }),
    enabled: !!userEmail,
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
    queryKey: ['dashboard-teams', userEmail],
    queryFn: () => base44.entities.Team.filter({ created_by: userEmail }),
    enabled: !!userEmail,
  });

  if (loadingPlayers || loadingWatchList) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">{t(lang, 'dashboard.loading')}</div>
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
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900">{t(lang, 'dashboard.title')}</h1>
        
      </div>

      <Tabs value={activeView} onValueChange={setActiveView} className="space-y-4 md:space-y-6">
        <TabsList className="grid w-full max-w-xs grid-cols-2">
          <TabsTrigger value="personalized" className="flex items-center gap-2">
            <LayoutDashboard className="w-4 h-4" />
            {t(lang, 'dashboard.personalised')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            {t(lang, 'dashboard.analysis')}
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
              title={t(lang, 'dashboard.totalPlayers')}
              value={totalPlayers}
              subtitle={t(lang, 'dashboard.totalPlayersDesc')}
              color="blue" />

            <StatsCard
              title={t(lang, 'dashboard.myList')}
              value={watchedPlayers}
              subtitle={t(lang, 'dashboard.myListDesc')}
              color="purple" />

            <StatsCard
              title={t(lang, 'dashboard.totalValue')}
              value={`${totalValue.toFixed(1)}M €`}
              subtitle={t(lang, 'dashboard.totalValueDesc')}
              color="green" />

            <StatsCard
              title={t(lang, 'dashboard.myListValue')}
              value={`${watchListValue.toFixed(1)}M €`}
              subtitle={t(lang, 'dashboard.myListDesc')}
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