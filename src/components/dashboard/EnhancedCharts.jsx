import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from "recharts";
import { TrendingUp, Users, DollarSign, Activity } from "lucide-react";
import { useLanguage } from "../../lib/LanguageContext";
import { t } from "../../i18n/translations";

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

export default function EnhancedCharts({ players, transfers, watchList, teams }) {
  const { lang } = useLanguage();
  const [chartType, setChartType] = useState("bar");
  const [timeRange, setTimeRange] = useState("all");

  // Données par position
  const positionData = players.reduce((acc, player) => {
    const poste = player.poste || t(lang, 'dashboardCharts.undefined');
    if (!acc[poste]) {
      acc[poste] = { position: poste, count: 0, totalValue: 0 };
    }
    acc[poste].count++;
    acc[poste].totalValue += player.valeur_marchande || 0;
    return acc;
  }, {});

  const positionChartData = Object.values(positionData).map(d => ({
    name: d.position,
    joueurs: d.count,
    valeur: Math.round(d.totalValue)
  }));

  // Évolution des transferts par mois
  const transfersByMonth = transfers.reduce((acc, transfer) => {
    const date = new Date(transfer.date_transfert);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    if (!acc[monthKey]) {
      acc[monthKey] = { month: monthKey, count: 0, value: 0 };
    }
    acc[monthKey].count++;
    acc[monthKey].value += transfer.montant || 0;
    return acc;
  }, {});

  const transferTimelineData = Object.values(transfersByMonth)
    .sort((a, b) => a.month.localeCompare(b.month))
    .slice(-12)
    .map(d => ({
      mois: d.month.split('-')[1] + '/' + d.month.split('-')[0].slice(-2),
      transferts: d.count,
      montant: Math.round(d.value)
    }));

  // Distribution des âges
  const ageDistribution = players.reduce((acc, player) => {
    if (!player.age) return acc;
    const ageGroup = Math.floor(player.age / 5) * 5;
    const label = `${ageGroup}-${ageGroup + 4}`;
    if (!acc[label]) {
      acc[label] = { range: label, count: 0 };
    }
    acc[label].count++;
    return acc;
  }, {});

  const ageChartData = Object.values(ageDistribution).sort((a, b) => {
    const aAge = parseInt(a.range.split('-')[0]);
    const bAge = parseInt(b.range.split('-')[0]);
    return aAge - bAge;
  });

  // Valeur marchande par équipe virtuelle
  const teamValueData = teams.map(team => ({
    name: team.nom,
    valeur: team.budget || 0,
    matchs: team.matchs_joues || 0
  })).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Select value={chartType} onValueChange={setChartType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bar">{t(lang,'dashboardCharts.barChart')}</SelectItem>
            <SelectItem value="line">{t(lang,'dashboardCharts.lineChart')}</SelectItem>
            <SelectItem value="area">{t(lang,'dashboardCharts.areaChart')}</SelectItem>
            <SelectItem value="pie">{t(lang,'dashboardCharts.pieChart')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t(lang,'dashboardCharts.allPeriods')}</SelectItem>
            <SelectItem value="6m">{t(lang,'dashboardCharts.last6Months')}</SelectItem>
            <SelectItem value="1y">{t(lang,'dashboardCharts.lastYear')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribution par position */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              {t(lang,'dashboardCharts.distributionByPosition')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={positionChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="joueurs"
                  >
                    {positionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : chartType === "area" ? (
                <AreaChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="joueurs" stroke="#10b981" fill="#10b981" fillOpacity={0.6} />
                </AreaChart>
              ) : chartType === "line" ? (
                <LineChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="joueurs" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="joueurs" fill="#10b981" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Valeur par position */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5" />
              {t(lang,'dashboardCharts.valueByPosition')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "pie" ? (
                <PieChart>
                  <Pie
                    data={positionChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="valeur"
                  >
                    {positionChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              ) : chartType === "area" ? (
                <AreaChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="valeur" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                </AreaChart>
              ) : chartType === "line" ? (
                <LineChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="valeur" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={positionChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="valeur" fill="#3b82f6" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Évolution des transferts */}
        {transferTimelineData.length > 0 && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t(lang,'dashboardCharts.transfersEvolution')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                {chartType === "area" ? (
                  <AreaChart data={transferTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="transferts" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} />
                    <Area yAxisId="right" type="monotone" dataKey="montant" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.6} />
                  </AreaChart>
                ) : chartType === "line" ? (
                  <LineChart data={transferTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="transferts" stroke="#8b5cf6" strokeWidth={2} />
                    <Line yAxisId="right" type="monotone" dataKey="montant" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                ) : (
                  <BarChart data={transferTimelineData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mois" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="transferts" fill="#8b5cf6" />
                    <Bar yAxisId="right" dataKey="montant" fill="#f59e0b" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Distribution des âges */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              {t(lang,'dashboardCharts.distributionByAge')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              {chartType === "area" ? (
                <AreaChart data={ageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="count" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                </AreaChart>
              ) : chartType === "line" ? (
                <LineChart data={ageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="count" stroke="#ec4899" strokeWidth={2} />
                </LineChart>
              ) : (
                <BarChart data={ageChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="range" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#ec4899" />
                </BarChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}