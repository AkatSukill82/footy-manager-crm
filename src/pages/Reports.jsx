import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { FileText, Download, BarChart3, TrendingUp, Users } from "lucide-react";
import ReportFilters from "../components/reports/ReportFilters";
import PlayerPerformanceReport from "../components/reports/PlayerPerformanceReport";
import TransferTrendsReport from "../components/reports/TransferTrendsReport";
import TeamEfficiencyReport from "../components/reports/TeamEfficiencyReport";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState("players");
  const [filters, setFilters] = useState({
    dateDebut: "",
    dateFin: new Date().toISOString().split('T')[0],
    periode: "tout"
  });
  const [isExporting, setIsExporting] = useState(false);

  const { data: players = [], isLoading: loadingPlayers } = useQuery({
    queryKey: ['players'],
    queryFn: () => base44.entities.Player.list(),
  });

  const { data: transfers = [], isLoading: loadingTransfers } = useQuery({
    queryKey: ['transfers'],
    queryFn: () => base44.entities.Transfer.list(),
  });

  const { data: teams = [], isLoading: loadingTeams } = useQuery({
    queryKey: ['teams'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Team.filter({ created_by: user.email });
    },
  });

  const { data: teamPlayers = [] } = useQuery({
    queryKey: ['team-players'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TeamPlayer.filter({ created_by: user.email });
    },
  });

  const { data: matches = [] } = useQuery({
    queryKey: ['matches'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Match.filter({ created_by: user.email });
    },
  });

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const response = await base44.functions.invoke('generateReport', {
        reportType: activeTab,
        filters
      });

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-${activeTab}-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const isLoading = loadingPlayers || loadingTransfers || loadingTeams;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-slate-500">Chargement des rapports...</div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900">Rapports</h1>
          <p className="text-slate-500 mt-2">Analyse des performances et tendances</p>
        </div>
        <Button 
          onClick={handleExportPDF} 
          disabled={isExporting}
          className="bg-slate-900 hover:bg-slate-800 shadow-lg"
        >
          <Download className="w-4 h-4 mr-2" />
          {isExporting ? "Export..." : "Exporter PDF"}
        </Button>
      </div>

      <ReportFilters filters={filters} onFiltersChange={setFilters} />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-1">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab("players")}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "players"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <BarChart3 className="w-4 h-4 inline mr-2" />
            Joueurs
          </button>
          <button
            onClick={() => setActiveTab("transfers")}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "transfers"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <TrendingUp className="w-4 h-4 inline mr-2" />
            Transferts
          </button>
          <button
            onClick={() => setActiveTab("teams")}
            className={`flex-1 px-6 py-3 rounded-xl font-medium transition-all ${
              activeTab === "teams"
                ? "bg-slate-900 text-white shadow-lg"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Équipes
          </button>
        </div>
      </div>

      <div>
        {activeTab === "players" && (
          <PlayerPerformanceReport players={players} filters={filters} />
        )}
        {activeTab === "transfers" && (
          <TransferTrendsReport transfers={transfers} players={players} filters={filters} />
        )}
        {activeTab === "teams" && (
          <TeamEfficiencyReport 
            teams={teams} 
            teamPlayers={teamPlayers} 
            matches={matches}
            players={players}
          />
        )}
      </div>
    </div>
  );
}