import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";

export default function TeamEfficiencyReport({ teams, teamPlayers, matches, players }) {
  // Calculate team statistics
  const teamsWithStats = teams.map(team => {
    const playerCount = teamPlayers.filter(tp => tp.team_id === team.id).length;
    const teamPlayersList = teamPlayers.filter(tp => tp.team_id === team.id);
    const totalValue = teamPlayersList.reduce((sum, tp) => {
      const player = players.find(p => p.id === tp.player_id);
      return sum + (player?.valeur_marchande || 0);
    }, 0);
    
    const points = (team.victoires || 0) * 3 + (team.nuls || 0);
    const goalDiff = (team.buts_pour || 0) - (team.buts_contre || 0);
    const winRate = team.matchs_joues > 0 ? ((team.victoires || 0) / team.matchs_joues * 100) : 0;
    
    return {
      ...team,
      playerCount,
      totalValue,
      points,
      goalDiff,
      winRate,
      avgGoalsFor: team.matchs_joues > 0 ? (team.buts_pour / team.matchs_joues).toFixed(2) : 0,
      avgGoalsAgainst: team.matchs_joues > 0 ? (team.buts_contre / team.matchs_joues).toFixed(2) : 0
    };
  });

  // Rankings
  const rankingData = [...teamsWithStats]
    .filter(t => t.matchs_joues > 0)
    .sort((a, b) => b.points - a.points || b.goalDiff - a.goalDiff)
    .slice(0, 10)
    .map((t, i) => ({
      rang: i + 1,
      nom: t.nom.length > 12 ? t.nom.substring(0, 10) + "..." : t.nom,
      points: t.points,
      victoires: t.victoires,
      nuls: t.nuls,
      defaites: t.defaites
    }));

  // Team value comparison
  const valueComparison = [...teamsWithStats]
    .sort((a, b) => b.totalValue - a.totalValue)
    .slice(0, 8)
    .map(t => ({
      nom: t.nom.length > 10 ? t.nom.substring(0, 8) + "..." : t.nom,
      valeur: t.totalValue.toFixed(1)
    }));

  // Win rate comparison
  const winRateData = [...teamsWithStats]
    .filter(t => t.matchs_joues > 0)
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 8)
    .map(t => ({
      nom: t.nom.length > 10 ? t.nom.substring(0, 8) + "..." : t.nom,
      taux: t.winRate.toFixed(1)
    }));

  // Team performance radar (top 5 teams)
  const topTeams = [...teamsWithStats]
    .filter(t => t.matchs_joues > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 5);

  const radarData = [
    {
      metric: "Victoires",
      ...Object.fromEntries(topTeams.map(t => [t.nom, t.victoires || 0]))
    },
    {
      metric: "Buts pour",
      ...Object.fromEntries(topTeams.map(t => [t.nom, t.buts_pour || 0]))
    },
    {
      metric: "Diff. buts",
      ...Object.fromEntries(topTeams.map(t => [t.nom, Math.max(0, t.goalDiff)]))
    }
  ];

  const totalTeams = teams.length;
  const activeTeams = teams.filter(t => t.matchs_joues > 0).length;
  const totalMatches = matches.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{totalTeams}</div>
            <div className="text-sm text-slate-500 mt-2">Équipes créées</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{activeTeams}</div>
            <div className="text-sm text-slate-500 mt-2">Équipes actives</div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="text-center">
            <div className="text-5xl font-bold text-slate-900">{totalMatches}</div>
            <div className="text-sm text-slate-500 mt-2">Matchs joués</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Classement des équipes</h3>
          {rankingData.length === 0 ? (
            <p className="text-center text-slate-500 py-8">Aucun match joué</p>
          ) : (
            <div className="space-y-2">
              {rankingData.map((team) => (
                <div key={team.rang} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-900 text-white rounded-full flex items-center justify-center font-bold text-sm">
                      {team.rang}
                    </div>
                    <span className="font-medium text-slate-900">{team.nom}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-600 font-medium">
                      {team.victoires}V-{team.nuls}N-{team.defaites}D
                    </span>
                    <div className="bg-slate-900 text-white px-3 py-1 rounded-lg font-bold text-sm">
                      {team.points} pts
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Valeur des équipes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={valueComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="valeur" fill="#0f172a" radius={[8, 8, 0, 0]} name="Valeur (M€)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Taux de victoire</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={winRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Bar dataKey="taux" fill="#0f172a" radius={[8, 8, 0, 0]} name="Taux de victoire (%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {topTeams.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:col-span-2">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance globale (Top 5)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" stroke="#64748b" />
                <PolarRadiusAxis stroke="#64748b" />
                {topTeams.map((team, index) => (
                  <Radar
                    key={team.id}
                    name={team.nom}
                    dataKey={team.nom}
                    stroke={`hsl(${index * 72}, 70%, 50%)`}
                    fill={`hsl(${index * 72}, 70%, 50%)`}
                    fillOpacity={0.3}
                  />
                ))}
                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}