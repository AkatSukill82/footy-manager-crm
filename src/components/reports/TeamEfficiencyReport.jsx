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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{totalTeams}</div>
              <div className="text-sm text-slate-600 mt-1">Équipes créées</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">{activeTeams}</div>
              <div className="text-sm text-slate-600 mt-1">Équipes actives</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">{totalMatches}</div>
              <div className="text-sm text-slate-600 mt-1">Matchs joués</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Classement des équipes</CardTitle>
          </CardHeader>
          <CardContent>
            {rankingData.length === 0 ? (
              <p className="text-center text-slate-500 py-8">Aucun match joué</p>
            ) : (
              <div className="space-y-2">
                {rankingData.map((team) => (
                  <div key={team.rang} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                        {team.rang}
                      </div>
                      <span className="font-medium">{team.nom}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-slate-600">
                        {team.victoires}V-{team.nuls}N-{team.defaites}D
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-800 font-bold">
                        {team.points} pts
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valeur des équipes</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={valueComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valeur" fill="#10b981" name="Valeur (M€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Taux de victoire</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={winRateData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="taux" fill="#3b82f6" name="Taux de victoire (%)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {topTeams.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance globale (Top 5)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="metric" />
                  <PolarRadiusAxis />
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
                  <Tooltip />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}