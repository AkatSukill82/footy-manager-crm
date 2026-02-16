import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];

export default function PlayerPerformanceReport({ players, filters }) {
  // Filter by date if needed
  const filteredPlayers = players.filter(player => {
    if (filters.dateDebut && player.created_date) {
      return new Date(player.created_date) >= new Date(filters.dateDebut);
    }
    return true;
  });

  // Top players by value
  const topByValue = [...filteredPlayers]
    .filter(p => p.valeur_marchande)
    .sort((a, b) => b.valeur_marchande - a.valeur_marchande)
    .slice(0, 10)
    .map(p => ({
      nom: p.nom.length > 15 ? p.nom.substring(0, 12) + "..." : p.nom,
      valeur: p.valeur_marchande
    }));

  // Age distribution
  const ageDistribution = {};
  filteredPlayers.forEach(p => {
    if (p.age) {
      const range = p.age < 23 ? "16-22" : p.age < 27 ? "23-26" : p.age < 31 ? "27-30" : "31+";
      ageDistribution[range] = (ageDistribution[range] || 0) + 1;
    }
  });
  const ageData = Object.entries(ageDistribution).map(([range, count]) => ({ range, count }));

  // Position distribution
  const positionData = {};
  filteredPlayers.forEach(p => {
    if (p.poste) {
      positionData[p.poste] = (positionData[p.poste] || 0) + 1;
    }
  });
  const pieData = Object.entries(positionData).map(([name, value]) => ({ name, value }));

  // Average value by position
  const valueByPosition = {};
  const countByPosition = {};
  filteredPlayers.forEach(p => {
    if (p.poste && p.valeur_marchande) {
      valueByPosition[p.poste] = (valueByPosition[p.poste] || 0) + p.valeur_marchande;
      countByPosition[p.poste] = (countByPosition[p.poste] || 0) + 1;
    }
  });
  const avgValueData = Object.entries(valueByPosition).map(([poste, total]) => ({
    poste: poste.length > 12 ? poste.substring(0, 10) + "..." : poste,
    moyenne: (total / countByPosition[poste]).toFixed(1)
  }));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600">{filteredPlayers.length}</div>
              <div className="text-sm text-slate-600 mt-1">Joueurs analysés</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-green-600">
                {(filteredPlayers.reduce((sum, p) => sum + (p.valeur_marchande || 0), 0)).toFixed(1)}M€
              </div>
              <div className="text-sm text-slate-600 mt-1">Valeur totale</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-600">
                {(filteredPlayers.reduce((sum, p) => sum + (p.age || 0), 0) / filteredPlayers.length).toFixed(1)} ans
              </div>
              <div className="text-sm text-slate-600 mt-1">Âge moyen</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Top 10 joueurs par valeur</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topByValue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="nom" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="valeur" fill="#10b981" name="Valeur (M€)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Répartition par poste</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name.substring(0, 8)}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution par âge</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" name="Nombre de joueurs" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Valeur moyenne par poste</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={avgValueData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="poste" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="moyenne" stroke="#8b5cf6" strokeWidth={2} name="Valeur moy. (M€)" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}